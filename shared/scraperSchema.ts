import { z } from "zod";

// ============================================
// Firecrawl Response Types
// ============================================

export const FirecrawlEventSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    venue: z.string().optional(),
    organizer: z.string().optional(),
    price: z.string().optional(),
    ticketUrl: z.string().url().optional(),
});

export const FirecrawlExtractResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        events: z.array(FirecrawlEventSchema).optional(),
    }).optional(),
    error: z.string().optional(),
});

export type FirecrawlEvent = z.infer<typeof FirecrawlEventSchema>;
export type FirecrawlExtractResponse = z.infer<typeof FirecrawlExtractResponseSchema>;

// ============================================
// Platform Configuration Types
// ============================================

export type PlatformId = 'ticketsasa' | 'mtickets' | 'ticketyetu' | 'hustle' | 'madfun';

export interface PlatformConfig {
    id: PlatformId;
    name: string;
    baseUrl: string;
    eventsPath: string;
    color: string; // For UI badge
    extractionPrompt: string;
}

export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
    ticketsasa: {
        id: 'ticketsasa',
        name: 'TicketSasa',
        baseUrl: 'https://ticketsasa.com',
        eventsPath: '/events',
        color: '#FF5722',
        extractionPrompt: `Extract ALL events from the grid. Each event card has this structure:
- title: Found in <a class="event-name">. Use the text or title attribute. (REQUIRED)
- ticketUrl: Found in the href of <a class="event-name"> or <a class="fill">. (FULL URL starting with https://ticketsasa.com)
- imageUrl: Found in <img> inside <a class="fill">.
- date: Found as text immediately ABOVE the event name link. (e.g., "SUN 21 DEC 2025")
- venue: Found as text immediately BELOW the event name link. (e.g., "Skyline Rooftop, Nairobi")
- price: Found at the bottom of the card, often starts with "Starting KES" or says "FREE".
- description: Usually found on the linked event detail page, but extract any summary visible here.

Return as many events as possible. Each must have a title and ticketUrl.`
    },
    mtickets: {
        id: 'mtickets',
        name: 'MTickets',
        baseUrl: 'https://www.mtickets.com',
        eventsPath: '/',
        color: '#2196F3',
        extractionPrompt: `Extract all upcoming events from this page. For each event, get:
- title: Event name/title
- description: Brief description
- imageUrl: Event poster/image URL (full URL)
- date: Event date
- time: Start time
- venue: Venue name
- organizer: Organizer if shown
- price: Ticket price
- ticketUrl: Link to event details or tickets`
    },
    ticketyetu: {
        id: 'ticketyetu',
        name: 'TicketYetu',
        baseUrl: 'https://ticketyetu.com',
        eventsPath: '/events',
        color: '#4CAF50',
        extractionPrompt: `Extract all events from this events listing. For each event:
- title: Event title
- description: Description text
- imageUrl: Event image (absolute URL)
- date: Date and time information
- time: Specific time if separate from date
- venue: Venue or location
- organizer: Event host/organizer
- price: Starting price (e.g., "Starts at 1,000 KSh")
- ticketUrl: Registration/ticket link`
    },
    hustle: {
        id: 'hustle',
        name: 'Hustle',
        baseUrl: 'https://hustle.events',
        eventsPath: '/',
        color: '#9C27B0',
        extractionPrompt: `Extract all events displayed on this page. For each event:
- title: Event name
- description: Event description if shown
- imageUrl: Event image/flyer URL (complete URL)
- date: Event date
- time: Event time
- venue: Location/venue
- organizer: Event organizer
- price: Ticket price or entry fee
- ticketUrl: Link to event page or tickets`
    },
    madfun: {
        id: 'madfun',
        name: 'Madfun',
        baseUrl: 'https://gigs.madfun.com',
        eventsPath: '/events',
        color: '#00BCD4',
        extractionPrompt: `Extract ALL events/gigs from this page. For each event:
- title: Gig/event name (REQUIRED)
- description: Event details or description
- imageUrl: Event poster/image URL (absolute URL)
- date: Date of the event
- time: Start time
- venue: Venue name and location
- organizer: Event organizer
- price: Ticket prices (e.g., "Regular: KES 1000, VIP: KES 2000")
- ticketUrl: Full URL to event page (must include madfun.com)

Find all events. Every event needs a title.`
    }
};

// ============================================
// Normalized Event Type (for database)
// ============================================

export interface NormalizedEvent {
    title: string;
    description: string | null;
    image_url: string | null;
    starts_at: Date | null;
    venue_name: string | null;
    organizer_name: string | null;
    price_range: string | null;
    source_platform: PlatformId;
    source_url: string;
    external_id: string;
    is_external: boolean;
    ticketing_type: 'external';
    source: 'scraper';
    status: 'live';
}

// ============================================
// Scraper Status Types
// ============================================

export interface PlatformScrapeResult {
    platformId: PlatformId;
    success: boolean;
    eventsFound: number;
    eventsInserted: number;
    eventsUpdated: number;
    errors: string[];
    duration: number; // ms
}

export interface ScraperRunResult {
    startedAt: Date;
    completedAt: Date;
    platforms: PlatformScrapeResult[];
    totalEvents: number;
    success: boolean;
}

// ============================================
// Firecrawl Schema for API
// ============================================

export const FIRECRAWL_EVENT_SCHEMA = {
    type: "object",
    properties: {
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    imageUrl: { type: "string" },
                    date: { type: "string" },
                    time: { type: "string" },
                    venue: { type: "string" },
                    organizer: { type: "string" },
                    price: { type: "string" },
                    ticketUrl: { type: "string" }
                },
                required: ["title"]
            }
        }
    }
};
