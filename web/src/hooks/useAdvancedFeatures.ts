/**
 * React hooks for advanced recommendation features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { AdvancedAlgorithms } from '@/lib/advanced-algorithms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==================== SOCIAL GRAPH HOOKS ====================

export function useFriendsList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', 'list', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/advanced/friends/list?userId=${user!.id}`);
      const data = await res.json();
      return data.friends;
    },
    enabled: !!user?.id
  });
}

export function useFriendsEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', 'events', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/advanced/friends/events?userId=${user!.id}&limit=10`);
      const data = await res.json();
      return data.events;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useFriendsActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', 'activity', user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/advanced/friends/activity?userId=${user!.id}&limit=20`);
      const data = await res.json();
      return data.activity;
    },
    enabled: !!user?.id,
    refetchInterval: 60000 // Refresh every minute
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromUserId, toUserId, message }: any) => {
      const res = await fetch(`${API_BASE}/api/advanced/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId, toUserId, message })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
}

// ==================== LOCATION-BASED HOOKS ====================

export function useNearbyEvents(radiusKm: number = 25) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    AdvancedAlgorithms.LocationScoring.getUserLocation().then(loc => {
      if (loc) setLocation(loc);
    });
  }, []);

  return useQuery({
    queryKey: ['events', 'nearby', location?.lat, location?.lon, radiusKm],
    queryFn: async () => {
      if (!location) return [];

      const res = await fetch(
        `${API_BASE}/api/advanced/location/nearby?latitude=${location.lat}&longitude=${location.lon}&radiusKm=${radiusKm}&limit=20`
      );
      const data = await res.json();
      return data.events;
    },
    enabled: !!location,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

export function useGeocoding() {
  return useMutation({
    mutationFn: async (address: string) => {
      const res = await fetch(`${API_BASE}/api/advanced/location/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      return res.json();
    }
  });
}

// ==================== A/B TESTING HOOKS ====================

export function useExperimentVariant(experimentName: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['experiment', experimentName, user?.id],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/advanced/experiment/variant?userId=${user!.id}&experimentName=${experimentName}`
      );
      const data = await res.json();
      return data.variant as 'A' | 'B';
    },
    enabled: !!user?.id,
    staleTime: Infinity // Variant never changes for same user
  });
}

export function useTrackConversion() {
  return useMutation({
    mutationFn: async ({ userId, experimentName, conversionType, metadata }: any) => {
      const res = await fetch(`${API_BASE}/api/advanced/experiment/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experimentName, conversionType, metadata })
      });
      return res.json();
    }
  });
}

// ==================== REAL-TIME HOOKS ====================

export function useRealtimeRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const onUpdate = (data: any) => {
      setRecommendations(data);
    };

    AdvancedAlgorithms.RealTimeScoring.connectToUpdates(user.id, onUpdate);
    setConnected(true);

    return () => {
      AdvancedAlgorithms.RealTimeScoring.disconnect();
      setConnected(false);
    };
  }, [user?.id]);

  return { recommendations, connected };
}

// ==================== COMBINED HOOKS ====================

export function useSmartRecommendations() {
  const { user } = useAuth();
  const { data: personalizedEvents } = usePersonalizedRecommendations(10);
  const { data: nearbyEvents } = useNearbyEvents(25);
  const { data: friendsEvents } = useFriendsEvents();
  const variant = useExperimentVariant('smart_rec_v1');

  // Combine and score based on A/B test variant
  return useQuery({
    queryKey: ['smart-recommendations', user?.id, variant.data],
    queryFn: async () => {
      const { TimeDecayScoring, SocialGraphScoring, LocationScoring } = AdvancedAlgorithms;

      // Apply time decay to personalized events
      const timeWeightedPrefs = await TimeDecayScoring.getTimeWeightedPreferences(user!.id);

      // Score all events
      const allEvents = [...(personalizedEvents || []), ...(nearbyEvents || []), ...(friendsEvents || [])];
      const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());

      // Apply different strategies based on A/B variant
      if (variant.data === 'B') {
        // Variant B: Boost nearby events more
        return uniqueEvents.sort((a, b) => {
          const aScore = (a.distance_km ? 1 / a.distance_km : 0) * 100;
          const bScore = (b.distance_km ? 1 / b.distance_km : 0) * 100;
          return bScore - aScore;
        });
      }

      // Variant A: Balance all factors
      return uniqueEvents;
    },
    enabled: !!user?.id && !!variant.data
  });
}

// Helper hook from existing recommendations
import { usePersonalizedRecommendations } from './useRecommendations';
