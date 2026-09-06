/**
 * مكون جرس الإشعارات
 * Notification Bell Component
 * 
 * @features
 * - Animated bell icon
 * - Unread count badge
 * - Dropdown with recent notifications
 * - Mark as read functionality
 * - Link to notifications page
 * - Arabic RTL support
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Notification, NotificationType } from '@/lib/notification-service';
import {
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '@/lib/notification-service';

// ==================== Types ====================

interface NotificationBellProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
}

// ==================== Icons ====================

const BellIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <svg 
    className={`w-6 h-6 transition-transform ${hasUnread ? 'animate-bounce' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
    />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    />
  </svg>
);

const MarkReadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ==================== Component ====================

export default function NotificationBell({ 
  userId = 'demo-user',
  onNotificationClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // جلب الإشعارات عند فتح القائمة
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications?limit=5`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json();
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // فتح/إغلاق القائمة
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };
  
  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // معالجة النقر على إشعار
  const handleNotificationClick = async (notification: Notification) => {
    // تحديد كمقروء إن لم يكن
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ action: 'mark_read' }),
        });
        
        // تحديث الحالة محلياً
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, is_read: true } 
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('خطأ في تحديد الإشعار:', error);
      }
    }
    
    // استدعاء رد الاتصال
    onNotificationClick?.(notification);
    
    // التنقل للرابط إن وجد
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    setIsOpen(false);
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
      console.error('خطأ في تحديد الكل كمقروء:', error);
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* زر الجرس */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="الإشعارات"
      >
        <BellIcon hasUnread={unreadCount > 0} />
        
        {/* شارة عدد غير المقروء */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* قائمة الإشعارات المنسدلة */}
      {isOpen && (
        <>
          {/* خلفية */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* القائمة */}
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden dir-rtl">
            {/* رأس القائمة */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">الإشعارات</h3>
              
              <div className="flex items-center gap-2">
                {/* زر تحديد الكل كمقروء */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <MarkReadIcon />
                    تحديد الكل مقروء
                  </button>
                )}
                
                {/* رابط لصفحة جميع الإشعارات */}
                <Link
                  href="/notifications"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  title="جميع الإشعارات"
                >
                  <ChevronLeftIcon />
                </Link>
              </div>
            </div>
            
            {/* قائمة الإشعارات */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                /* حالة التحميل */
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                /* حالة فارغة */
                <div className="text-center py-12 px-4">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-gray-500 text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                /* قائمة الإشعارات */
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full flex items-start gap-3 p-4 text-right hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* أيقونة الإشعار */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white text-lg`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* محتوى الإشعار */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${
                            notification.is_read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2" />
                          )}
                        </div>
                        
                        <p className={`text-sm mt-0.5 line-clamp-2 ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {notification.body}
                        </p>
                        
                        <span className="text-xs text-gray-400 mt-1 block">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                      
                      {/* صورة إن وجدت */}
                      {notification.image_url && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={notification.image_url}
                            alt=""
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* ذيل القائمة */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/notifications"
                className="block w-full text-center py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                عرض جميع الإشعارات
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
