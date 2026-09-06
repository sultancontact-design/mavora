/**
 * Real-time Notification System
 * Server-Sent Events (SSE) based push notifications for Mavora
 * 
 * @module lib/realtime-notifications
 */

// ============================================================
// Types & Interfaces
// ============================================================

export enum NotificationType {
  // Message notifications
  NEW_MESSAGE = 'new_message',
  MESSAGE_READ = 'message_read',
  TYPING_INDICATOR = 'typing',
  
  // Listing notifications
  LISTING_LIKE = 'listing_like',
  LISTING_COMMENT = 'listing_comment',
  LISTING_SOLD = 'listing_sold',
  LISTING_EXPIRING = 'listing_expiring',
  
  // Transaction notifications
  PAYMENT_RECEIVED = 'payment_received',
  ORDER_UPDATE = 'order_update',
  WITHDRAWAL_COMPLETE = 'withdrawal_complete',
  
  // System notifications
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  MAINTENANCE = 'maintenance',
  SECURITY_ALERT = 'security_alert',
  
  // Admin notifications
  NEW_USER = 'new_user',
  REPORTED_CONTENT = 'reported_content',
  FLAGGED_LISTING = 'flagged_listing',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;       // Arabic
  titleEn?: string;    // English
  body: string;        // Arabic
  bodyEn?: string;     // English
  data?: Record<string, any>;
  senderId?: string;
  recipientId: string;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  icon?: string;
  sound?: string;
}

export interface NotificationSubscription {
  userId: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  lastActive: Date;
  deviceToken?: string; // For push notifications
}

export enum NotificationChannel {
  IN_APP = 'in_app',         // Real-time in app
  EMAIL = 'email',           // Email notification
  PUSH = 'push',             // Browser/mobile push
  SMS = 'sms',               // SMS (for critical)
  WEBHOOK = 'webhook',       // Webhook callback
}

// ============================================================
// Notification Manager (Server-side)
// ============================================================

class NotificationManager {
  private connections: Map<string, Set<ReadableStreamDefaultController>> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private notificationQueue: Map<string, RealtimeNotification[]> = new Map();

  /**
   * Subscribe user to real-time notifications
   */
  subscribe(userId: string): ReadableStream {
    const stream = new ReadableStream({
      start(controller) {
        // Add connection to user's connections
        if (!this.connections.has(userId)) {
          this.connections.set(userId, new Set());
        }
        this.connections.get(userId)!.add(controller);

        // Send initial connection message
        const initMessage: RealtimeNotification = {
          id: `conn_${Date.now()}`,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          priority: NotificationPriority.LOW,
          title: 'متصل',
          titleEn: 'Connected',
          body: 'تم الاتصال بنظام الإشعارات الفورية',
          bodyEn: 'Connected to real-time notification system',
          recipientId: userId,
          createdAt: new Date(),
        };
        
        controller.enqueue(`data: ${JSON.stringify(initMessage)}\n\n`);

        // Update last active time
        this.updateLastActive(userId);
      },
      cancel() {
        // Remove connection on disconnect
        this.removeConnection(userId, controller);
      },
    });

    return stream;
  }

