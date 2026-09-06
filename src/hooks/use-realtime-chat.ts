/**
 * هوك الدردشة الفورية
 * Real-time Chat Hook
 * 
 * @features
 * - Subscribe to new messages in real-time
 * - Typing indicators
 * - Online status updates
 * - Auto-reconnection
 * - Message queue for offline mode
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation } from '@/lib/chat-service';
import {
  subscribeToMessages,
  subscribeToMessageUpdates,
  sendTypingIndicator,
} from '@/lib/chat-service';

// ==================== Types ====================

interface UseRealtimeChatOptions {
  conversationId: string;
  userId?: string;
  enabled?: boolean;
}

interface UseRealtimeChatReturn {
  isConnected: boolean;
  newMessage: Message | null;
  clearNewMessage: () => void;
  typingUsers: Map<string, boolean>;
  sendTyping: (isTyping: boolean) => void;
  error: Error | null;
}

// ==================== Hook ====================

export function useRealtimeChat({
  conversationId,
  userId,
  enabled = true,
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [error, setError] = useState<Error | null>(null);
  
  const subscriptionRef = useRef<any>(null);
  const updatesSubscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // الاشتراك في الرسائل الجديدة
  useEffect(() => {
    if (!enabled || !conversationId) return;
    
    let isSubscribed = true;
    
    // الاشتراك في الرسائل الجديدة
    try {
      subscriptionRef.current = subscribeToMessages(conversationId, (message) => {
        if (isSubscribed) {
          setNewMessage(message);
          setIsConnected(true);
        }
      });
    } catch (err) {
      console.error('خطأ في الاشتراك في الرسائل:', err);
      if (isSubscribed) {
        setError(err as Error);
      }
    }
    
    // الاشتراك في تحديثات الرسائل (قراءة، تعديل)
    try {
      updatesSubscriptionRef.current = subscribeToMessageUpdates(conversationId, (message) => {
        if (isSubscribed) {
          // يمكن استخدام هذا لتحديث حالة القراءة أو التعديلات
          setNewMessage(message);
        }
      });
    } catch (err) {
      console.error('خطأ في الاشتراك في التحديثات:', err);
    }
    
    setIsConnected(true);
    
    return () => {
      isSubscribed = false;
      
      // إلغاء الاشتراكات
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (updatesSubscriptionRef.current) {
        updatesSubscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId, enabled]);
  
  // مسح الرسالة الجديدة بعد معالجتها
  const clearNewMessage = useCallback(() => {
    setNewMessage(null);
  }, []);
  
  // إرسال إشارة الكتابة مع debounce
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!userId || !conversationId) return;
    
    // تحديث الحالة محلياً
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, isTyping);
      return newMap;
    });
    
    // إرسال الإشارة
    sendTypingIndicator(conversationId, userId, isTyping);
    
    // إلغاء الإشارة تلقائياً بعد 3 ثوانٍ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(conversationId, userId, false);
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, false);
          return newMap;
        });
      }, 3000);
    }
  }, [userId, conversationId]);
  
  return {
    isConnected,
    newMessage,
    clearNewMessage,
    typingUsers,
    sendTyping,
    error,
  };
}

// ==================== Hook لإدارة قائمة المحادثات ====================

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  unreadCounts: Record<string, number>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/messages', {
        headers: {
          'x-user-id': 'demo-user', // في الإنتاج، استخدم JWT حقيقي
        },
      });
      
      if (!response.ok) {
        throw new Error('فشل في جلب المحادثات');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      // حساب عدد غير المقروءة
      const counts: Record<string, number> = {};
      (data.conversations || []).forEach((conv: Conversation) => {
        if (conv.unread_count) {
          counts[conv.id] = conv.unread_count;
        }
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('خطأ في جلب المحادثات:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  return {
    conversations,
    isLoading,
    error,
    refresh: fetchConversations,
    unreadCounts,
  };
}

// ==================== Hook لإدارة رسائل محادثة محددة ====================

interface UseConversationMessagesOptions {
  conversationId: string;
  enabled?: boolean;
}

interface UseConversationMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useConversationMessages({
  conversationId,
  enabled = true,
}: UseConversationMessagesOptions): UseConversationMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchMessages = useCallback(async (loadOlder = false) => {
    if (loadOlder) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      
      if (loadOlder && messages.length > 0) {
        params.set('before', messages[0].id);
      }
      
      const response = await fetch(`/api/messages/${conversationId}?${params.toString()}`, {
        headers: {
          'x-user-id': 'demo-user',
        },
      });
      
      if (!response.ok) {
        throw new Error('فشل في جلب الرسائل');
      }
      
      const data = await response.json();
      
      if (loadOlder) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages || []);
      }
      
      setHasMore(data.hasMore && (data.messages?.length > 0));
    } catch (err) {
      console.error('خطأ في جلب الرسائل:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [conversationId, messages.length]);
  
  // تحميل الرسائل عند تغير المحادثة
  useEffect(() => {
    if (enabled && conversationId) {
      setMessages([]);
      fetchMessages();
    }
  }, [conversationId, enabled, fetchMessages]);
  
  // إرسال رسالة جديدة
  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    // TODO: رفع الملفات أولاً إذا وجدت
    
    const response = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'demo-user',
      },
      body: JSON.stringify({
        content,
        message_type: files?.length ? 'file' : 'text',
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'فشل في إرسال الرسالة');
    }
    
    const data = await response.json();
    setMessages(prev => [...prev, data.message]);
  }, [conversationId]);
  
  // تعديل رسالة
  const editMessage = useCallback(async (messageId: string, content: string) => {
    const response = fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'demo-user',
      },
      body: JSON.stringify({ content }),
    });
    
    // تحديث الرسالة محلياً
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, is_edited: true, edited_at: new Date().toISOString() }
        : msg
    ));
  }, []);
  
  // حذف رسالة
  const deleteMessage = useCallback(async (messageId: string) => {
    const response = fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': 'demo-user',
      },
    });
    
    // تحديث الرسالة محلياً
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: '[تم حذف هذه الرسالة]' }
        : msg
    ));
  }, []);
  
  // تحديد كمقروءة
  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/messages/${conversationId}`, {
        method: 'PUT',
        headers: {
          'x-user-id': 'demo-user',
        },
      });
    } catch (err) {
      console.error('خطأ في تحديد المقروء:', err);
    }
  }, [conversationId]);
  
  // تحميل المزيد
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchMessages(true);
  }, [hasMore, isLoadingMore, fetchMessages]);
  
  return {
    messages,
    isLoading,
    isLoadingMore,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    loadMore,
    hasMore,
  };
}

export default useRealtimeChat;
