/**
 * صفحة مركز الإشعارات
 * Notification Center Page
 * 
 * @features
 * - Full list of all notifications
 * - Filter by type
 * - Mark as read / delete actions
 * - Infinite scroll
 * - Arabic RTL support
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Notification, NotificationType } from '@/lib/notification-service';
import {
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '@/lib/notification-service';

// ==================== Types ====================

interface NotificationCenterProps {
  userId?: string;
}

// ==================== Icons ====================

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);

const BellIcon = () => (
  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
    />
  </svg>
);

// ==================== Notification Types for Filter ====================

const NOTIFICATION_TYPES: Array<{ value: NotificationType | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'الكل', icon: '📋' },
  { value: 'message', label: 'الرسائل', icon: '💬' },
  { value: 'order_created', label: 'الطلبات الجديدة', icon: '🛒' },
  { value: 'payment_received', label: 'المدفوعات', icon: '💰' },
  { value: 'review_received', label: 'التقييمات', icon: '⭐' },
  { value: 'follower', label: 'المتابعون', icon: '👤' },
  { value: 'promotion', label: 'العروض', icon: '🎉' },
  { value: 'system', label: 'النظام', icon: 'ℹ️' },
];

// ==================== Component ====================

export default function NotificationCenter({ userId = 'demo-user' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // جلب الإشعارات
  const fetchNotifications = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      
      if (loadMore && notifications.length > 0) {
        params.set('offset', notifications.length.toString());
      }
      
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { 'x-user-id': userId },
      });
      
      const data = await response.json();
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications || []);
      }
      
      setUnreadCount(data.unread_count || 0);
      setHasMore(data.notifications?.length === 20);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId, selectedType, notifications.length]);
  
  // تحميل أولي
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, selectedType]);
  
  // تحديد كمقروء
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ action: 'mark_read' }),
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('خطأ:', error);
    }
  };
  
  // تحديد الكل كمقروء
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('خطأ:', error);
    }
  };
  
  // حذف إشعار
  const handleDelete = async (notificationId: string) => {
    if (!confirm('هل تريد حذف هذا الإشعار؟')) return;
    
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('خطأ:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 dir-rtl" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 
              ? `لديك ${unreadCount} إشعار غير مقروء` 
              : 'جميع الإشعارات مقروءة'
            }
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <CheckIcon />
            تحديد الكل مقروء
          </button>
        )}
      </div>
      
      {/* فلتر النوع */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <span className="flex items-center gap-2 text-sm text-gray-600 mr-2">
          <FilterIcon />
          تصفية:
        </span>
        
        {NOTIFICATION_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedType === type.value
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
            }`}
          >
            <span className="ml-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
      
      {/* قائمة الإشعارات */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          /* حالة التحميل */
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          /* حالة فارغة */
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <BellIcon />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {selectedType === 'all' 
                ? 'ليس لديك أي إشعارات بعد. سنتذرك عند حدوث شيء مهم!'
                : `لا توجد إشعارات من نوع "${NOTIFICATION_TYPES.find(t => t.value === selectedType)?.label}"`
              }
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              استكشف مافورا
            </Link>
          </div>
        ) : (
          /* قائمة الإشعارات */
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* أيقونة */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white text-xl`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                {/* المحتوى */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${
                        notification.is_read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                        {!notification.is_read && (
                          <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mr-2 align-middle" />
                        )}
                      </h3>
                      
                      <p className={`mt-1 text-sm ${
                        notification.is_read ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{formatNotificationTime(notification.created_at)}</span>
                        
                        {notification.action_url && (
                          <a 
                            href={notification.action_url}
                            className="text-primary-600 hover:text-primary-700"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = notification.action_url!;
                            }}
                          >
                            {notification.action_text || 'عرض التفاصيل'}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* صورة */}
                    {notification.image_url && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={notification.image_url}
                          alt=""
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* أزرار الإجراءات */}
                  <div className="flex items-center gap-2 mt-3">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <CheckIcon />
                        تحديد كمقروء
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <TrashIcon />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        /* زر تحميل المزيد */
        {hasMore && !isLoading && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isLoadingMore}
              className="px-6 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Note: NotificationCenter is exported as a named export above
