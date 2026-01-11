/**
 * Advanced Recommendation Algorithms for Vybz Circle
 *
 * Includes:
 * - Time-decay scoring
 * - Location-based proximity
 * - Social graph recommendations
 * - A/B testing framework
 * - Real-time updates
 */

import { supabase } from './supabase';

// ==================== TIME-DECAY SCORING ====================

/**
 * Calculate time-decay weight for an action
 * Recent actions are weighted higher than older ones
 *
 * Uses exponential decay: weight = base_weight * e^(-λt)
 * where λ (lambda) controls decay rate
 */
export class TimeDecayScoring {
  // Half-life: 30 days (actions lose 50% weight after 30 days)
  private static LAMBDA = Math.log(2) / 30;

  /**
   * Calculate decay multiplier based on action age
   * @param timestamp - When the action occurred
   * @returns Decay multiplier between 0 and 1
   */
  static getDecayMultiplier(timestamp: string): number {
    const actionDate = new Date(timestamp);
    const now = new Date();
    const daysAgo = (now.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: e^(-λt)
    const multiplier = Math.exp(-this.LAMBDA * daysAgo);

    return Math.max(0.1, multiplier); // Minimum 10% weight for very old actions
  }

  /**
   * Apply time decay to a score
   */
  static applyDecay(baseScore: number, timestamp: string): number {
    const multiplier = this.getDecayMultiplier(timestamp);
    return baseScore * multiplier;
  }

  /**
   * Get time-weighted user preferences
   */
  static async getTimeWeightedPreferences(userId: string): Promise<any> {
    // Get all user behaviors
    const { data: behaviors } = await supabase
      .from('user_behaviors')
      .select('event_id, action_type, timestamp, events(category, min_price)')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(500);

    if (!behaviors || behaviors.length === 0) {
      return { categories: {}, avgPrice: 0, recencyScore: 0 };
    }

    // Action weights
    const weights: Record<string, number> = {
      view: 0.1,
      click: 0.3,
      save: 0.5,
      purchase: 1.0,
      share: 0.4
    };

    // Calculate time-weighted category scores
    const categoryScores: Record<string, number> = {};
    let totalPriceWeight = 0;
    let weightedPriceSum = 0;
    let totalRecencyScore = 0;

    behaviors.forEach(behavior => {
      if (!behavior.events) return;

      const baseWeight = weights[behavior.action_type as keyof typeof weights] || 0.1;
      const decayMultiplier = this.getDecayMultiplier(behavior.timestamp);
      const finalWeight = baseWeight * decayMultiplier;

      // Update category scores
      const category = behavior.events.category;
      if (category) {
        categoryScores[category] = (categoryScores[category] || 0) + finalWeight;
      }

      // Update price preferences
      if (behavior.events.min_price) {
        weightedPriceSum += behavior.events.min_price * finalWeight;
        totalPriceWeight += finalWeight;
      }

      // Track recency
      totalRecencyScore += decayMultiplier;
    });

    // Calculate average price preference
    const avgPrice = totalPriceWeight > 0 ? weightedPriceSum / totalPriceWeight : 0;

    // Normalize recency score (0-100)
    const recencyScore = (totalRecencyScore / behaviors.length) * 100;

    return {
      categories: categoryScores,
      avgPrice,
      recencyScore
    };
  }
}

// ==================== LOCATION-BASED RECOMMENDATIONS ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export class LocationScoring {
  /**
   * Calculate distance in kilometers between two points
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Score event based on proximity to user
   * @returns Score between 0-100
   */
  static getProximityScore(
    userLat: number,
    userLon: number,
    eventLat: number,
    eventLon: number,
    maxDistance: number = 50 // km
  ): number {
    const distance = this.calculateDistance(userLat, userLon, eventLat, eventLon);

    if (distance > maxDistance) return 0;

    // Score decreases linearly with distance
    // Events within 5km get 100, events at maxDistance get 0
    const minDistance = 5;
    if (distance <= minDistance) return 100;

    const score = 100 * (1 - (distance - minDistance) / (maxDistance - minDistance));
    return Math.max(0, score);
  }

