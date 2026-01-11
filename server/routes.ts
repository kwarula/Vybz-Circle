import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertEventSchema, insertTicketSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { runScraper, getScraperStatus, isFirecrawlConfigured } from "./scraper";
import { PlatformId, PLATFORM_CONFIGS } from "@shared/scraperSchema";
import spotifyRoutes from "./routes/spotify";
import userRoutes from "./routes/user";
import { verifyAuth, requireAdmin, AuthenticatedRequest } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/spotify", spotifyRoutes);
  app.use("/api/users", userRoutes);

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

  app.get("/api/users/:id/tickets", verifyAuth, async (req: AuthenticatedRequest, res) => {
    // Only allow users to see their own tickets
    if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden", message: "You can only view your own tickets" });
    }
    const tickets = await storage.getUserTickets(req.params.id);
    res.json(tickets);
  });

  // ============================================
  // Scraper Routes
  // ============================================

  // Trigger a scrape run
  app.post("/api/scraper/run", verifyAuth, requireAdmin, async (req, res) => {
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
  app.get("/api/scraper/status", verifyAuth, requireAdmin, async (_req, res) => {
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

  // ========================================
  // ADMIN API ENDPOINTS
  // ========================================

  // Get all events with admin filters
  app.get("/api/admin/events", verifyAuth, requireAdmin, async (req, res) => {
    try {
      const { source, status, search, limit = '50', offset = '0' } = req.query;

      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (source) {
        query = query.eq('source_platform', source);
      }

      if (status === 'external') {
        query = query.eq('is_external', true);
      } else if (status === 'internal') {
        query = query.eq('is_external', false);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      query = query.range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({ events: data, total: count });
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Update event
  app.put("/api/admin/events/:id", verifyAuth, requireAdmin, async (req, res) => {
    try {
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Only allow updating specific fields to prevent ID or source platform tampering
      const allowedFields = [
        'title', 'description', 'category', 'venue_name',
        'price_range', 'image_url', 'starts_at', 'status',
        'is_external', 'source_url'
      ];

      const updateData: any = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updateData,
          last_edited_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json(data);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Delete event
  app.delete("/api/admin/events/:id", verifyAuth, requireAdmin, async (req, res) => {
    try {
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Get admin statistics
  app.get("/api/admin/stats", verifyAuth, requireAdmin, async (req, res) => {
    try {
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      const [totalEvents, externalEvents, internalEvents, scraperRuns] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_external', true),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_external', false),
        supabase.from('scraper_runs').select('*', { count: 'exact', head: true })
      ]);

      // Get events by platform
      const { data: platformData } = await supabase
        .from('events')
        .select('source_platform')
        .not('source_platform', 'is', null);

      const byPlatform: Record<string, number> = {};
      platformData?.forEach(e => {
        if (e.source_platform) {
          byPlatform[e.source_platform] = (byPlatform[e.source_platform] || 0) + 1;
        }
      });

      res.json({
        total: totalEvents.count || 0,
        external: externalEvents.count || 0,
        internal: internalEvents.count || 0,
        scraperRuns: scraperRuns.count || 0,
        byPlatform
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
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

