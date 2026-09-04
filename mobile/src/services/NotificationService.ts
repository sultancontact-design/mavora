/**
 * Notification Service for Mobile
 * Handles push notifications and in-app notifications
 * 
 * @module services/NotificationService
 */

import { supabase, Notification } from './SupabaseClient';
import { Platform } from 'react-native';

class NotificationService {
  private subscription: any = null;
  private listeners: Set<(notification: Notification) => void> = new Set();

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    console.log('[Notifications] Initializing...');
    
    // Subscribe to real-time notifications
    this.subscribeToNotifications();
    
    // Request push notification permissions (iOS)
    if (Platform.OS === 'ios') {
      await this.requestPermission();
    }
  }

  /**
   * Subscribe to Supabase real-time notifications
   */
  private subscribeToNotifications(): void {
    this.subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notification = payload.new as Notification;
          this.notifyListeners(notification);
          
          // Show local push notification
          this.showLocalNotification(notification);
        }
      )
      .subscribe();
  }

  /**
   * Request notification permission (iOS)
   */
  private async requestPermission(): Promise<boolean> => try {
    // In production, use @react-native-push-notification or expo-notifications
    console.log('[Notifications] Requesting permission...');
    return true;
  } catch (error) {
    console.error('[Notifications] Permission error:', error);
    return false;
  }

  /**
   * Show local notification
   */
  private showLocalNotification(notification: Notification): void {
    // In production, use local notification library
    console.log(`[Notifications] New: ${notification.title}`);
    
    // Example with expo-notifications:
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: notification.title,
    //     body: notification.body,
    //     data: notification.data,
    //   },
    //   trigger: null, // Show immediately
    // });
  }

  /**
   * Add listener for new notifications
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
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
   * Get user's notifications
   */
  async getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications', { count: 'exact' })
      .select('*')
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const notificationService = new NotificationService();

export default notificationService;
