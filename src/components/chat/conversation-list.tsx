/**
 * قائمة المحادثات
 * Conversation List Component
 * 
 * @features
 * - List of all conversations with last message
 * - Unread message count badge
 * - Online status indicator
 * - Search/filter conversations
 * - Active conversation highlight
 * - Arabic RTL support
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Conversation } from '@/lib/chat-service';

// ==================== Types ====================

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

// ==================== Icons ====================

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const MuteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

// ==================== Helper Functions ====================

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins}د`;
  if (diffHours < 24) return `منذ ${diffHours}س`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  
  return date.toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' });
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

// ==================== Component ====================

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSearch,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // تصفية المحادثات حسب البحث
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const name = conv.other_participant?.name?.toLowerCase() || '';
      const lastMessage = conv.last_message?.toLowerCase() || '';
      const listingTitle = conv.listing_title?.toLowerCase() || '';
      
      return name.includes(query) || lastMessage.includes(query) || listingTitle.includes(query);
    });
  }, [conversations, searchQuery]);
  
  // معالجة البحث
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };
  
  // حالة التحميل
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dir-rtl">
      {/* رأس القائمة */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">الرسائل</h2>
        
        {/* شريط البحث */}
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="البحث في المحادثات..."
            className="w-full pr-10 pl-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dir-rtl"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
        </div>
      </div>
      
      {/* قائمة المحادثات */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          /* حالة فارغة */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <ChatIcon />
            {searchQuery ? (
              <>
                <h3 className="mt-4 font-medium text-gray-900">لا توجد نتائج</h3>
                <p className="mt-1 text-sm text-gray-500">
                  لم نعثر على محادثات تطابق &quot;{searchQuery}&quot;
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-4 font-medium text-gray-900">لا توجد رسائل</h3>
                <p className="mt-1 text-sm text-gray-500">
                  ابدأ محادثة مع بائع للتواصل بشأن منتج
                </p>
              </>
            )}
          </div>
        ) : (
          /* قائمة المحادثات */
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-white transition-colors text-right ${
                  conversation.id === activeConversationId ? 'bg-primary-50 border-r-4 border-primary-600' : ''
                }`}
              >
                {/* صورة الطرف الآخر */}
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full overflow-hidden ${
                    conversation.other_participant?.is_online ? 'ring-2 ring-green-500' : ''
                  }`}>
                    {conversation.other_participant?.avatar ? (
                      <Image
                        src={conversation.other_participant.avatar}
                        alt={conversation.other_participant.name || ''}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                        {(conversation.other_participant?.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* مؤشر الاتصال */}
                  {conversation.other_participant?.is_online && (
                    <span className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                {/* معلومات المحادثة */}
                <div className="flex-1 min-w-0">
                  {/* الاسم والوقت */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.other_participant?.name || 'مستخدم'}
                      {conversation.other_participant?.verified && (
                        <span className="mr-1 text-blue-500">✓</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conversation.is_muted && (
                        <MuteIcon />
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(conversation.last_message_time)}
                      </span>
                    </div>
                  </div>
                  
                  {/* آخر رسالة وعدد غير المقروءة */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${
                      conversation.id === activeConversationId ? 'text-primary-700' : 'text-gray-500'
                    }`}>
                      {truncateText(conversation.last_message || 'لا توجد رسائل', 50)}
                    </p>
                    
                    {/* شارة الرسائل غير المقروءة */}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary-600 text-white text-xs font-medium rounded-full">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                  </div>
                  
                  {/* عنوان الإعلان إن وجد */}
                  {conversation.listing_title && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      📦 {conversation.listing_title}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { formatRelativeTime, truncateText };
