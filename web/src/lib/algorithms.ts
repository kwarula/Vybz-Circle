/**
 * Recommendation Engine for Vybz Circle
 *
 * This module implements intelligent algorithms to personalize
 * the user experience over time through:
 * - User behavior tracking
 * - Event recommendations
 * - Trending detection
 * - Collaborative filtering
 * - Personalized ranking
 */

import { supabase } from './supabase';

// ==================== TYPES ====================

export interface UserBehavior {
  user_id: string;
  event_id: string;
  action_type: 'view' | 'click' | 'save' | 'purchase' | 'share';
  timestamp: string;
  session_id?: string;
  device_info?: any;
}

export interface UserPreferences {
  user_id: string;
  favorite_categories: string[];
  price_range_min: number;
  price_range_max: number;
  preferred_days: string[];
  preferred_venues: string[];
  location_preferences: {
    city: string;
    max_distance?: number;
  };
}

export interface EventScore {
  event_id: string;
  score: number;
  reasons: string[];
}

// ==================== BEHAVIOR TRACKING ====================

/**
 * Track user interactions with events
 */
export class BehaviorTracker {
  /**
   * Track any user action on an event
   */
  static async trackAction(
    userId: string | undefined,
    eventId: string,
    actionType: UserBehavior['action_type'],
    metadata?: any
  ): Promise<void> {
    try {
      // Create anonymous session if no user
      const sessionId = userId || this.getOrCreateAnonymousSession();

      const { error } = await supabase.from('user_behaviors').insert({
        user_id: userId || null,
        event_id: eventId,
        action_type: actionType,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        metadata: metadata || {}
      });

      if (error) {
        console.error('Failed to track behavior:', error);
      }

      // Update user preferences asynchronously
      if (userId) {
        this.updateUserPreferences(userId, eventId, actionType);
      }
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }

  /**
   * Get or create anonymous session for non-logged in users
   */
  private static getOrCreateAnonymousSession(): string {
    let sessionId = localStorage.getItem('vybz_anon_session');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('vybz_anon_session', sessionId);
    }
    return sessionId;
  }

