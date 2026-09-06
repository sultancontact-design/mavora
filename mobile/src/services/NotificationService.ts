/**
 * Notification Service for Mavora Mobile
 * Handles push notifications and in-app notifications
 * 
 * @module services/NotificationService
 */

import { Platform, Alert, Linking, DeviceEventEmitter } from 'react-native';
import { supabase, Notification } from './SupabaseClient';
import { t } from '../i18n';

// ============================================================
// Types
// ============================================================

export type NotificationListener = (notification: Notification) => void;
export type UnreadCountListener = (count: number) => void;

export interface NotificationConfig {
  enablePushNotifications?: boolean;
  enableInAppNotifications?: boolean;
  soundEnabled?: boolean;
  vibrateEnabled?: boolean;
}

export interface PushTokenData {
  token: string;
  platform: 'ios' | 'android';
  userId: string;
  created_at: string;
}

// ============================================================
// Notification Service Class
// ============================================================

class NotificationServiceClass {
  private subscription: any = null;
  private listeners: Set<NotificationListener> = new Set();
  private unreadCountListeners: Set<UnreadCountListener> = new Set();
  private currentUnreadCount: number = 0;
  private isInitialized: boolean = false;
  private config: NotificationConfig = {
    enablePushNotifications: true,
    enableInAppNotifications: true,
    soundEnabled: true,
    vibrateEnabled: true,
  };
  private pushToken: string | null = null;