  /**
   * Get user's location from browser or stored preference
   */
  static async getUserLocation(): Promise<{ lat: number; lon: number } | null> {
    // Try to get from geolocation API
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000 // 5 minutes
          });
        });

        return {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
      } catch (error) {
        console.warn('Could not get geolocation:', error);
      }
    }

    // Fallback to stored preference or IP-based location
    const stored = localStorage.getItem('vybz_user_location');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default to Nairobi city center
    return {
      lat: -1.2921,
      lon: 36.8219
    };
  }

  /**
   * Save user's location preference
   */
  static saveUserLocation(lat: number, lon: number): void {
    localStorage.setItem('vybz_user_location', JSON.stringify({ lat, lon }));
  }

  /**
   * Get nearby events sorted by proximity
   */
  static async getNearbyEvents(
    userLat: number,
    userLon: number,
    radiusKm: number = 25,
    limit: number = 20
  ): Promise<any[]> {
    // Get events with coordinates
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('starts_at', new Date().toISOString())
      .limit(100);

    if (!events) return [];

    // Calculate distances and scores
    const eventsWithDistance = events
      .map(event => {
        const distance = this.calculateDistance(
          userLat,
          userLon,
          event.latitude,
          event.longitude
        );

        const proximityScore = this.getProximityScore(
          userLat,
          userLon,
          event.latitude,
          event.longitude,
          radiusKm
        );

        return {
          ...event,
          distance,
          proximityScore
        };
      })
      .filter(event => event.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return eventsWithDistance;
  }
}

// ==================== SOCIAL GRAPH RECOMMENDATIONS ====================

/**
 * Friend-based and social recommendations
 */
export class SocialGraphScoring {
  /**
   * Get events that user's friends are attending
   */
  static async getFriendsEvents(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return [];

    const friendIds = friendships.map(f => f.friend_id);

    // Get events friends are attending (purchased tickets)
    const { data: friendActivities } = await supabase
      .from('user_behaviors')
      .select('event_id, user_id, events(*)')
      .in('user_id', friendIds)
      .eq('action_type', 'purchase')
      .gte('events.starts_at', new Date().toISOString())
      .order('timestamp', { ascending: false });

    if (!friendActivities) return [];

    // Count friends per event
    const eventCounts: Map<string, { count: number; event: any; friends: string[] }> = new Map();

    friendActivities.forEach(activity => {
      if (!activity.events) return;

      const existing = eventCounts.get(activity.event_id);
      if (existing) {
        existing.count++;
        existing.friends.push(activity.user_id);
      } else {
        eventCounts.set(activity.event_id, {
          count: 1,
          event: activity.events,
          friends: [activity.user_id]
        });
      }
    });

    // Sort by number of friends attending
    const sortedEvents = Array.from(eventCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ event, count, friends }) => ({
        ...event,
        friendsAttending: count,
        friendIds: friends
      }));

    return sortedEvents;
  }

  /**
   * Get social proof score for an event
   * Based on how many people the user knows are going
   */
  static async getSocialProofScore(
    userId: string,
    eventId: string
  ): Promise<number> {
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return 0;

    const friendIds = friendships.map(f => f.friend_id);

    // Count friends going to this event
    const { data: friendsGoing } = await supabase
      .from('user_behaviors')
      .select('user_id')
      .eq('event_id', eventId)
      .in('user_id', friendIds)
      .in('action_type', ['purchase', 'save']);

    const count = friendsGoing?.length || 0;

    // Score: 0-100 based on number of friends
    // 1 friend: 20, 2 friends: 40, 5+ friends: 100
    return Math.min(100, count * 20);
  }

  /**
   * Get events similar to what friends liked
   */
  static async getSimilarToFriendsEvents(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    // Get friends' favorite categories
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) return [];

    const friendIds = friendships.map(f => f.friend_id);

    // Get friends' preferences
    const { data: friendPrefs } = await supabase
      .from('user_preferences')
      .select('favorite_categories')
      .in('user_id', friendIds);

    if (!friendPrefs || friendPrefs.length === 0) return [];

    // Aggregate categories
    const categoryScores: Record<string, number> = {};
    friendPrefs.forEach(pref => {
      if (pref.favorite_categories) {
        pref.favorite_categories.forEach((cat: any) => {
          categoryScores[cat.category] = (categoryScores[cat.category] || 0) + cat.score;
        });
      }
    });

    // Get top categories
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    if (topCategories.length === 0) return [];

    // Find events in those categories
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('category', topCategories)
      .gte('starts_at', new Date().toISOString())
      .limit(limit);

    return events || [];
  }
}

