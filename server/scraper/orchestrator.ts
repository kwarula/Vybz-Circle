/**
 * Scraper Orchestrator
 * Coordinates scraping across all platforms and handles database operations
 */

import { createClient } from "@supabase/supabase-js";
import {
    PLATFORM_CONFIGS,
    PlatformConfig,
    PlatformId,
    PlatformScrapeResult,
    ScraperRunResult,
    NormalizedEvent
} from "@shared/scraperSchema";
import { extractPlatformEvents, isFirecrawlConfigured } from "./firecrawl";
import { normalizeEvent, calculateTitleSimilarity } from "./normalizer";

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limit between platforms (2 seconds)
const PLATFORM_DELAY_MS = 2000;

// Similarity threshold for cross-platform deduplication
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Sleep utility
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run scraper for specific platforms or all
 */
export async function runScraper(
    platformIds?: PlatformId[]
): Promise<ScraperRunResult> {
    const startedAt = new Date();
    const results: PlatformScrapeResult[] = [];

    // Check if Firecrawl is configured
    if (!isFirecrawlConfigured()) {
        console.error("❌ Firecrawl API key not configured");
        return {
            startedAt,
            completedAt: new Date(),
            platforms: [],
            totalEvents: 0,
            success: false
        };
    }

    // Determine which platforms to scrape
    const platforms = platformIds
        ? platformIds.map(id => PLATFORM_CONFIGS[id]).filter(Boolean)
        : Object.values(PLATFORM_CONFIGS);

    console.log(`🚀 Starting scrape for ${platforms.length} platforms`);

    // Process platforms sequentially to respect rate limits
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];

        // Add delay between platforms (except first)
        if (i > 0) {
            console.log(`⏳ Waiting ${PLATFORM_DELAY_MS}ms before next platform...`);
            await sleep(PLATFORM_DELAY_MS);
        }

        const result = await scrapePlatform(platform);
        results.push(result);
    }

    // Calculate totals
    const totalEvents = results.reduce((sum, r) => sum + r.eventsInserted + r.eventsUpdated, 0);
    const allSuccess = results.every(r => r.success);

    console.log(`\n📊 Scrape complete: ${totalEvents} total events from ${results.length} platforms`);

    const runResult: ScraperRunResult = {
        startedAt,
        completedAt: new Date(),
        platforms: results,
        totalEvents,
        success: allSuccess
    };

    // Log the run to database
    await logScraperRun(runResult);

    return runResult;
}

/**
 * Scrape a single platform
 */