  /**
   * Initialize notification service
   * Sets up real-time subscriptions and requests permissions
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[Notifications] Already initialized');
      return;
    }

    console.log('[Notifications] Initializing...');

    try {
      // Subscribe to real-time notifications from Supabase
      this.subscribeToRealtimeNotifications();

      // Request push notification permissions (iOS)
      if (Platform.OS === 'ios') {
        await this.requestPermission();
      }

      // Register for push notifications
      if (userId && this.config.enablePushNotifications) {
        await this.registerForPushNotifications(userId);
      }

      // Listen for foreground notifications (React Native)
      this.setupForegroundHandler();

      this.isInitialized = true;
      console.log('[Notifications] Initialized successfully');

    } catch (error) {
      console.error('[Notifications] Initialization error:', error);
    }
  }

  /**
   * Subscribe to Supabase real-time notifications
   */
  private subscribeToRealtimeNotifications(): void {
    this.subscription = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notification = payload.new as Notification;
          this.handleNewNotification(notification);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] Subscribed to realtime channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Notifications] Channel subscription error');
        }
      });
  }

  /**
   * Handle new notification received
   */
  private handleNewNotification(notification: Notification): void {
    console.log(`[Notifications] New: ${notification.title}`);

    // Update unread count
    this.currentUnreadCount++;
    this.notifyUnreadCountListeners();

    // Notify all listeners
    this.notifyListeners(notification);

    // Show local push notification if enabled
    if (this.config.enableInAppNotifications) {
      this.showLocalNotification(notification);
    }
  }

  /**
   * Request notification permission (iOS)
   */
  async requestPermission(): Promise<boolean> {
    try {
      // In production with expo-notifications or @react-native-push-notification:
      // const { status: existingStatus } = await Notifications.getPermissionsAsync();
      // let finalStatus = existingStatus;
      // if (existingStatus !== 'granted') {
      //   const { status } = await Notifications.requestPermissionsAsync();
      //   finalStatus = status;
      // }
      // return finalStatus === 'granted';
      
      console.log('[Notifications] Permission requested');
      return true;
    } catch (error) {
      console.error('[Notifications] Permission error:', error);
      return false;
    }
  }

  /**
   * Register device for push notifications
   */
  async registerForPushNotifications(userId: string): Promise<void> {
    try {
      // In production with expo-notifications:
      // const token = (await Notifications.getExpoPushTokenAsync()).data;
      // await this.savePushToken(token, userId);
      
      console.log(`[Notifications] Registered for push: ${userId}`);
    } catch (error) {
      console.error('[Notifications] Register push error:', error);
    }
  }

  /**
   * Save push token to database
   */
  async savePushToken(token: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('push_tokens').upsert({
        token,
        user_id: userId,
        platform: Platform.OS as 'ios' | 'android',
      }, {
        onConflict: 'token',
      });

      if (error) throw error;

      this.pushToken = token;
      console.log('[Notifications] Push token saved');
    } catch (error) {
      console.error('[Notifications] Save token error:', error);
    }
  }

  /**
   * Setup foreground notification handler
   */
  private setupForegroundHandler(): void {
    // In production, this would use the notification library's handler
    // For now, we'll use DeviceEventEmitter for custom events
    
    DeviceEventEmitter.addListener('notificationReceived', (notification: Notification) => {
      this.handleNewNotification(notification);
    });

    DeviceEventEmitter.addListener('notificationOpened', (response: any) => {
      this.handleNotificationTap(response.notification);
    });
  }

  /**
   * Show local notification
   */
  private showLocalNotification(notification: Notification): void {
    try {
      // In production with expo-notifications:
      // await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: notification.title_ar || notification.title,
      //     body: notification.body_ar || notification.body,
      //     data: notification.data || {},
      //     sound: this.config.soundEnabled ? true : undefined,
      //   },
      //   trigger: null, // Show immediately
      // });

      console.log(`[Notifications] Would show: ${notification.title}`);

      // Fallback: Show alert in development
      if (__DEV__) {
        Alert.alert(
          notification.title_ar || notification.title,
          notification.body_ar || notification.body,
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.ok'),
              onPress: () => this.handleNotificationTap(notification),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[Notifications] Show local error:', error);
    }
  }

  /**
   * Handle notification tap/open
   */
  private handleNotificationTap(notification: Notification | any): void {
    const data = notification.data || notification;

    console.log('[Notifications] Tapped:', data);

    // Navigate based on notification type
    switch (notification.type || data.type) {
      case 'new_message':
        // Navigate to chat
        this.emitNavigationEvent('Chat', {
          conversationId: data.conversation_id,
          userName: data.sender_name,
        });
        break;

      case 'listing_liked':
      case 'new_follower':
        // Navigate to listing or profile
        if (data.listing_id) {
          this.emitNavigationEvent('ListingDetail', { listingId: data.listing_id });
        }
        break;

      case 'price_drop':
        // Navigate to listing
        if (data.listing_id) {
          this.emitNavigationEvent('ListingDetail', { listingId: data.listing_id });
        }
        break;

      default:
        // Navigate to notifications screen
        this.emitNavigationEvent('Notifications');
    }

    // Mark as read when opened
    if (notification.id) {
      this.markAsRead(notification.id);
    }
  }

  /**
   * Emit navigation event for app to handle
   */
  private emitNavigationEvent(screen: string, params?: any): void {
    DeviceEventEmitter.emit('navigateToNotificationTarget', { screen, params });
  }

  /**
   * Add listener for new notifications
   * Returns unsubscribe function
   */
  onNotification(callback: NotificationListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Add listener for unread count changes
   */
  onUnreadCountChange(callback: UnreadCountListener): () => void {
    this.unreadCountListeners.add(callback);
    callback(this.currentUnreadCount); // Send current value immediately
    return () => this.unreadCountListeners.delete(callback);
  }

  /**
   * Notify all notification listeners
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('[Notifications] Listener error:', error);
      }
    });
  }

  /**
   * Notify all unread count listeners
   */
  private notifyUnreadCountListeners(): void {
    this.unreadCountListeners.forEach(listener => {
      try {
        listener(this.currentUnreadCount);
      } catch (error) {
        console.error('[Notifications] Unread count listener error:', error);
      }
    });
  }

  // ============================================================
  // CRUD Operations
  // ============================================================

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ data: Notification[]; error: any }> {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error) {
        // Calculate unread count
        const unreadCount = data?.filter(n => !n.is_read).length || 0;
        if (unreadCount !== this.currentUnreadCount) {
          this.currentUnreadCount = unreadCount;
          this.notifyUnreadCountListeners();
        }
      }

      return { data: data || [], error };
    } catch (error) {
      console.error('[Notifications] Get notifications error:', error);
      return { data: [], error };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications', { count: 'exact' })
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      this.currentUnreadCount = count || 0;
      return this.currentUnreadCount;
    } catch (error) {
      console.error('[Notifications] Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (!error) {
        this.currentUnreadCount = Math.max(0, this.currentUnreadCount - 1);
        this.notifyUnreadCountListeners();
      }

      return { error };
    } catch (error) {
      console.error('[Notifications] Mark as read error:', error);
      return { error };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ error: any; count: number }> {
    try {
      const { error, count } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        this.currentUnreadCount = 0;
        this.notifyUnreadCountListeners();
      }

      return { error, count: count || 0 };
    } catch (error) {
      console.error('[Notifications] Mark all as read error:', error);
      return { error, count: 0 };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      console.error('[Notifications] Delete error:', error);
      return { error };
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (!error) {
        this.currentUnreadCount = 0;
        this.notifyUnreadCountListeners();
      }

      return { error };
    } catch (error) {
      console.error('[Notifications] Clear all error:', error);
      return { error };
    }
  }

  // ============================================================
  // Configuration
  // ============================================================

  /**
   * Update notification configuration
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[Notifications] Config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable push notifications
   */
  async setPushNotificationsEnabled(enabled: boolean, userId?: string): Promise<void> {
    this.config.enablePushNotifications = enabled;

    if (enabled && userId) {
      await this.registerForPushNotifications(userId);
    } else if (!enabled && this.pushToken) {
      // Remove token from server
      await this.removePushToken();
    }
  }

  /**
   * Remove push token from server
   */
  private async removePushToken(): Promise<void> {
    if (!this.pushToken) return;

    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('token', this.pushToken);

      this.pushToken = null;
      console.log('[Notifications] Push token removed');
    } catch (error) {
      console.error('[Notifications] Remove token error:', error);
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  /**
   * Cleanup and destroy service instance
   */
  destroy(): void {
    // Unsubscribe from Supabase channel
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    // Clear all listeners
    this.listeners.clear();
    this.unreadCountListeners.clear();

    // Reset state
    this.currentUnreadCount = 0;
    this.isInitialized = false;
    this.pushToken = null;

    console.log('[Notifications] Service destroyed');
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current unread count (from cache)
   */
  getCachedUnreadCount(): number {
    return this.currentUnreadCount;
  }
}

// ============================================================
// Singleton Instance
// ============================================================

export const notificationService = new NotificationServiceClass();

// Export class for testing
export { NotificationServiceClass };

export default notificationService;
