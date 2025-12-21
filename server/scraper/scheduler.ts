/**
 * Scraper Scheduler
 * Runs scraping jobs on a schedule (Daily at 6 AM EAT)
 */

import { runScraper, getScraperStatus } from './orchestrator';

// Schedule configuration
const EAT_UTC_OFFSET = 3; // EAT is UTC+3
const SCRAPE_HOUR_EAT = 6; // 6 AM EAT
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const RETRY_DELAY_MS = 30 * 60 * 1000; // 30 minutes retry delay
const MAX_RETRIES = 2;

let isRunning = false;
let lastRunResult: any = null;
let scheduledJob: ReturnType<typeof setInterval> | null = null;

/**
 * Start the scheduler
 */
export function startScheduler(): void {
    if (scheduledJob) {
        console.log('⚠️ Scheduler already active');
        return;
    }

    console.log('🕐 Starting event scraper scheduler...');
    console.log(`📅 Schedule: Daily at ${SCRAPE_HOUR_EAT}:00 AM EAT`);

    scheduledJob = setInterval(async () => {
        try {
            const now = new Date();
            const utcHour = now.getUTCHours();
            const eatHour = (utcHour + EAT_UTC_OFFSET) % 24;
            const minutes = now.getUTCMinutes();

            // Trigger precisely at the scheduled hour and minute 0
            if (eatHour === SCRAPE_HOUR_EAT && minutes === 0) {
                console.log(`⏰ Scheduled time reached (${SCRAPE_HOUR_EAT}:00 EAT). Triggering run...`);
                await triggerScheduledRun();
            }
        } catch (error) {
            console.error('❌ Scheduler interval error:', error);
        }
    }, CHECK_INTERVAL_MS);

    // Proactive check on startup: if last run was > 24h ago, run now
    checkAndRunIfNeeded();
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
    if (scheduledJob) {
        clearInterval(scheduledJob);
        scheduledJob = null;
        console.log('🛑 Scheduler stopped');
    }
}

/**
 * Check if we need a catch-up run and trigger if so
 */
async function checkAndRunIfNeeded(): Promise<void> {
    try {
        const status = await getScraperStatus();
        const lastRun = status.lastRun;

        if (!lastRun) {
            console.log('📋 No previous scraper runs found. Triggering initial catch-up run in 10s...');
            setTimeout(triggerScheduledRun, 10000); // Small delay to let server settle
            return;
        }

        const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun > 24) {
            console.log(`⏰ Last run was ${hoursSinceLastRun.toFixed(1)} hours ago (>24h). Triggering catch-up run...`);
            triggerScheduledRun();
        } else {
            console.log(`✅ Last run was ${hoursSinceLastRun.toFixed(1)} hours ago. Next run scheduled for 6 AM EAT.`);
        }
    } catch (error) {
        console.error('❌ Error in catch-up check:', error);
    }
}

/**
 * Trigger a scheduled scraper run with retry logic
 */
async function triggerScheduledRun(retryCount = 0): Promise<void> {
    if (isRunning) {
        console.log('⏳ Scraper already in progress, skipping trigger.');
        return;
    }

    isRunning = true;
    console.log(`\n🚀 [Scheduler] Starting run (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);

    try {
        const result = await runScraper();
        lastRunResult = result;

        if (result.success) {
            console.log(`✅ [Scheduler] Run successful: ${result.totalEvents} events processed`);
        } else {
            console.warn('⚠️ [Scheduler] Run finished with some failures');
            handleRetry(retryCount);
        }
    } catch (error) {
        console.error('❌ [Scheduler] Run failed unexpectedly:', error);
        handleRetry(retryCount);
    } finally {
        isRunning = false;
    }
}

function handleRetry(retryCount: number) {
    if (retryCount < MAX_RETRIES) {
        console.log(`🔄 [Scheduler] Scheduling retry #${retryCount + 1} in ${RETRY_DELAY_MS / 60000} mins...`);
        setTimeout(() => triggerScheduledRun(retryCount + 1), RETRY_DELAY_MS);
    } else {
        console.error('❌ [Scheduler] Max retries reached for today.');
    }
}

/**
 * Get internal state for API status check
 */
export function getSchedulerState() {
    return {
        active: !!scheduledJob,
        isRunning,
        lastRunResult
    };
}
