/**
 * Advanced Features API Routes
 *
 * Includes:
 * - Social graph (friends, activity feed)
 * - Location-based recommendations
 * - A/B testing
 * - Smart notifications
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// ==================== SOCIAL GRAPH ====================

/**
 * POST /api/advanced/friends/request
 * Send friend request
 */
router.post('/friends/request', async (req: Request, res: Response) => {
  try {
    const { fromUserId, toUserId, message } = req.body;

    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced/friends/accept
 * Accept friend request
 */
router.post('/friends/accept', async (req: Request, res: Response) => {
  try {
    const { requestId, userId } = req.body;

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('to_user_id', userId);

    if (updateError) throw updateError;

    // Get request details
    const { data: request } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('id', requestId)
      .single();

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create bidirectional friendship
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert([
        {
          user_id: request.from_user_id,
          friend_id: request.to_user_id,
          status: 'accepted'
        },
        {
          user_id: request.to_user_id,
          friend_id: request.from_user_id,
          status: 'accepted'
        }
      ]);

    if (friendshipError) throw friendshipError;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/friends/list
 * Get user's friends
 */
router.get('/friends/list', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        created_at,
        users:friend_id (
          id,
          email,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    res.json({ friends: friendships || [] });
  } catch (error: any) {
    console.error('List friends error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/friends/activity
 * Get friends' activity feed
 */
router.get('/friends/activity', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data, error } = await supabase
      .rpc('get_friends_activity_feed', {
        p_user_id: userId,
        p_limit: limit
      });

    if (error) throw error;

    res.json({ activity: data || [] });
  } catch (error: any) {
    console.error('Friends activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/friends/events
 * Get events that friends are attending
 */
router.get('/friends/events', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Get friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) {
      return res.json({ events: [] });
    }

    const friendIds = friendships.map(f => f.friend_id);

    // Get events friends are attending
    const { data: friendEvents } = await supabase
      .from('user_behaviors')
      .select('event_id, user_id, events(*)')
      .in('user_id', friendIds)
      .eq('action_type', 'purchase')
      .gte('events.starts_at', new Date().toISOString());

    if (!friendEvents) {
      return res.json({ events: [] });
    }

    // Group by event and count friends
    const eventMap = new Map();
    friendEvents.forEach(item => {
      if (!item.events) return;

      const existing = eventMap.get(item.event_id);
      if (existing) {
        existing.friendsGoing++;
        existing.friendIds.push(item.user_id);
      } else {
        eventMap.set(item.event_id, {
          ...item.events,
          friendsGoing: 1,
          friendIds: [item.user_id]
        });
      }
    });

    // Sort by friends count
    const events = Array.from(eventMap.values())
      .sort((a, b) => b.friendsGoing - a.friendsGoing)
      .slice(0, limit);

    res.json({ events });
  } catch (error: any) {
    console.error('Friends events error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOCATION-BASED ====================

/**
 * POST /api/advanced/location/save
 * Save user location preference
 */
router.post('/location/save', async (req: Request, res: Response) => {
  try {
    const { userId, latitude, longitude, city, maxDistanceKm } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('user_locations')
      .upsert({
        user_id: userId,
        latitude,
        longitude,
        city,
        max_distance_km: maxDistanceKm || 25,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Save location error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/location/nearby
 * Get nearby events
 */
router.get('/location/nearby', async (req: Request, res: Response) => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radiusKm = parseInt(req.query.radiusKm as string) || 25;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }

    const { data, error } = await supabase
      .rpc('get_nearby_events', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_km: radiusKm,
        p_limit: limit
      });

    if (error) throw error;

    // Fetch full event details
    if (data && data.length > 0) {
      const eventIds = data.map((e: any) => e.event_id);
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      // Merge with distance data
      const eventsWithDistance = events?.map(event => {
        const distanceData = data.find((d: any) => d.event_id === event.id);
        return {
          ...event,
          distance_km: distanceData?.distance_km
        };
      });

      return res.json({ events: eventsWithDistance || [] });
    }

    res.json({ events: [] });
  } catch (error: any) {
    console.error('Nearby events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced/location/geocode
 * Convert address to coordinates (using Mapbox Geocoding API)
 */
router.post('/location/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address required' });
    }

    const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    if (!MAPBOX_TOKEN) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=ke&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      res.json({
        latitude: feature.center[1],
        longitude: feature.center[0],
        placeName: feature.place_name,
        address: feature.address
      });
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error: any) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== A/B TESTING ====================

/**
 * GET /api/advanced/experiment/variant
 * Get user's variant for an experiment
 */
router.get('/experiment/variant', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const experimentName = req.query.experimentName as string;

    if (!userId || !experimentName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('ab_test_exposures')
      .select('variant')
      .eq('user_id', userId)
      .eq('experiment_name', experimentName)
      .single();

    if (existing) {
      return res.json({ variant: existing.variant });
    }

    // Assign variant using consistent hashing
    const hash = simpleHash(`${userId}-${experimentName}`);
    const variant = hash % 2 === 0 ? 'A' : 'B';

    // Track exposure
    await supabase.from('ab_test_exposures').insert({
      user_id: userId,
      experiment_name: experimentName,
      variant
    });

    res.json({ variant });
  } catch (error: any) {
    console.error('Get variant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced/experiment/convert
 * Track experiment conversion
 */
router.post('/experiment/convert', async (req: Request, res: Response) => {
  try {
    const { userId, experimentName, conversionType, metadata } = req.body;

    if (!userId || !experimentName || !conversionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get variant
    const { data: exposure } = await supabase
      .from('ab_test_exposures')
      .select('variant')
      .eq('user_id', userId)
      .eq('experiment_name', experimentName)
      .single();

    if (!exposure) {
      return res.status(400).json({ error: 'User not in experiment' });
    }

    // Track conversion
    await supabase.from('ab_test_conversions').insert({
      user_id: userId,
      experiment_name: experimentName,
      variant: exposure.variant,
      conversion_type: conversionType,
      metadata: metadata || {}
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Track conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/experiment/results
 * Get experiment results
 */
router.get('/experiment/results', async (req: Request, res: Response) => {
  try {
    const experimentName = req.query.experimentName as string;

    if (!experimentName) {
      return res.status(400).json({ error: 'experimentName required' });
    }

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

    if (!exposures || !conversions) {
      return res.json({ error: 'Experiment not found' });
    }

    // Calculate stats
    const variantA = {
      exposures: exposures.filter(e => e.variant === 'A').length,
      conversions: conversions.filter(c => c.variant === 'A').length
    };

    const variantB = {
      exposures: exposures.filter(e => e.variant === 'B').length,
      conversions: conversions.filter(c => c.variant === 'B').length
    };

    res.json({
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
      },
      totalExposures: exposures.length,
      totalConversions: conversions.length
    });
  } catch (error: any) {
    console.error('Experiment results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SMART NOTIFICATIONS ====================

/**
 * POST /api/advanced/notifications/schedule
 * Schedule a smart notification
 */
router.post('/notifications/schedule', async (req: Request, res: Response) => {
  try {
    const { userId, eventId, notificationType, title, body } = req.body;

    if (!userId || !eventId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .rpc('schedule_smart_notification', {
        p_user_id: userId,
        p_event_id: eventId,
        p_notification_type: notificationType || 'event_reminder',
        p_title: title,
        p_body: body
      });

    if (error) throw error;

    res.json({ success: true, notificationId: data });
  } catch (error: any) {
    console.error('Schedule notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced/notifications/pending
 * Get pending notifications for a user
 */
router.get('/notifications/pending', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default router;
