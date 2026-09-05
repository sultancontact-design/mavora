/**
 * خدمة الإشعارات المتقدمة
 * Advanced Notification Service
 * 
 * @features
 * - Multiple notification types (message, order, review, system)
 * - Real-time notifications via Supabase
 * - Notification preferences per user
 * - Push notification support (ready)
 * - Email notification integration
 * - Arabic RTL support
 */

import { supabase } from '@/lib/supabase';

// ==================== Types ====================

export type NotificationType = 
  | 'message'           // رسالة جديدة
  | 'order_created'     // طلب جديد
  | 'order_updated'     // تحديث الطلب
  | 'payment_received'  // استلام دفعة
  | 'review_received'   // تقييم جديد
  | 'listing_liked'     // إعجاب بالإعلان
  | 'follower'          // متابع جديد
  | 'price_drop'        // انخفاض السعر
  | 'promotion'         // عرض خاص
  | 'system'            // إشعار النظام
  | 'security'          // أمان (تسجيل دخول جديد, etc.)
  | 'moderation'        // اعتدال (محتوى محذوف, etc.);

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_clicked: boolean;
  priority: NotificationPriority;
  expires_at?: string;
  created_at: string;
  read_at?: string;
  clicked_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  types: {
    [key in NotificationType]: {
      push: boolean;
      email: boolean;
      in_app: boolean;
    };
  };
  quiet_hours_start?: string; // HH:mm format
  quiet_hours_end?: string;   // HH:mm format
}

interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  priority?: NotificationPriority;
  expiresAt?: string;
}

// ==================== Default Preferences ====================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  user_id: '',
  push_enabled: true,
  email_enabled: false,
  types: {
    message: { push: true, email: false, in_app: true },
    order_created: { push: true, email: true, in_app: true },
    order_updated: { push: true, email: true, in_app: true },
    payment_received: { push: true, email: true, in_app: true },
    review_received: { push: true, email: false, in_app: true },
    listing_liked: { push: false, email: false, in_app: true },
    follower: { push: true, email: false, in_app: true },
    price_drop: { push: true, email: true, in_app: true },
    promotion: { push: true, email: true, in_app: true },
    system: { push: true, email: false, in_app: true },
    security: { push: true, email: true, in_app: true },
    moderation: { push: true, email: true, in_app: true },
  },
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

// ==================== Notification Management ====================

/**
 * جلب إشعارات المستخدم
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
): Promise<{ notifications: Notification[]; total: number }> {
  const { limit = 20, offset = 0, unreadOnly = false, type } = options;
  
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    throw error;
  }
  
  return {
    notifications: (data || []) as Notification[],
    total: count || 0,
  };
}

/**
 * إنشاء إشعار جديد
 */
export async function createNotification(dto: CreateNotificationDTO): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      image_url: dto.imageUrl,
      action_url: dto.actionUrl,
      action_text: dto.actionText,
      priority: dto.priority || 'normal',
      expires_at: dto.expiresAt,
    })
    .select()
    .single();
  
  if (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    throw error;
  }
  
  return data as Notification;
}

/**
 * تحديد إشعار كمقروء
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId);
  
  if (error) {
    console.error('خطأ في تحديد الإشعار كمقروء:', error);
    throw error;
  }
}

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
    throw error;
  }
}

/**
 * تحديد إشعار كتم النقر عليه
 */
export async function markNotificationAsClicked(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_clicked: true, 
      clicked_at: new Date().toISOString() 
    })
    .eq('id', notificationId);
  
  if (error) {
    console.error('خطأ في تحديث حالة النقر:', error);
    throw error;
  }
}

/**
 * حذف إشعار
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  
  if (error) {
    console.error('خطأ في حذف الإشعار:', error);
    throw error;
  }
}

/**
 * حذف جميع الإشعارات المقروءة
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('is_read', true);
  
  if (error) {
    console.error('خطأ في حذف الإشعارات المقروءة:', error);
    throw error;
  }
}

// ==================== Unread Count ====================

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * الحصول على عدد غير المقروء لكل نوع
 */
