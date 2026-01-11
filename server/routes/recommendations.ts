/**
 * Recommendation API Routes
 *
 * Endpoints for personalized recommendations and behavior tracking
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ==================== BEHAVIOR TRACKING ====================

/**
 * POST /api/recommendations/track
 * Track user behavior for learning
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { userId, eventId, actionType, metadata } = req.body;

    if (!eventId || !actionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate action type
    const validActions = ['view', 'click', 'save', 'purchase', 'share'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    // Insert behavior
    const { data, error } = await supabase
      .from('user_behaviors')
      .insert({
        user_id: userId || null,
        event_id: eventId,
        action_type: actionType,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // If it's a significant action, update user preferences async
    if (['save', 'purchase', 'click'].includes(actionType) && userId) {
      updateUserPreferencesAsync(userId, eventId, actionType);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Track behavior error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/for-you
 * Get personalized recommendations for a user
 */
router.get('/for-you', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('event_recommendations')
      .select('event_id, score, reasons')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('score', { ascending: false })
      .limit(limit);

    if (cached && cached.length >= limit) {
      // Fetch full event details
      const eventIds = cached.map(r => r.event_id);
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      return res.json({
        events: events || [],
        cached: true
      });
    }

    // Generate new recommendations
    const recommendations = await generateRecommendations(userId, limit);

    // Cache the results
    if (recommendations.length > 0) {
      const cacheData = recommendations.map(r => ({
        user_id: userId,
        event_id: r.event_id,
        score: r.score,
        reasons: r.reasons,
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }));

      await supabase
        .from('event_recommendations')
        .upsert(cacheData, { onConflict: 'user_id,event_id' });
    }

    // Fetch full event details
    const eventIds = recommendations.map(r => r.event_id);
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds);

    res.json({
      events: events || [],
      cached: false
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/trending
 * Get currently trending events
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Update trending cache if stale
    await updateTrendingEvents();

    // Fetch trending events
    const { data: trending } = await supabase
      .from('trending_events')
      .select('event_id, engagement_score, view_count, click_count, save_count, purchase_count')
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (!trending || trending.length === 0) {
      return res.json({ events: [] });
    }

    // Fetch full event details
    const eventIds = trending.map(t => t.event_id);
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .gte('starts_at', new Date().toISOString());

    // Merge with stats
    const eventsWithStats = events?.map(event => {
      const stats = trending.find(t => t.event_id === event.id);
      return {
        ...event,
        trending_stats: {
          engagement_score: stats?.engagement_score,
          view_count: stats?.view_count,
          click_count: stats?.click_count,
          save_count: stats?.save_count,
          purchase_count: stats?.purchase_count
        }
      };
    });

    res.json({ events: eventsWithStats || [] });
  } catch (error: any) {
    console.error('Trending events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/similar/:eventId
 * Get events similar to a specific event
 */
router.get('/similar/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit as string) || 6;

    // Get the source event
    const { data: sourceEvent } = await supabase
      .from('events')
      .select('category, min_price, venue_name')
      .eq('id', eventId)
      .single();

    if (!sourceEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Find similar events
    const { data: similarEvents } = await supabase
      .from('events')
      .select('*')
      .eq('category', sourceEvent.category)
      .neq('id', eventId)
      .gte('starts_at', new Date().toISOString())
      .limit(limit * 2); // Get extra for filtering

    if (!similarEvents || similarEvents.length === 0) {
      return res.json({ events: [] });
    }

    // Score by similarity
    const scoredEvents = similarEvents.map(event => {
      let score = 50; // Base score for same category

      // Price similarity
      if (sourceEvent.min_price && event.min_price) {
        const priceDiff = Math.abs(sourceEvent.min_price - event.min_price);
        const priceScore = Math.max(0, 30 - (priceDiff / sourceEvent.min_price) * 30);
        score += priceScore;
      }

      // Venue similarity
      if (sourceEvent.venue_name && event.venue_name === sourceEvent.venue_name) {
        score += 20;
      }

      return { ...event, similarity_score: score };
    });

    // Sort by score and limit
    const topSimilar = scoredEvents
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    res.json({ events: topSimilar });
  } catch (error: any) {
    console.error('Similar events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recommendations/search
 * Personalized search ranking
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, userId, results } = req.body;

    if (!query || !results) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Track search
    await supabase.from('event_search_analytics').insert({
      user_id: userId || null,
      query,
      results_count: results.length,
      timestamp: new Date().toISOString()
    });

    // If no user, return as-is
    if (!userId) {
      return res.json({ results });
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Score and rank results
    const scoredResults = results.map((event: any) => {
      let score = 0;

      // Text relevance
      const titleMatch = event.title?.toLowerCase().includes(query.toLowerCase());
      const descMatch = event.description?.toLowerCase().includes(query.toLowerCase());
      score += titleMatch ? 50 : 0;
      score += descMatch ? 25 : 0;

      // Category preference
      if (prefs?.favorite_categories) {
        const categoryPref = prefs.favorite_categories.find(
          (c: any) => c.category === event.category
        );
        score += categoryPref ? categoryPref.score * 10 : 0;
      }

      return { ...event, search_score: score };
    });

    // Sort by score
    const rankedResults = scoredResults.sort((a: any, b: any) => b.search_score - a.search_score);

    res.json({ results: rankedResults });
  } catch (error: any) {
    console.error('Search ranking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/preferences/:userId
 * Get user's learned preferences
 */
router.get('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!preferences) {
      return res.json({
        favorite_categories: [],
        price_range_min: 0,
        price_range_max: 10000
      });
    }

    res.json(preferences);
  } catch (error: any) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(userId: string, limit: number) {
  const recommendations: any[] = [];

  // Strategy 1: Content-based (user preferences)
  const contentBased = await contentBasedRecommendations(userId, limit);
  recommendations.push(...contentBased);

  // Strategy 2: Collaborative filtering (similar users)
  const collaborative = await collaborativeRecommendations(userId, limit);
  recommendations.push(...collaborative);

  // Strategy 3: Trending events
  const trending = await getTrendingRecommendations(limit);
  recommendations.push(...trending);

  // Combine and deduplicate
  const eventScores = new Map();
  recommendations.forEach(rec => {
    const existing = eventScores.get(rec.event_id);
    if (existing) {
      existing.score += rec.score * 0.5; // Boost if multiple strategies agree
      existing.reasons.push(...rec.reasons);
    } else {
      eventScores.set(rec.event_id, rec);
    }
  });

  // Sort and return top N
  return Array.from(eventScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function contentBasedRecommendations(userId: string, limit: number) {
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!prefs?.favorite_categories?.length) return [];

  const topCategories = prefs.favorite_categories
    .slice(0, 3)
    .map((c: any) => c.category);

  const { data: events } = await supabase
    .from('events')
    .select('id, category, min_price')
    .in('category', topCategories)
    .gte('starts_at', new Date().toISOString())
    .limit(limit * 2);

  if (!events) return [];

  return events.map(event => ({
    event_id: event.id,
    score: prefs.favorite_categories.find((c: any) => c.category === event.category)?.score * 100 || 50,
    reasons: [`Matches your interest in ${event.category}`]
  }));
}

async function collaborativeRecommendations(userId: string, limit: number) {
  // Find events the user interacted with
  const { data: userEvents } = await supabase
    .from('user_behaviors')
    .select('event_id')
    .eq('user_id', userId)
    .in('action_type', ['save', 'purchase']);

  if (!userEvents?.length) return [];

  const userEventIds = userEvents.map(b => b.event_id);

  // Find similar users
  const { data: similarUsers } = await supabase
    .from('user_behaviors')
    .select('user_id, event_id')
    .in('event_id', userEventIds)
    .neq('user_id', userId)
    .in('action_type', ['save', 'purchase']);

  if (!similarUsers?.length) return [];

  // Count recommendations from similar users
  const eventCounts = new Map();
  similarUsers.forEach(b => {
    if (!userEventIds.includes(b.event_id)) {
      eventCounts.set(b.event_id, (eventCounts.get(b.event_id) || 0) + 1);
    }
  });

  const maxCount = Math.max(...Array.from(eventCounts.values()));
  return Array.from(eventCounts.entries()).map(([event_id, count]) => ({
    event_id,
    score: (count / maxCount) * 100,
    reasons: ['Popular with users like you']
  }));
}

async function getTrendingRecommendations(limit: number) {
  const { data: trending } = await supabase
    .from('trending_events')
    .select('event_id, engagement_score')
    .order('engagement_score', { ascending: false })
    .limit(limit);

  if (!trending) return [];

  const maxScore = trending[0]?.engagement_score || 1;
  return trending.map(t => ({
    event_id: t.event_id,
    score: (Number(t.engagement_score) / Number(maxScore)) * 100,
    reasons: ['Trending now']
  }));
}

async function updateTrendingEvents() {
  // Check if we need to update (once per hour)
  const { data: latest } = await supabase
    .from('trending_events')
    .select('computed_at')
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  const hourAgo = new Date(Date.now() - 3600000);
  if (latest && new Date(latest.computed_at) > hourAgo) {
    return; // Cache is fresh
  }

  // Call the update function
  await supabase.rpc('update_trending_events');
}

async function updateUserPreferencesAsync(userId: string, eventId: string, actionType: string) {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('category, min_price')
      .eq('id', eventId)
      .single();

    if (!event) return;

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const weights: any = {
      view: 0.1,
      click: 0.3,
      save: 0.5,
      purchase: 1.0,
      share: 0.4
    };

    const weight = weights[actionType] || 0.1;

    if (prefs) {
      const categories = prefs.favorite_categories || [];
      const categoryIndex = categories.findIndex((c: any) => c.category === event.category);

      if (categoryIndex >= 0) {
        categories[categoryIndex].score += weight;
      } else {
        categories.push({ category: event.category, score: weight });
      }

      categories.sort((a: any, b: any) => b.score - a.score);
      const topCategories = categories.slice(0, 10);

      await supabase
        .from('user_preferences')
        .update({
          favorite_categories: topCategories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_preferences').insert({
        user_id: userId,
        favorite_categories: [{ category: event.category, score: weight }],
        price_range_min: 0,
        price_range_max: 10000
      });
    }
  } catch (error) {
    console.error('Update preferences error:', error);
  }
}

export default router;
