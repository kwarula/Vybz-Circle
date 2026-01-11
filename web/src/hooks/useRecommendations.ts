/**
 * React hooks for personalized recommendations
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { VybzAlgorithms } from '@/lib/algorithms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==================== BEHAVIOR TRACKING HOOK ====================

/**
 * Hook to track user behavior
 */
export function useTrackBehavior() {
  return useMutation({
    mutationFn: async ({
      eventId,
      actionType,
      metadata
    }: {
      eventId: string;
      actionType: 'view' | 'click' | 'save' | 'purchase' | 'share';
      metadata?: any;
    }) => {
      const userId = (await import('./useAuth')).useAuth.getState?.()?.user?.id;

      // Track locally
      await VybzAlgorithms.BehaviorTracker.trackAction(
        userId,
        eventId,
        actionType,
        metadata
      );

      // Also send to backend
      const response = await fetch(`${API_BASE}/api/recommendations/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId,
          actionType,
          metadata
        })
      });

      if (!response.ok) throw new Error('Failed to track behavior');
      return response.json();
    }
  });
}

// ==================== PERSONALIZED RECOMMENDATIONS ====================

/**
 * Hook to get personalized "For You" recommendations
 */
export function usePersonalizedRecommendations(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', 'for-you', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        // Fallback to trending for non-logged in users
        const response = await fetch(`${API_BASE}/api/recommendations/trending?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const data = await response.json();
        return data.events;
      }

      const response = await fetch(`${API_BASE}/api/recommendations/for-you?userId=${user.id}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      return data.events;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (renamed from cacheTime)
  });
}

// ==================== TRENDING EVENTS ====================

/**
 * Hook to get trending events
 */
export function useTrendingEvents(limit: number = 10) {
  return useQuery({
    queryKey: ['recommendations', 'trending', limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/recommendations/trending?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch trending events');
      const data = await response.json();
      return data.events;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });
}

// ==================== SIMILAR EVENTS ====================

/**
 * Hook to get events similar to a specific event
 */
export function useSimilarEvents(eventId: string | undefined, limit: number = 6) {
  return useQuery({
    queryKey: ['recommendations', 'similar', eventId, limit],
    queryFn: async () => {
      if (!eventId) return [];

      const response = await fetch(`${API_BASE}/api/recommendations/similar/${eventId}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch similar events');
      const data = await response.json();
      return data.events;
    },
    enabled: !!eventId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000
  });
}

// ==================== USER PREFERENCES ====================

/**
 * Hook to get user's learned preferences
 */
export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', 'preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await fetch(`${API_BASE}/api/recommendations/preferences/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });
}

// ==================== SMART SEARCH ====================

/**
 * Hook to get personalized search results
 */
export function usePersonalizedSearch(query: string, results: any[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', 'search', query, user?.id, results.length],
    queryFn: async () => {
      if (!user?.id || !query || results.length === 0) {
        return results;
      }

      const response = await fetch(`${API_BASE}/api/recommendations/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId: user.id,
          results
        })
      });

      if (!response.ok) throw new Error('Failed to rank search results');
      const data = await response.json();
      return data.results;
    },
    enabled: !!query && results.length > 0,
    staleTime: 5 * 60 * 1000
  });
}

// ==================== AUTO-TRACKING HOOKS ====================

/**
 * Hook to automatically track event views
 * Use this in event detail pages
 */
export function useTrackEventView(eventId: string | undefined) {
  const { mutate } = useTrackBehavior();

  // Track view on mount
  React.useEffect(() => {
    if (eventId) {
      mutate({
        eventId,
        actionType: 'view',
        metadata: {
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        }
      });
    }
  }, [eventId, mutate]);
}

/**
 * Hook to track event clicks
 * Returns a function to call when user clicks on an event
 */
export function useTrackEventClick() {
  const { mutate } = useTrackBehavior();

  return (eventId: string, metadata?: any) => {
    mutate({
      eventId,
      actionType: 'click',
      metadata: {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...metadata
      }
    });
  };
}

/**
 * Hook to track event saves/wishlists
 */
export function useTrackEventSave() {
  const { mutate } = useTrackBehavior();

  return (eventId: string, saved: boolean) => {
    if (saved) {
      mutate({
        eventId,
        actionType: 'save',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

/**
 * Hook to track event shares
 */
export function useTrackEventShare() {
  const { mutate } = useTrackBehavior();

  return (eventId: string, platform?: string) => {
    mutate({
      eventId,
      actionType: 'share',
      metadata: {
        platform,
        timestamp: new Date().toISOString()
      }
    });
  };
}

// Import React for useEffect
import React from 'react';