export async function getUnreadCountsByType(
  userId: string
): Promise<Record<NotificationType, number>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('type')
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في جلب عدد الإشعارات:', error);
    return {} as Record<NotificationType, number>;
  }
  
  const counts: Partial<Record<NotificationType, number>> = {};
  (data || []).forEach((n: Notification) => {
    counts[n.type] = (counts[n.type] || 0) + 1;
  });
  
  return counts as Record<NotificationType, number>;
}

// ==================== Notification Preferences ====================

/**
 * الحصول على تفضيلات الإشعارات
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    // إرجاع التفضيلات الافتراضية
    return { ...DEFAULT_PREFERENCES, user_id: userId };
  }
  
  return data as NotificationPreferences;
}

/**
 * تحديث تفضيلات الإشعارات
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
    }, {
      onConflict: 'user_id',
    });
  
  if (error) {
    console.error('خطأ في تحديث تفضيلات الإشعارات:', error);
    throw error;
  }
}

// ==================== Bulk Operations ====================

/**
 * إنشاء إشعارات دفعية لمستخدمين متعددين
 */
export async function createBulkNotifications(
  dtos: CreateNotificationDTO[]
): Promise<Notification[]> {
  const notifications = dtos.map(dto => ({
    user_id: dto.userId,
    type: dto.type,
    title: dto.title,
    body: dto.body,
    data: dto.data,
    image_url: dto.imageUrl,
    action_url: dto.actionUrl,
    action_text: dto.actionText,
    priority: dto.priority || 'normal',
    expires_at: dto.expiresAt,
  }));
  
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();
  
  if (error) {
    console.error('خطأ في إنشاء الإشعارات الدفعية:', error);
    throw error;
  }
  
  return (data || []) as Notification[];
}

// ==================== Real-time Subscriptions ====================

type NotificationCallback = (notification: Notification) => void;

/**
 * الاشتراك في الإشعارات الجديدة للمستخدم
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: NotificationCallback
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();
}

// ==================== Helper Functions ====================

/**
 * الحصول على أيقونة نوع الإشعار
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    message: '💬',
    order_created: '🛒',
    order_updated: '📦',
    payment_received: '💰',
    review_received: '⭐',
    listing_liked: '❤️',
    follower: '👤',
    price_drop: '📉',
    promotion: '🎉',
    system: 'ℹ️',
    security: '🔐',
    moderation: '⚠️',
  };
  
  return icons[type] || '🔔';
}

/**
 * الحصول على لون نوع الإشعار
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    message: 'bg-blue-500',
    order_created: 'bg-green-500',
    order_updated: 'bg-yellow-500',
    payment_received: 'bg-emerald-500',
    review_received: 'bg-purple-500',
    listing_liked: 'bg-red-500',
    follower: 'bg-indigo-500',
    price_drop: 'bg-orange-500',
    promotion: 'bg-pink-500',
    system: 'bg-gray-500',
    security: 'bg-red-600',
    moderation: 'bg-amber-500',
  };
  
  return colors[type] || 'bg-gray-500';
}

/**
 * تنسيق وقت الإشعار
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes}د`;
  if (diffHours < 24) return `منذ ${diffHours}س`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  
  return date.toLocaleDateString('ar-MA', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * التحقق من كوننا في ساعات الهدوء
 */
function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
    return false;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return currentTime >= preferences.quiet_hours_start && currentTime <= preferences.quiet_hours_end;
}

// ==================== Export ====================

export const notificationService = {
  // CRUD
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markNotificationAsClicked,
  deleteNotification,
  deleteReadNotifications,
  
  // Counts
  getUnreadNotificationCount,
  getUnreadCountsByType,
  
  // Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // Bulk
  createBulkNotifications,
  
  // Real-time
  subscribeToUserNotifications,
  
  // Helpers
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
};

export default notificationService;
