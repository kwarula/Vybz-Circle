/**
 * Data normalization and utility functions for the scraper
 */

import {
    FirecrawlEvent,
    NormalizedEvent,
    PlatformId,
    PlatformConfig
} from "@shared/scraperSchema";
import { createHash } from "crypto";

/**
 * Parse various date/time formats from scraped data
 */
export function parseEventDate(dateStr?: string, timeStr?: string): Date | null {
    if (!dateStr) return null;

    // Combine date and time if both provided
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;

    // Try various date formats
    const parsers = [
        // ISO format
        () => new Date(combined),
        // "FRI 19 DEC 2025 12:00 PM" format
        () => parseDayDateFormat(combined),
        // "Fri 19 Dec 25 4:00 PM" format
        () => parseShortYearFormat(combined),
        // Just date like "December 19, 2025"
        () => new Date(dateStr)
    ];

    for (const parser of parsers) {
        try {
            const date = parser();
            if (date && !isNaN(date.getTime())) {
                // Sanity check: date should be in reasonable range
                const now = new Date();
                const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

                if (date > oneYearAgo && date < twoYearsFromNow) {
                    return date;
                }
            }
        } catch {
            continue;
        }
    }

    console.warn(`⚠️ Could not parse date: "${combined}"`);
    return null;
}

/**
 * Parse "FRI 19 DEC 2025 12:00 PM" format
 */
function parseDayDateFormat(str: string): Date {
    const months: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const match = str.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) throw new Error("No match");

    const [, day, month, year, hours, mins, ampm] = match;
    let hour = parseInt(hours, 10);

    if (ampm?.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;

    return new Date(parseInt(year, 10), months[month.toUpperCase()], parseInt(day, 10), hour, parseInt(mins, 10));
}

/**
 * Parse "Fri 19 Dec 25 4:00 PM" format (2-digit year)
 */
function parseShortYearFormat(str: string): Date {
    const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const match = str.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) throw new Error("No match");

    const [, day, month, year, hours, mins, ampm] = match;
    let hour = parseInt(hours, 10);
    const fullYear = 2000 + parseInt(year, 10);

    if (ampm?.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;

    return new Date(fullYear, months[month.toLowerCase()], parseInt(day, 10), hour, parseInt(mins, 10));
}

/**
 * Generate a consistent external ID for deduplication
 */
export function generateExternalId(event: FirecrawlEvent, platform: PlatformId): string {
    // Use ticket URL if available (most unique)
    if (event.ticketUrl) {
        return createHash('md5')
            .update(`${platform}:${event.ticketUrl}`)
            .digest('hex')
            .substring(0, 16);
    }

    // Fall back to title + date hash
    const identifier = `${platform}:${event.title}:${event.date || ''}`;
    return createHash('md5')
        .update(identifier)
        .digest('hex')
        .substring(0, 16);
}

/**
 * Normalize a Firecrawl event to database format
 */
export function normalizeEvent(
    event: FirecrawlEvent,
    platform: PlatformConfig
): NormalizedEvent | null {
    // Skip events without a title
    if (!event.title || event.title.trim().length === 0) {
        console.warn(`⚠️ [${platform.name}] Skipping event with no title`);
        return null;
    }

    // Clean up the title
    const title = event.title.trim().substring(0, 255);

    // Parse date
    const startsAt = parseEventDate(event.date, event.time);

    // Build source URL
    const sourceUrl = event.ticketUrl || `${platform.baseUrl}${platform.eventsPath}`;

    return {
        title,
        description: event.description?.trim() || null,
        image_url: validateImageUrl(event.imageUrl),
        starts_at: startsAt,
        venue_name: event.venue?.trim() || null,
        organizer_name: event.organizer?.trim() || null,
        price_range: normalizePriceRange(event.price),
        source_platform: platform.id,
        source_url: sourceUrl,
        external_id: generateExternalId(event, platform.id),
        is_external: true,
        ticketing_type: 'external',
        source: 'scraper',
        status: 'live'
    };
}

/**
 * Validate and clean image URL
 */
function validateImageUrl(url?: string): string | null {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        // Only allow http/https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return url;
    } catch {
        return null;
    }
}

/**
 * Normalize price range to consistent format
 */
function normalizePriceRange(price?: string): string | null {
    if (!price) return null;

    // Clean up and standardize
    let normalized = price.trim();

    // Remove "Starting" prefix
    normalized = normalized.replace(/^(starting|starts?\s+(at|from))/i, '').trim();

    // Ensure KES prefix if numeric
    if (/^\d/.test(normalized) && !normalized.toLowerCase().includes('kes') && !normalized.toLowerCase().includes('ksh')) {
        normalized = `KES ${normalized}`;
    }

    return normalized || null;
}

/**
 * Calculate similarity between two event titles (for cross-platform deduplication)
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = normalize(title1);
    const b = normalize(title2);

    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Simple Jaccard similarity on character trigrams
    const getTrigrams = (s: string): Set<string> => {
        const trigrams = new Set<string>();
        for (let i = 0; i <= s.length - 3; i++) {
            trigrams.add(s.substring(i, i + 3));
        }
        return trigrams;
    };

    const trigramsA = getTrigrams(a);
    const trigramsB = getTrigrams(b);

    let intersection = 0;
    for (const t of trigramsA) {
        if (trigramsB.has(t)) intersection++;
    }

    const union = trigramsA.size + trigramsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