  /**
   * Remove a specific connection
   */
  private removeConnection(
    userId: string, 
    controller: ReadableStreamDefaultController
  ): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(controller);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Update user's last active timestamp
   */
  updateLastActive(userId: string): void {
    const sub = this.subscriptions.get(userId);
    if (sub) {
      sub.lastActive = new Date();
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string, 
    notification: Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'>
  ): Promise<boolean> {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: this.generateNotificationId(),
      recipientId: userId,
      createdAt: new Date(),
    };

    // Send via SSE if user is connected
    const connections = this.connections.get(userId);
    let sentViaSSE = false;

    if (connections && connections.size > 0) {
      const data = `data: ${JSON.stringify(fullNotification)}\n\n`;
      
      for (const controller of connections) {
        try {
          controller.enqueue(data);
          sentViaSSE = true;
        } catch (error) {
          console.error('[Notification] Failed to send:', error);
          this.removeConnection(userId, controller);
        }
      }
    }

    // Queue for offline users
    if (!sentViaSSE) {
      this.queueForOffline(userId, fullNotification);
    }

    // Trigger other channels based on subscription
    await this.triggerOtherChannels(userId, fullNotification);

    return sentViaSSE;
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcast(
    userIds: string[],
    notification: Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.sendToUser(userId, notification);
        if (result) {
          success++;
        } else {
          failed++;
        }
      })
    );

    return { success, failed };
  }

  /**
   * Broadcast to all connected users (system announcements)
   */
  broadcastToAll(
    notification: Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'>
  ): { reached: number } {
    let reached = 0;
    const data = `data: ${JSON.stringify({
      ...notification,
      id: this.generateNotificationId(),
      createdAt: new Date(),
    })}\n\n`;

    for (const [userId, connections] of this.connections.entries()) {
      for (const controller of connections) {
        try {
          controller.enqueue(data);
          reached++;
        } catch (error) {
          this.removeConnection(userId, controller);
        }
      }
    }

    return { reached };
  }

  /**
   * Queue notification for offline user
   */
  private queueForOffline(userId: string, notification: RealtimeNotification): void {
    if (!this.notificationQueue.has(userId)) {
      this.notificationQueue.set(userId, []);
    }
    
    const queue = this.notificationQueue.get(userId)!;
    queue.push(notification);

    // Keep only last 50 notifications in queue
    if (queue.length > 50) {
      queue.shift();
    }
  }

  /**
   * Get queued notifications for user when they come online
   */
  getQueuedNotifications(userId: string): RealtimeNotification[] {
    const queue = this.notificationQueue.get(userId);
    if (queue) {
      this.notificationQueue.delete(userId);
      return queue;
    }
    return [];
  }

  /**
   * Get number of currently connected users
   */
  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  /**
   * Check if user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.connections.has(userId) && 
           this.connections.get(userId)!.size > 0;
  }

  /**
   * Trigger other notification channels (email, push, etc.)
   */
  private async triggerOtherChannels(
    userId: string, 
    notification: RealtimeNotification
  ): Promise<void> {
    const sub = this.subscriptions.get(userId);
    if (!sub) return;

    // Only trigger for high/urgent priorities or specific types
    if (
      notification.priority === NotificationPriority.URGENT ||
      notification.priority === NotificationPriority.HIGH ||
      [NotificationType.PAYMENT_RECEIVED, NotificationType.SECURITY_ALERT].includes(notification.type)
    ) {
      // TODO: Integrate with:
      // - Email service (Resend/SendGrid)
      // - Push notification service (Firebase Cloud Messaging)
      // - SMS service (Twilio)
      
      console.log(`[Notification] Would trigger additional channels for ${userId}`);
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  // ============================================================
  // Typing Indicators (for messaging)
  // ============================================================

  private typingUsers: Map<string, Set<string>> = new Map();

  setTyping(conversationId: string, userId: string, isTyping: boolean): void {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    const typingSet = this.typingUsers.get(conversationId)!;

    if (isTyping) {
      typingSet.add(userId);
    } else {
      typingSet.delete(userId);
    }

    // Broadcast typing indicator to conversation participants
    this.broadcastTypingIndicator(conversationId, Array.from(typingSet));
  }

  private broadcastTypingIndicator(
    conversationId: string, 
    typingUserIds: string[]
  ): void {
    const data = `data: ${JSON.stringify({
      type: NotificationType.TYPING_INDICATOR,
      conversationId,
      typingUserIds,
      timestamp: new Date(),
    })}\n\n`;

    // This would be sent to all participants in the conversation
    // Implementation depends on how you track conversation membership
  }

  getTypingUsers(conversationId: string): string[] {
    return Array.from(this.typingUsers.get(conversationId) || []);
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// ============================================================
// Notification Helpers & Factories
// ============================================================

export const NotificationFactory = {
  newMessage(
    senderId: string,
    senderName: string,
    conversationId: string,
    messagePreview: string
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    return {
      type: NotificationType.NEW_MESSAGE,
      priority: NotificationPriority.NORMAL,
      title: 'رسالة جديدة',
      titleEn: 'New Message',
      body: `${senderName}: ${messagePreview}`,
      bodyEn: `${senderName}: ${messagePreview}`,
      senderId,
      data: { conversationId },
      icon: '💬',
      actionUrl: `/messages?conversation=${conversationId}`,
    };
  },

  listingLike(
    likerName: string,
    listingTitle: string,
    listingId: string
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    return {
      type: NotificationType.LISTING_LIKE,
      priority: NotificationPriority.LOW,
      title: 'إعجاب جديد',
      titleEn: 'New Like',
      body: `${likerName} أعجب بإعلانك: ${listingTitle}`,
      bodyEn: `${likerName} liked your listing: ${listingTitle}`,
      data: { listingId },
      icon: '❤️',
      actionUrl: `/listings/${listingId}`,
    };
  },

  paymentReceived(
    amount: number,
    currency: string = 'MAD',
    orderId?: string
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    return {
      type: NotificationType.PAYMENT_RECEIVED,
      priority: NotificationPriority.HIGH,
      title: 'استلام دفعة',
      titleEn: 'Payment Received',
      body: `تم استلام مبلغ ${amount} ${currency}`,
      bodyEn: `Received ${amount} ${currency}`,
      data: { amount, currency, orderId },
      icon: '💰',
      actionUrl: '/wallet',
      sound: 'cash_register.mp3',
    };
  },

  orderUpdate(
    status: string,
    orderId: string,
    orderTitle?: string
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    const statusMessages: Record<string, { ar: string; en: string }> = {
      confirmed: { ar: 'تم تأكيد طلبك', en: 'Your order has been confirmed' },
      shipped: { ar: 'تم شحن طلبك', en: 'Your order has been shipped' },
      delivered: { ar: 'تم توصيل طلبك', en: 'Your order has been delivered' },
      cancelled: { ar: 'تم إلغاء طلبك', en: 'Your order has been cancelled' },
    };

    const message = statusMessages[status] || { 
      ar: `تحديث حالة الطلب: ${status}`, 
      en: `Order status updated: ${status}` 
    };

    return {
      type: NotificationType.ORDER_UPDATE,
      priority: NotificationPriority.HIGH,
      title: 'تحديث الطلب',
      titleEn: 'Order Update',
      body: message.ar,
      bodyEn: message.en,
      data: { orderId, status },
      icon: '📦',
      actionUrl: `/orders/${orderId}`,
    };
  },

  systemAnnouncement(
    titleAr: string,
    titleEn: string,
    bodyAr: string,
    bodyEn: string,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    return {
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      priority,
      title: titleAr,
      titleEn: titleEn,
      body: bodyAr,
      bodyEn: bodyEn,
      icon: '📢',
    };
  },

  securityAlert(
    type: 'login' | 'password_change' | 'suspicious_activity',
    details?: string
  ): Omit<RealtimeNotification, 'id' | 'createdAt' | 'recipientId'> {
    const alerts = {
      login: {
        ar: 'تسجيل دخول جديد من جهاز غير معروف',
        en: 'New login from unrecognized device',
      },
      password_change: {
        ar: 'تم تغيير كلمة المرور بنجاح',
        en: 'Password changed successfully',
      },
      suspicious_activity: {
        ar: 'نشاط مشبوه تم رصده على حسابك',
        en: 'Suspicious activity detected on your account',
      },
    };

    return {
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.URGENT,
      title: 'تنبيه أمني',
      titleEn: 'Security Alert',
      body: alerts[type].ar + (details ? `\n${details}` : ''),
      bodyEn: alerts[type].en + (details ? `\n${details}` : ''),
      icon: '🔒',
      actionUrl: '/settings/security',
      sound: 'alert.mp3',
    };
  },
};

// ============================================================
// Export everything
// ============================================================

export default {
  notificationManager,
  NotificationFactory,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
};