// ==================== A/B TESTING FRAMEWORK ====================

/**
 * A/B testing for recommendation algorithms
 */
export class ABTestingFramework {
  /**
   * Get user's experiment variant
   * Consistent hash-based assignment
   */
  static getUserVariant(userId: string, experimentName: string): 'A' | 'B' {
    // Simple hash function for consistent assignment
    const hash = this.simpleHash(`${userId}-${experimentName}`);
    return hash % 2 === 0 ? 'A' : 'B';
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track experiment exposure
   */
  static async trackExperimentExposure(
    userId: string,
    experimentName: string,
    variant: 'A' | 'B'
  ): Promise<void> {
    await supabase.from('ab_test_exposures').insert({
      user_id: userId,
      experiment_name: experimentName,
      variant,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track experiment conversion
   */
  static async trackConversion(
    userId: string,
    experimentName: string,
    conversionType: string,
    metadata?: any
  ): Promise<void> {
    const variant = this.getUserVariant(userId, experimentName);

    await supabase.from('ab_test_conversions').insert({
      user_id: userId,
      experiment_name: experimentName,
      variant,
      conversion_type: conversionType,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get experiment results
   */
  static async getExperimentResults(experimentName: string): Promise<any> {
    // Get exposures
    const { data: exposures } = await supabase
      .from('ab_test_exposures')
      .select('variant')
      .eq('experiment_name', experimentName);

    // Get conversions
    const { data: conversions } = await supabase
      .from('ab_test_conversions')
      .select('variant, conversion_type')
      .eq('experiment_name', experimentName);

    if (!exposures || !conversions) return null;

    // Calculate conversion rates
    const variantA = {
      exposures: exposures.filter(e => e.variant === 'A').length,
      conversions: conversions.filter(c => c.variant === 'A').length
    };

    const variantB = {
      exposures: exposures.filter(e => e.variant === 'B').length,
      conversions: conversions.filter(c => c.variant === 'B').length
    };

    return {
      experimentName,
      variantA: {
        ...variantA,
        conversionRate: variantA.exposures > 0
          ? (variantA.conversions / variantA.exposures) * 100
          : 0
      },
      variantB: {
        ...variantB,
        conversionRate: variantB.exposures > 0
          ? (variantB.conversions / variantB.exposures) * 100
          : 0
      }
    };
  }

  /**
   * Apply A/B test to recommendations
   * Example: Test different recommendation strategies
   */
  static applyRecommendationExperiment(
    userId: string,
    baseRecommendations: any[],
    experimentName: string = 'rec_strategy_v1'
  ): any[] {
    const variant = this.getUserVariant(userId, experimentName);

    // Track exposure
    this.trackExperimentExposure(userId, experimentName, variant);

    if (variant === 'A') {
      // Control: Original algorithm
      return baseRecommendations;
    } else {
      // Variant B: Boost recent events more
      return baseRecommendations.map(rec => ({
        ...rec,
        score: rec.score * 1.2 // 20% boost
      })).sort((a, b) => b.score - a.score);
    }
  }
}

// ==================== REAL-TIME SCORING ====================

/**
 * Real-time recommendation updates
 */
export class RealTimeScoring {
  private static wsConnection: WebSocket | null = null;

  /**
   * Connect to real-time recommendation updates
   */
  static connectToUpdates(
    userId: string,
    onUpdate: (data: any) => void
  ): void {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

    this.wsConnection = new WebSocket(`${WS_URL}/recommendations/${userId}`);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      // Reconnect after 5 seconds
      setTimeout(() => this.connectToUpdates(userId, onUpdate), 5000);
    };
  }

  /**
   * Disconnect from updates
   */
  static disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Send user action to trigger real-time update
   */
  static sendAction(action: any): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(action));
    }
  }
}

// ==================== EXPORTS ====================

export const AdvancedAlgorithms = {
  TimeDecayScoring,
  LocationScoring,
  SocialGraphScoring,
  ABTestingFramework,
  RealTimeScoring
};