async function scrapePlatform(platform: PlatformConfig): Promise<PlatformScrapeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let eventsFound = 0;
    let eventsInserted = 0;
    let eventsUpdated = 0;

    console.log(`\n🔍 Scraping ${platform.name}...`);

    try {
        // Extract events using Firecrawl
        const extractResult = await extractPlatformEvents(platform);

        if (!extractResult.success || !extractResult.data?.events) {
            errors.push(extractResult.error || "No events returned");
            return {
                platformId: platform.id,
                success: false,
                eventsFound: 0,
                eventsInserted: 0,
                eventsUpdated: 0,
                errors,
                duration: Date.now() - startTime
            };
        }

        eventsFound = extractResult.data.events.length;
        console.log(`📦 [${platform.name}] Raw events: ${eventsFound}`);

        // Normalize and filter events
        const normalizedEvents: NormalizedEvent[] = [];
        for (const rawEvent of extractResult.data.events) {
            const normalized = normalizeEvent(rawEvent, platform);
            if (normalized) {
                normalizedEvents.push(normalized);
            }
        }

        console.log(`✅ [${platform.name}] Normalized events: ${normalizedEvents.length}`);

        // Upsert events to database
        for (const event of normalizedEvents) {
            try {
                const result = await upsertEvent(event);
                if (result.inserted) eventsInserted++;
                if (result.updated) eventsUpdated++;
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                errors.push(`Failed to upsert "${event.title}": ${message}`);
                console.error(`❌ [${platform.name}] Upsert error:`, message);
            }
        }

        return {
            platformId: platform.id,
            success: errors.length === 0,
            eventsFound,
            eventsInserted,
            eventsUpdated,
            errors,
            duration: Date.now() - startTime
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(message);
        console.error(`❌ [${platform.name}] Scrape failed:`, message);

        return {
            platformId: platform.id,
            success: false,
            eventsFound,
            eventsInserted,
            eventsUpdated,
            errors,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Upsert an event to the database
 * Uses ON CONFLICT for deduplication by (source_platform, external_id)
 */
async function upsertEvent(event: NormalizedEvent): Promise<{ inserted: boolean; updated: boolean }> {
    // Check if this might be a cross-platform duplicate
    const isDuplicate = await checkCrossPlatformDuplicate(event);
    if (isDuplicate) {
        console.log(`🔄 [${event.source_platform}] Skipping cross-platform duplicate: ${event.title}`);
        return { inserted: false, updated: false };
    }

    // Attempt upsert
    const { data, error } = await supabase
        .from('events')
        .upsert(
            {
                title: event.title,
                description: event.description,
                image_url: event.image_url,
                starts_at: event.starts_at?.toISOString(),
                venue_name: event.venue_name,
                organizer_name: event.organizer_name,
                price_range: event.price_range,
                source_platform: event.source_platform,
                source_url: event.source_url,
                external_id: event.external_id,
                is_external: event.is_external,
                ticketing_type: event.ticketing_type,
                source: event.source,
                status: event.status,
                scraped_at: new Date().toISOString()
            },
            {
                onConflict: 'source_platform,external_id',
                ignoreDuplicates: false
            }
        )
        .select('id, created_at, scraped_at')
        .single();

    if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505') {
            // Duplicate - update existing
            const { error: updateError } = await supabase
                .from('events')
                .update({
                    title: event.title,
                    description: event.description,
                    image_url: event.image_url,
                    starts_at: event.starts_at?.toISOString(),
                    venue_name: event.venue_name,
                    organizer_name: event.organizer_name,
                    price_range: event.price_range,
                    source_url: event.source_url,
                    scraped_at: new Date().toISOString()
                })
                .eq('source_platform', event.source_platform)
                .eq('external_id', event.external_id);

            if (updateError) throw updateError;
            return { inserted: false, updated: true };
        }
        throw error;
    }

    // Check if this was an insert or update based on timestamps
    const isInsert = data?.created_at === data?.scraped_at;
    return { inserted: isInsert, updated: !isInsert };
}

/**
 * Check if an event already exists from another platform
 * Uses fuzzy title matching and date proximity
 */
async function checkCrossPlatformDuplicate(event: NormalizedEvent): Promise<boolean> {
    if (!event.starts_at) return false;

    // Find events with similar dates from other platforms
    const dateStart = new Date(event.starts_at);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const { data: similarEvents } = await supabase
        .from('events')
        .select('title, source_platform')
        .neq('source_platform', event.source_platform)
        .gte('starts_at', dateStart.toISOString())
        .lt('starts_at', dateEnd.toISOString());

    if (!similarEvents || similarEvents.length === 0) return false;

    // Check for title similarity
    for (const existing of similarEvents) {
        const similarity = calculateTitleSimilarity(event.title, existing.title);
        if (similarity >= SIMILARITY_THRESHOLD) {
            console.log(`🔗 Found cross-platform match: "${event.title}" ≈ "${existing.title}" (${(similarity * 100).toFixed(1)}%)`);
            return true;
        }
    }

    return false;
}

/**
 * Get the status of the scraper
 */
export async function getScraperStatus(): Promise<{
    configured: boolean;
    lastRun: Date | null;
    platformStats: Record<PlatformId, { count: number; lastScraped: Date | null }>;
}> {
    const configured = isFirecrawlConfigured();

    // Get counts and last scraped times per platform
    const platformStats: Record<string, { count: number; lastScraped: Date | null }> = {};

    for (const platformId of Object.keys(PLATFORM_CONFIGS) as PlatformId[]) {
        const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('source_platform', platformId);

        const { data: latest } = await supabase
            .from('events')
            .select('scraped_at')
            .eq('source_platform', platformId)
            .order('scraped_at', { ascending: false })
            .limit(1)
            .single();

        platformStats[platformId] = {
            count: count || 0,
            lastScraped: latest?.scraped_at ? new Date(latest.scraped_at) : null
        };
    }

    // Find overall last run
    const { data: lastScraped } = await supabase
        .from('events')
        .select('scraped_at')
        .not('scraped_at', 'is', null)
        .order('scraped_at', { ascending: false })
        .limit(1)
        .single();

    return {
        configured,
        lastRun: lastScraped?.scraped_at ? new Date(lastScraped.scraped_at) : null,
        platformStats: platformStats as Record<PlatformId, { count: number; lastScraped: Date | null }>
    };
}

/**
 * Log a scraper run to the database
 */
export async function logScraperRun(result: ScraperRunResult): Promise<void> {
    try {
        const { error } = await supabase
            .from('scraper_runs')
            .insert({
                started_at: result.startedAt.toISOString(),
                completed_at: result.completedAt.toISOString(),
                status: result.success ? 'completed' : 'failed',
                total_events: result.totalEvents,
                events_inserted: result.platforms.reduce((sum, p) => sum + p.eventsInserted, 0),
                events_updated: result.platforms.reduce((sum, p) => sum + p.eventsUpdated, 0),
                platform_results: result.platforms,
                error_message: result.success ? null : result.platforms
                    .filter(p => !p.success)
                    .map(p => `${p.platformId}: ${p.errors.join(', ')}`)
                    .join('; ')
            });

        if (error) {
            console.error('Failed to log scraper run:', error);
        } else {
            console.log('✅ Scraper run logged to database');
        }
    } catch (err) {
        console.error('Error logging scraper run:', err);
    }
}
