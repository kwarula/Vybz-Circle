/**
 * Firecrawl API Client
 * Handles extraction requests with async polling for results
 */

import {
    FirecrawlExtractResponse,
    FirecrawlExtractResponseSchema,
    FIRECRAWL_EVENT_SCHEMA,
    PlatformConfig
} from "@shared/scraperSchema";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

interface ExtractOptions {
    urls: string[];
    prompt: string;
    schema?: object;
    timeout?: number;
}

interface FirecrawlError extends Error {
    statusCode?: number;
    retryable: boolean;
}

// Async job response from POST /extract
interface ExtractJobResponse {
    success: boolean;
    id?: string;
    error?: string;
}

// Poll response from GET /extract/:id
interface ExtractPollResponse {
    success: boolean;
    status?: string; // "pending", "processing", "completed", "failed"
    data?: {
        events?: Array<{
            title: string;
            description?: string;
            imageUrl?: string;
            date?: string;
            time?: string;
            venue?: string;
            organizer?: string;
            price?: string;
            ticketUrl?: string;
        }>;
    };
    error?: string;
}

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract structured data from URLs using Firecrawl (async with polling)
 */
export async function extractFromUrls(options: ExtractOptions): Promise<FirecrawlExtractResponse> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        throw createError("FIRECRAWL_API_KEY not configured", 500, false);
    }

    const { urls, prompt, schema = FIRECRAWL_EVENT_SCHEMA, timeout = 120000 } = options;

    try {
        // Step 1: Start the extraction job
        console.log(`🚀 Starting extraction job for ${urls[0]}...`);

        const startResponse = await fetch(`${FIRECRAWL_API_URL}/extract`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                urls,
                prompt: `${prompt}\n\nIMPORTANT: Return a JSON object with an 'events' array containing all the events you find.`,
                schema
            })
        });

        if (!startResponse.ok) {
            const errorText = await startResponse.text().catch(() => "Unknown error");
            if (startResponse.status === 429) {
                throw createError(`Rate limited: ${errorText}`, 429, true);
            }
            if (startResponse.status === 402) {
                throw createError(`API quota exceeded: ${errorText}`, 402, false);
            }
            throw createError(`Firecrawl API error: ${errorText}`, startResponse.status, startResponse.status >= 500);
        }

        const jobData: ExtractJobResponse = await startResponse.json();

        if (!jobData.success || !jobData.id) {
            throw createError(`Failed to start extraction: ${jobData.error || 'No job ID returned'}`, 500, true);
        }

        const jobId = jobData.id;
        console.log(`📋 Extraction job started: ${jobId}`);

        // Step 2: Poll for results
        const startTime = Date.now();
        const pollInterval = 2000; // 2 seconds

        while (Date.now() - startTime < timeout) {
            await sleep(pollInterval);

            console.log(`⏳ Polling job ${jobId}...`);

            const pollResponse = await fetch(`${FIRECRAWL_API_URL}/extract/${jobId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                }
            });

            if (!pollResponse.ok) {
                const errorText = await pollResponse.text().catch(() => "Unknown error");
                console.warn(`⚠️ Poll error: ${errorText}`);
                continue; // Retry polling
            }

            const pollData: ExtractPollResponse = await pollResponse.json();

            // Check job status
            if (pollData.status === 'completed' || (pollData.success && pollData.data)) {
                console.log(`✅ Extraction complete!`);

                // Parse and return the data
                const result: FirecrawlExtractResponse = {
                    success: true,
                    data: pollData.data
                };

                // DEBUG: Log event count
                console.log(`📦 Found ${pollData.data?.events?.length || 0} events`);

                return result;
            }

            if (pollData.status === 'failed') {
                throw createError(`Extraction failed: ${pollData.error || 'Unknown error'}`, 500, true);
            }

            // Still processing, continue polling
            console.log(`🔄 Status: ${pollData.status || 'processing'}...`);
        }

        throw createError("Extraction timed out", 408, true);
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw createError("Request timed out", 408, true);
        }
        throw error;
    }
}

/**
 * Extract events from a platform with retry logic
 */
export async function extractPlatformEvents(
    platform: PlatformConfig,
    maxRetries: number = 2
): Promise<FirecrawlExtractResponse> {
    const url = `${platform.baseUrl}${platform.eventsPath}`;

    // For TicketSasa, use scrape + markdown parsing (more reliable)
    if (platform.id === 'ticketsasa') {
        return await scrapeAndParseTicketSasa(url, maxRetries);
    }

    // For other platforms, use extract API
    let lastError: FirecrawlError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`🔍 [${platform.name}] Attempt ${attempt + 1}/${maxRetries} - Extracting from ${url}`);

            const result = await extractFromUrls({
                urls: [url],
                prompt: platform.extractionPrompt
            });

            if (result.success && result.data?.events?.length) {
                console.log(`✅ [${platform.name}] Found ${result.data.events.length} events`);
                return result;
            }

            // No events found - might be temporary, retry
            if (!result.success || !result.data?.events?.length) {
                console.warn(`⚠️ [${platform.name}] No events extracted`);
                lastError = createError("No events found", 204, true);
            }
        } catch (error) {
            if (isFirecrawlError(error)) {
                lastError = error;

                if (!error.retryable) {
                    console.error(`❌ [${platform.name}] Non-retryable error:`, error.message);
                    throw error;
                }

                console.warn(`⚠️ [${platform.name}] Retryable error:`, error.message);
            } else {
                throw error;
            }
        }

        // Exponential backoff: 3s, 6s
        if (attempt < maxRetries - 1) {
            const backoffMs = Math.pow(2, attempt + 1) * 1500;
            console.log(`⏳ [${platform.name}] Waiting ${backoffMs}ms before retry...`);
            await sleep(backoffMs);
        }
    }

    // All retries exhausted
    return {
        success: false,
        error: lastError?.message || "Failed after all retries"
    };
}

/**
 * Helper to create typed errors
 */
function createError(message: string, statusCode: number, retryable: boolean): FirecrawlError {
    const error = new Error(message) as FirecrawlError;
    error.statusCode = statusCode;
    error.retryable = retryable;
    return error;
}

/**
 * Type guard for FirecrawlError
 */
function isFirecrawlError(error: unknown): error is FirecrawlError {
    return error instanceof Error && 'retryable' in error;
}

/**
 * Check if Firecrawl is configured
 */
export function isFirecrawlConfigured(): boolean {
    return !!process.env.FIRECRAWL_API_KEY;
}

/**
 * Scrape and parse TicketSasa using markdown (more reliable than extract API)
 */
export async function scrapeAndParseTicketSasa(url: string, maxRetries: number = 2): Promise<FirecrawlExtractResponse> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        throw createError("FIRECRAWL_API_KEY not configured", 500, false);
    }

    const { parseTicketSasaMarkdown } = await import('./markdownParser');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`🔍 [TicketSasa] Attempt ${attempt + 1}/${maxRetries} - Scraping ${url}`);

            const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    url,
                    formats: ['markdown']
                })
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => "Unknown error");
                throw createError(`Firecrawl scrape error: ${errorText}`, response.status, response.status >= 500);
            }

            const data = await response.json();

            if (!data.success || !data.data?.markdown) {
                throw createError("No markdown content returned", 500, true);
            }

            const markdown = data.data.markdown;
            const events = parseTicketSasaMarkdown(markdown, 'https://ticketsasa.com');

            console.log(`✅ [TicketSasa] Parsed ${events.length} events from markdown`);

            return {
                success: true,
                data: { events }
            };
        } catch (error) {
            if (isFirecrawlError(error) && !error.retryable) {
                throw error;
            }

            if (attempt < maxRetries - 1) {
                console.log(`⏳ [TicketSasa] Waiting 3s before retry...`);
                await sleep(3000);
            }
        }
    }

    throw createError("Failed to scrape TicketSasa after retries", 500, false);
}
