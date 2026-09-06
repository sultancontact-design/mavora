/**
 * Supabase Realtime Integration
 * Real-time subscriptions for database changes
 * 
 * @module lib/realtime/supabase-realtime
 */

import { createClient } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================
// Types & Interfaces
// ============================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig {
  table: string;
  schema?: string;
  filter?: string;
  events?: RealtimeEvent[];
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export interface PresenceUser {
  user_id: string;
  username?: string;
  avatar_url?: string;
  online_at: string;
  last_seen: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  timestamp: number;
}

// ============================================================
// Realtime Manager Class
// ============================================================

class SupabaseRealtimeManager {
  private supabase: ReturnType<typeof createClient>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceChannels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.supabase = createClient();
  }

  // ============================================================
  // Database Change Subscriptions
  // ============================================================

  /**
   * Subscribe to database changes
   */
  subscribe(config: RealtimeSubscriptionConfig): RealtimeChannel {
    const channelName = `realtime:${config.table}:${Date.now()}`;
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: config.events?.join(',') || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        config.callback
      )
      .subscribe((status) => {
        console.log(`[Realtime] Channel ${channelName} status: ${status}`);
        
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to ${config.table}`);
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to new messages
   */
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: any) => void
  ): RealtimeChannel {
    return this.subscribe({
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
      events: ['INSERT'],
      callback: (payload) => {
        console.log('[Realtime] New message:', payload.new);
        onNewMessage(payload.new);
      },
    });
  }

  /**
   * Subscribe to listing changes (for sellers)
   */
  subscribeToListing(
    listingId: string,
    onChange: (listing: any, type: 'UPDATE' | 'DELETE') => void
  ): RealtimeChannel {
    return this.subscribe({
      table: 'listings',
      filter: `id=eq.${listingId}`,
      events: ['UPDATE', 'DELETE'],
      callback: (payload) => {
        if (payload.eventType === 'UPDATE') {
          onChange(payload.new, 'UPDATE');
        } else if (payload.eventType === 'DELETE') {
          onChange(payload.old, 'DELETE');
        }
      },
    });
  }

  /**
   * Subscribe to notification changes
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: any) => void
  ): RealtimeChannel {
    return this.subscribe({
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
      events: ['INSERT'],
      callback: (payload) => {
        console.log('[Realtime] New notification:', payload.new);
        onNotification(payload.new);
      },
    });
  }

  /**
   * Subscribe to wallet/transaction changes
   */
  subscribeToWallet(
    userId: string,
    onTransaction: (transaction: any) => void
  ): RealtimeChannel {
    return this.subscribe({
      table: 'transactions',
      filter: `user_id=eq.${userId}`,
      events: ['INSERT', 'UPDATE'],
      callback: (payload) => {
        console.log('[Realtime] Transaction update:', payload);
        onTransaction(payload.new || payload.old);
      },
    });
  }

  /**
   * Subscribe to order status changes
   */
  subscribeToOrders(
    userId: string,
    onOrderUpdate: (order: any) => void
  ): RealtimeChannel {
    return this.subscribe({
      table: 'orders',
      filter: `buyer_id=eq.${userId},or=seller_id=eq.${userId}`,
      events: ['UPDATE'],
      callback: (payload) => {
        console.log('[Realtime] Order updated:', payload.new);
        onOrderUpdate(payload.new);
      },
    });
  }

  // ============================================================
  // Presence Tracking (Online Status)
  // ============================================================

  /**
   * Track user presence (online/offline)
   */
  async trackPresence(userId: string, userData: Partial<PresenceUser> = {}): Promise<RealtimeChannel> {
    const channelName = `presence:users`;
    
    let channel = this.presenceChannels.get(channelName);
    
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      this.presenceChannels.set(channelName, channel);
    }

    const presenceState: PresenceUser = {
      user_id: userId,
      online_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      ...userData,
    };

    await channel.track(presenceState);

    return channel;
  }

  /**
   * Get currently online users
   */
  async getOnlineUsers(channelName: string = 'presence:users'): Promise<PresenceUser[]> {
    const channel = this.presenceChannels.get(channelName);
    if (!channel) return [];

    const presenceState = await channel.presenceState();
    const onlineUsers: PresenceUser[] = [];

    for (const [_key, presences] of Object.entries(presenceState)) {
      for (const presence of presences as any[]) {
        onlineUsers.push(presence);
      }
    }

    return onlineUsers;
  }

  /**
   * Subscribe to presence changes
   */
  subscribeToPresence(
    onJoin: (user: PresenceUser) => void,
    onLeave: (userId: string) => void
  ): RealtimeChannel {
    const channelName = `presence:users`;
    
    let channel = this.presenceChannels.get(channelName);
    
    if (!channel) {
      channel = this.supabase.channel(channelName, {
        config: {
          presence: {},
        },
      });

      this.presenceChannels.set(channelName, channel);
    }

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      for (const presence of newPresences) {
        onJoin(presence as PresenceUser);
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      onLeave(key);
    });

    channel.subscribe();

    return channel;
  }

  // ============================================================
  // Typing Indicators
  // ============================================================

  /**
   * Send typing indicator
   */
  startTyping(conversationId: string, userId: string): void {
    const key = `${conversationId}:${userId}`;
    
    // Clear existing timeout
    this.stopTyping(conversationId, userId);

    // Broadcast typing start
    this.broadcastTyping(conversationId, userId, true);

    // Auto-stop after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId, userId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string, userId: string): void {
    const key = `${conversationId}:${userId}`;
    const timeout = this.typingTimeouts.get(key);
    
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }

    this.broadcastTyping(conversationId, userId, false);
  }

  /**
   * Broadcast typing status via presence
   */
  private broadcastTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): void {
    const channelName = `typing:${conversationId}`;
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.supabase.channel(channelName);
      this.channels.set(channelName, channel);
      channel.subscribe();
    }

    channel.track({
      type: 'typing',
      conversation_id: conversationId,
      user_id: userId,
      is_typing: isTyping,
      timestamp: Date.now(),
    } as TypingIndicator);
  }

  /**
   * Subscribe to typing indicators in a conversation
   */
  subscribeToTyping(
    conversationId: string,
    onTypingChange: (userId: string, isTyping: boolean) => void
  ): RealtimeChannel {
    const channelName = `typing:${conversationId}`;
    
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = this.supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel.on('presence', { event: 'sync' }, () => {
      // Handle sync
    });

    channel.on('track', { schema: 'public', table: 'typing_indicators' }, (payload) => {
      const typing = payload as unknown as TypingIndicator;
      if (typing.conversation_id === conversationId) {
        onTypingChange(typing.user_id, typing.is_typing);
      }
    });

    channel.subscribe();

    return channel;
  }

  // ============================================================
  // Channel Management
  // ============================================================

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName?: string): Promise<void> {
    if (channelName) {
      const channel = this.channels.get(channelName) || this.presenceChannels.get(channelName);
      if (channel) {
        await this.supabase.removeChannel(channel);
        this.channels.delete(channelName);
        this.presenceChannels.delete(channelName);
      }
    } else {
      // Unsubscribe from all channels
      for (const [name, channel] of [...this.channels, ...this.presenceChannels]) {
        await this.supabase.removeChannel(channel);
      }
      this.channels.clear();
      this.presenceChannels.clear();
    }
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size + this.presenceChannels.size;
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    // Clear all typing timeouts
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.typingTimeouts.clear();

    // Unsubscribe from all channels
    await this.unsubscribe();
  }
}

// Singleton instance
export const realtimeManager = new SupabaseRealtimeManager();

// Export class for testing
export { SupabaseRealtimeManager };

export default realtimeManager;
