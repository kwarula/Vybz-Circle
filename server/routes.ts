import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertEventSchema, insertTicketSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { runScraper, getScraperStatus, isFirecrawlConfigured } from "./scraper";
import { PlatformId, PLATFORM_CONFIGS } from "@shared/scraperSchema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Events - with optional source filtering
  app.get("/api/events", async (req, res) => {
    try {
      const source = req.query.source as string | undefined;
      const events = await storage.getEvents({ source });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(event);
  });

  app.post("/api/events", async (req, res) => {
    const parse = insertEventSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(parse.error);
      return;
    }
    const event = await storage.createEvent(parse.data);
    res.json(event);
  });

  // Tickets
  app.post("/api/tickets", async (req, res) => {
    const parse = insertTicketSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(parse.error);
      return;
    }
    const ticket = await storage.createTicket(parse.data);
    res.json(ticket);
  });

  app.get("/api/users/:id/tickets", async (req, res) => {
    const tickets = await storage.getUserTickets(req.params.id);
    res.json(tickets);
  });

  // ============================================
  // Scraper Routes
  // ============================================

  // Trigger a scrape run
  app.post("/api/scraper/run", async (req, res) => {
    try {
      // Check if Firecrawl is configured
      if (!isFirecrawlConfigured()) {
        res.status(503).json({
          error: "Scraper not configured",
          message: "FIRECRAWL_API_KEY environment variable is not set"
        });
        return;
      }

      // Get platforms to scrape (optional filter)
      const { platforms } = req.body as { platforms?: string[] };
      let platformIds: PlatformId[] | undefined;

      if (platforms && Array.isArray(platforms)) {
        // Validate platform IDs
        const validPlatforms = Object.keys(PLATFORM_CONFIGS) as PlatformId[];
        platformIds = platforms.filter(p => validPlatforms.includes(p as PlatformId)) as PlatformId[];

        if (platformIds.length === 0) {
          res.status(400).json({
            error: "Invalid platforms",
            validPlatforms
          });
          return;
        }
      }

      console.log(`🚀 Scraper run triggered via API for platforms: ${platformIds?.join(', ') || 'all'}`);

      // Run scraper (this could take a while)
      const result = await runScraper(platformIds);

      res.json({
        success: result.success,
        duration: result.completedAt.getTime() - result.startedAt.getTime(),
        totalEvents: result.totalEvents,
        platforms: result.platforms.map(p => ({
          id: p.platformId,
          name: PLATFORM_CONFIGS[p.platformId].name,
          success: p.success,
          eventsFound: p.eventsFound,
          eventsInserted: p.eventsInserted,
          eventsUpdated: p.eventsUpdated,
          errors: p.errors,
          duration: p.duration
        }))
      });
    } catch (error) {
      console.error("Scraper run error:", error);
      res.status(500).json({
        error: "Scraper failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Track event click (for affiliate/conversion tracking)
  app.post("/api/events/:id/track-click", async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId, source, deviceInfo } = req.body;

      // Get the event's ticket URL
      const event = await storage.getEvent(eventId);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // 1. Log the click record (fire and forget for performance)
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      supabase
        .from('event_clicks')
        .insert({
          event_id: eventId,
          user_id: userId || null,
          source: source || 'unknown',
          device_info: deviceInfo || null
        })
        .then(({ error }) => {
          if (error) console.error("Error logging click:", error);
        });

      // 2. Increment click count atomically
      supabase.rpc('increment_click_count', { event_id: eventId })
        .then(({ error }) => {
          if (error) console.error("Error incrementing click count:", error);
        });

      // 3. Add UTM tracking to URL
      const trackingUrl = appendTrackingParams(event.source_url || '', {
        utm_source: 'vybzcircle',
        utm_medium: 'app',
        utm_campaign: 'event_discovery',
        ref: 'vybz'
      });

      res.json({
        success: true,
        ticketUrl: trackingUrl
      });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Get scraper status
  app.get("/api/scraper/status", async (_req, res) => {
    try {
      const status = await getScraperStatus();
      const { getSchedulerState } = await import("./scraper/scheduler");
      const scheduler = getSchedulerState();

      res.json({
        configured: status.configured,
        lastRun: status.lastRun?.toISOString() || null,
        scheduler: {
          active: scheduler.active,
          isRunning: scheduler.isRunning,
          lastResult: scheduler.lastRunResult
        },
        platforms: Object.entries(status.platformStats).map(([id, stats]) => ({
          id,
          name: PLATFORM_CONFIGS[id as PlatformId].name,
          eventCount: stats.count,
          lastScraped: stats.lastScraped?.toISOString() || null
        }))
      });
    } catch (error) {
      console.error("Error getting scraper status:", error);
      res.status(500).json({ error: "Failed to get scraper status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Helper to append UTM parameters to a URL
 */
function appendTrackingParams(url: string, params: Record<string, string>): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    return urlObj.toString();
  } catch {
    // If invalid URL, return as is (but try to append if it's just missing protocol)
    if (url.includes('?')) {
      return url + '&' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    }
    return url + '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
  }
}