  /**
   * Update user preferences based on actions
   */
  private static async updateUserPreferences(
    userId: string,
    eventId: string,
    actionType: string
  ): Promise<void> {
    try {
      // Fetch event details
      const { data: event } = await supabase
        .from('events')
        .select('category, min_price, venue_name, location')
        .eq('id', eventId)
        .single();

      if (!event) return;

      // Get current preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      const weights = {
        view: 0.1,
        click: 0.3,
        save: 0.5,
        purchase: 1.0,
        share: 0.4
      };

      const weight = weights[actionType as keyof typeof weights] || 0.1;

      if (prefs) {
        // Update existing preferences
        const categories = prefs.favorite_categories || [];
        const categoryIndex = categories.findIndex((c: any) => c.category === event.category);

        if (categoryIndex >= 0) {
          categories[categoryIndex].score += weight;
        } else {
          categories.push({ category: event.category, score: weight });
        }

        // Sort and keep top 10
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
        // Create new preferences
        await supabase.from('user_preferences').insert({
          user_id: userId,
          favorite_categories: [{ category: event.category, score: weight }],
          price_range_min: 0,
          price_range_max: 10000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }
}

// ==================== RECOMMENDATION ENGINE ====================

/**
 * Generate personalized event recommendations
 */
export class RecommendationEngine {
  /**
   * Get personalized recommendations for a user
   */
  static async getRecommendations(
    userId: string | undefined,
    limit: number = 10
  ): Promise<EventScore[]> {
    const scores: Map<string, EventScore> = new Map();

    // Run multiple recommendation strategies in parallel
    const strategies = await Promise.all([
      this.contentBasedFiltering(userId),
      this.collaborativeFiltering(userId),
      this.trendingEvents(),
      this.newEvents()
    ]);

    // Combine scores from different strategies
    strategies.forEach((strategyScores, index) => {
      const weight = [0.4, 0.3, 0.2, 0.1][index]; // Content-based > Collaborative > Trending > New

      strategyScores.forEach(({ event_id, score, reasons }) => {
        const existing = scores.get(event_id);
        if (existing) {
          existing.score += score * weight;
          existing.reasons.push(...reasons);
        } else {
          scores.set(event_id, {
            event_id,
            score: score * weight,
            reasons
          });
        }
      });
    });

    // Sort by score and return top N
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Content-based filtering: recommend events similar to user's preferences
   */
  private static async contentBasedFiltering(
    userId: string | undefined
  ): Promise<EventScore[]> {
    if (!userId) return [];

    try {
      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.favorite_categories?.length) return [];

      // Get events matching preferred categories
      const topCategories = prefs.favorite_categories
        .slice(0, 5)
        .map((c: any) => c.category);

      const { data: events } = await supabase
        .from('events')
        .select('id, category, min_price')
        .in('category', topCategories)
        .gte('starts_at', new Date().toISOString())
        .limit(50);

      if (!events) return [];

      // Score events based on category match and price preference
      return events.map(event => {
        const categoryScore = prefs.favorite_categories.find(
          (c: any) => c.category === event.category
        )?.score || 0;

        const priceScore = this.calculatePriceScore(
          event.min_price || 0,
          prefs.price_range_min || 0,
          prefs.price_range_max || 10000
        );

        return {
          event_id: event.id,
          score: (categoryScore * 0.7 + priceScore * 0.3) * 100,
          reasons: [`Matches your interest in ${event.category}`]
        };
      });
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  /**
   * Collaborative filtering: recommend events liked by similar users
   */
  private static async collaborativeFiltering(
    userId: string | undefined
  ): Promise<EventScore[]> {
    if (!userId) return [];

    try {
      // Find users with similar behavior
      const { data: userBehavior } = await supabase
        .from('user_behaviors')
        .select('event_id')
        .eq('user_id', userId)
        .in('action_type', ['save', 'purchase']);

      if (!userBehavior?.length) return [];

      const userEventIds = userBehavior.map(b => b.event_id);

      // Find other users who interacted with same events
      const { data: similarUsers } = await supabase
        .from('user_behaviors')
        .select('user_id, event_id, action_type')
        .in('event_id', userEventIds)
        .neq('user_id', userId)
        .in('action_type', ['save', 'purchase']);

      if (!similarUsers?.length) return [];

      // Count events from similar users
      const eventCounts: Map<string, number> = new Map();
      similarUsers.forEach(behavior => {
        if (!userEventIds.includes(behavior.event_id)) {
          const weight = behavior.action_type === 'purchase' ? 2 : 1;
          eventCounts.set(
            behavior.event_id,
            (eventCounts.get(behavior.event_id) || 0) + weight
          );
        }
      });

      // Convert to scores
      const maxCount = Math.max(...Array.from(eventCounts.values()));
      return Array.from(eventCounts.entries()).map(([event_id, count]) => ({
        event_id,
        score: (count / maxCount) * 100,
        reasons: ['Popular with users like you']
      }));
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Get trending events based on recent engagement
   */
  private static async trendingEvents(): Promise<EventScore[]> {
    try {
      // Get events with most engagement in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: behaviors } = await supabase
        .from('user_behaviors')
        .select('event_id, action_type')
        .gte('timestamp', weekAgo.toISOString());

      if (!behaviors?.length) return [];

      // Calculate engagement scores
      const eventScores: Map<string, number> = new Map();
      const actionWeights = {
        view: 1,
        click: 2,
        save: 3,
        purchase: 5,
        share: 4
      };

      behaviors.forEach(behavior => {
        const weight = actionWeights[behavior.action_type as keyof typeof actionWeights] || 1;
        eventScores.set(
          behavior.event_id,
          (eventScores.get(behavior.event_id) || 0) + weight
        );
      });

      // Normalize scores
      const maxScore = Math.max(...Array.from(eventScores.values()));
      return Array.from(eventScores.entries())
        .map(([event_id, score]) => ({
          event_id,
          score: (score / maxScore) * 100,
          reasons: ['Trending this week']
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    } catch (error) {
      console.error('Trending events error:', error);
      return [];
    }
  }

  /**
   * Get newly added events
   */
  private static async newEvents(): Promise<EventScore[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: events } = await supabase
        .from('events')
        .select('id')
        .gte('created_at', weekAgo.toISOString())
        .gte('starts_at', new Date().toISOString())
        .limit(10);

      if (!events) return [];

      return events.map(event => ({
        event_id: event.id,
        score: 50, // Moderate score for new events
        reasons: ['New event']
      }));
    } catch (error) {
      console.error('New events error:', error);
      return [];
    }
  }

  /**
   * Calculate price preference score
   */
  private static calculatePriceScore(
    eventPrice: number,
    minPrice: number,
    maxPrice: number
  ): number {
    if (eventPrice < minPrice) return 0.5;
    if (eventPrice > maxPrice) return 0.3;

    // Price is within range - score based on how close to preferred range
    const range = maxPrice - minPrice;
    const position = (eventPrice - minPrice) / range;

    // Prefer mid-range prices (bell curve)
    return 1 - Math.abs(0.5 - position);
  }
}

// ==================== SMART SEARCH ====================

/**
 * Personalized search ranking
 */
export class SmartSearch {
  /**
   * Rank search results based on user preferences
   */
  static async rankSearchResults(
    results: any[],
    userId: string | undefined,
    query: string
  ): Promise<any[]> {
    if (!userId || !results.length) {
      return results;
    }

    try {
      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Score each result
      const scoredResults = results.map(event => {
        let score = 0;

        // Text relevance (base score)
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

        // Price preference
        if (prefs && event.min_price) {
          const priceScore = RecommendationEngine['calculatePriceScore'](
            event.min_price,
            prefs.price_range_min || 0,
            prefs.price_range_max || 10000
          );
          score += priceScore * 20;
        }

        return { ...event, _search_score: score };
      });

      // Sort by score
      return scoredResults.sort((a, b) => b._search_score - a._search_score);
    } catch (error) {
      console.error('Search ranking error:', error);
      return results;
    }
  }
}

// ==================== NOTIFICATION OPTIMIZER ====================

/**
 * Determine optimal times to send notifications
 */
export class NotificationOptimizer {
  /**
   * Get optimal notification time for a user
   */
  static async getOptimalNotificationTime(userId: string): Promise<Date> {
    try {
      // Analyze user's most active times
      const { data: behaviors } = await supabase
        .from('user_behaviors')
        .select('timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!behaviors?.length) {
        // Default to 6 PM if no data
        const defaultTime = new Date();
        defaultTime.setHours(18, 0, 0, 0);
        return defaultTime;
      }

      // Calculate hour distribution
      const hourCounts = new Array(24).fill(0);
      behaviors.forEach(b => {
        const hour = new Date(b.timestamp).getHours();
        hourCounts[hour]++;
      });

      // Find most active hour
      const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

      const optimalTime = new Date();
      optimalTime.setHours(mostActiveHour, 0, 0, 0);

      return optimalTime;
    } catch (error) {
      console.error('Notification optimization error:', error);
      const defaultTime = new Date();
      defaultTime.setHours(18, 0, 0, 0);
      return defaultTime;
    }
  }

  /**
   * Determine if user should receive a notification for an event
   */
  static async shouldNotify(userId: string, eventId: string): Promise<boolean> {
    try {
      // Check if user already purchased ticket
      const { data: purchase } = await supabase
        .from('user_behaviors')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('action_type', 'purchase')
        .single();

      if (purchase) return false; // Already purchased

      // Check if user has shown interest
      const { data: interest } = await supabase
        .from('user_behaviors')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .in('action_type', ['save', 'click', 'view']);

      if (interest?.length) return true; // User showed interest

      // Check if event matches user preferences
      const { data: event } = await supabase
        .from('events')
        .select('category')
        .eq('id', eventId)
        .single();

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favorite_categories')
        .eq('user_id', userId)
        .single();

      if (event && prefs?.favorite_categories) {
        const matchingCategory = prefs.favorite_categories.find(
          (c: any) => c.category === event.category && c.score > 0.5
        );
        return !!matchingCategory;
      }

      return false;
    } catch (error) {
      console.error('Should notify check error:', error);
      return false;
    }
  }
}

// ==================== EXPORTS ====================

export const VybzAlgorithms = {
  BehaviorTracker,
  RecommendationEngine,
  SmartSearch,
  NotificationOptimizer
};
