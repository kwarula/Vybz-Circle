/**
 * WebSocket Server for Real-Time Recommendations
 *
 * Provides live updates when:
 * - New events matching user preferences are added
 * - Friends attend events
 * - Trending events change
 * - Real-time recommendation updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createClient } from '@supabase/supabase-js';
import url from 'url';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Client {
  ws: WebSocket;
  userId: string;
  lastUpdate: Date;
}

export class RealtimeRecommendations {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/recommendations' });
    this.setupWebSocket();
    this.startPeriodicUpdates();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      try {
        // Extract userId from URL path
        const pathname = url.parse(req.url || '').pathname || '';
        const userId = pathname.split('/').pop();

        if (!userId || userId === 'recommendations') {
          ws.close(1008, 'User ID required');
          return;
        }

        console.log(`WebSocket connected: ${userId}`);

        // Store client
        this.clients.set(userId, {
          ws,
          userId,
          lastUpdate: new Date()
        });

        // Send initial recommendations
        this.sendRecommendations(userId);

        // Handle messages from client
        ws.on('message', async (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            await this.handleClientMessage(userId, data);
          } catch (error) {
            console.error('Error handling message:', error);
          }
        });

        // Handle disconnection
        ws.on('close', () => {
          console.log(`WebSocket disconnected: ${userId}`);
          this.clients.delete(userId);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(userId);
        });

        // Send ping/pong for keepalive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Every 30 seconds
      } catch (error) {
        console.error('WebSocket setup error:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  /**
   * Send personalized recommendations to a user
   */
  private async sendRecommendations(userId: string) {
    try {
      const client = this.clients.get(userId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get trending events
      const { data: trending } = await supabase
        .from('trending_events')
        .select('event_id, engagement_score')
        .order('engagement_score', { ascending: false })
        .limit(5);

      // Get friends' events
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      let friendsEvents: any[] = [];
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.friend_id);
        const { data } = await supabase
          .from('user_behaviors')
          .select('event_id, events(*)')
          .in('user_id', friendIds)
          .eq('action_type', 'purchase')
          .gte('events.starts_at', new Date().toISOString())
          .limit(5);

        friendsEvents = data || [];
      }

      // Send update
      client.ws.send(JSON.stringify({
        type: 'recommendations_update',
        timestamp: new Date().toISOString(),
        data: {
          trending: trending || [],
          friendsEvents: friendsEvents.map(fe => fe.events).filter(Boolean),
          preferences: prefs?.favorite_categories || []
        }
      }));

      client.lastUpdate = new Date();
    } catch (error) {
      console.error('Error sending recommendations:', error);
    }
  }

  /**
   * Handle messages from client
   */
  private async handleClientMessage(userId: string, data: any) {
    const client = this.clients.get(userId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    switch (data.type) {
      case 'track_action':
        // Track user action and send updated recommendations
        await this.trackActionAndUpdate(userId, data);
        break;

      case 'request_update':
        // User requested fresh recommendations
        await this.sendRecommendations(userId);
        break;

      case 'subscribe_event':
        // Subscribe to updates about a specific event
        await this.subscribeToEvent(userId, data.eventId);
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  /**
   * Track action and send updated recommendations
   */
  private async trackActionAndUpdate(userId: string, data: any) {
    try {
      // Track the action
      await supabase.from('user_behaviors').insert({
        user_id: userId,
        event_id: data.eventId,
        action_type: data.actionType,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString()
      });

      // Send updated recommendations after a short delay
      setTimeout(() => {
        this.sendRecommendations(userId);
      }, 1000);
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }

  /**
   * Subscribe to event updates
   */
  private async subscribeToEvent(userId: string, eventId: string) {
    const client = this.clients.get(userId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Get real-time event stats
    const { data: stats } = await supabase
      .from('trending_events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    client.ws.send(JSON.stringify({
      type: 'event_stats',
      eventId,
      stats: stats || null
    }));
  }

  /**
   * Start periodic updates for all connected clients
   */
  private startPeriodicUpdates() {
    // Send updates every 5 minutes
    this.updateInterval = setInterval(() => {
      this.clients.forEach((client, userId) => {
        const timeSinceLastUpdate = Date.now() - client.lastUpdate.getTime();
        // Only update if last update was more than 4 minutes ago
        if (timeSinceLastUpdate > 240000) {
          this.sendRecommendations(userId);
        }
      });
    }, 60000); // Check every minute
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  /**
   * Broadcast to specific users
   */
  public broadcastToUsers(userIds: string[], message: any) {
    const messageStr = JSON.stringify(message);
    userIds.forEach(userId => {
      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  /**
   * Notify users when a friend takes an action
   */
  public async notifyFriendsOfAction(userId: string, action: any) {
    try {
      // Get user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (!friendships || friendships.length === 0) {
        return;
      }

      const friendUserIds = friendships.map(f => f.user_id);

      // Broadcast to friends
      this.broadcastToUsers(friendUserIds, {
        type: 'friend_activity',
        userId,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error notifying friends:', error);
    }
  }

  /**
   * Clean up
   */
  public close() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.wss.close();
  }
}
