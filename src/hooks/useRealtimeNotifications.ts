/**
 * useRealtimeNotifications Hook
 * React hook for subscribing to real-time notifications via SSE
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeNotification, NotificationType } from '@/lib/realtime-notifications';

interface UseRealtimeNotificationsOptions {
  autoConnect?: boolean;
  onNotification?: (notification: RealtimeNotification) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Event) => void;
  types?: NotificationType[]; // Filter by notification types
}

interface UseRealtimeNotificationsReturn {
  isConnected: boolean;
  lastNotification: RealtimeNotification | null;
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  clearNotifications: () => void;
  notifications: RealtimeNotification[];
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    autoConnect = true,
    onNotification,
    onConnectionChange,
    onError,
    types,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<RealtimeNotification | null>(null);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.readAt).length;

  // Handle incoming notification
  const handleNotification = useCallback((notification: RealtimeNotification) => {
    // Filter by types if specified
    if (types && !types.includes(notification.type)) {
      return;
    }

    setLastNotification(notification);
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100
    
    // Call external handler
    if (onNotification) {
      onNotification(notification);
    }

    // Show browser notification if permitted
    if (Notification.permission === 'granted' && notification.priority === 'high') {
      showBrowserNotification(notification);
    }
  }, [types, onNotification]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    // Don't connect if already connected
    if (eventSourceRef?.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connected to notification stream');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        if (onConnectionChange) {
          onConnectionChange(true);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (error) {
          console.error('[SSE] Failed to parse notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        setIsConnected(false);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }

        if (onError) {
          onError(error);
        }

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[SSE] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setIsConnected(false);
    }
  }, [handleNotification, onConnectionChange, onError]);

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    
    if (onConnectionChange) {
      onConnectionChange(false);
    }
  }, [onConnectionChange]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setLastNotification(null);
  }, []);

  // Show browser notification
  const showBrowserNotification = (notification: RealtimeNotification) => {
    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/notification-icon.png',
        tag: notification.id,
        data: {
          url: notification.actionUrl,
          notificationId: notification.id,
        },
      });
    } catch (error) {
      console.error('[Notification] Failed to show browser notification:', error);
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
      requestPermission();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastNotification,
    unreadCount,
    connect,
    disconnect,
    clearNotifications,
    notifications,
  };
}

// ============================================================
// Notification Bell Component Helper
// ============================================================

export interface UseNotificationBellReturn extends UseRealtimeNotificationsReturn {
  isOpen: boolean;
  toggleDropdown: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

export function useNotificationBell(
  options: UseRealtimeNotificationsOptions = {}
): UseNotificationBellReturn {
  const base = useRealtimeNotifications(options);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  const markAsRead = (notificationId: string) => {
    // This would call API to mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, readAt: new Date() } : n)
    );
  };

  const markAllAsRead = () => {
    // This would call API to mark all as read
    const now = new Date();
    setNotifications(prev => prev.map(n => ({ ...n, readAt: now })));
    setIsOpen(false);
  };

  return {
    ...base,
    isOpen,
    toggleDropdown,
    markAsRead,
    markAllAsRead,
  };
}

export default useRealtimeNotifications;
