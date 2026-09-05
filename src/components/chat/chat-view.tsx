/**
 * عرض المحادثة الكامل
 * Full Chat View Component
 * 
 * @features
 * - Message list with auto-scroll
 * - Message input with attachments
 * - Conversation header with participant info
 * - Typing indicator
 * - Real-time message updates
 * - Arabic RTL support
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Message, Conversation } from '@/lib/chat-service';
import MessageBubble from './message-bubble';
import MessageInput from './message-input';
import { formatRelativeTime } from './conversation-list';

// ==================== Types ====================

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string, files?: File[]) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onMarkAsRead?: () => void;
  isLoadingMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onBack?: () => void;
}

// ==================== Icons ====================

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ListingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
    isOnline ? 'bg-green-500' : 'bg-gray-300'
  }`} />
);

// ==================== Component ====================

export default function ChatView({
  conversation,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onMarkAsRead,
  isLoadingMessages = false,
  isLoadingMore = false,
  onLoadMore,
  onBack,
}: ChatViewProps) {
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  
  // التمرير التلقائي للرسالة الجديدة
  useEffect(() => {
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore]);
  
  // تحديد الرسائل كمقروءة عند فتح المحادثة
  useEffect(() => {
    onMarkAsRead?.();
  }, [conversation.id]);
  
  // مراقبة التمرير لتحميل المزيد
  useEffect(() => {
    if (!onLoadMore || !messagesContainerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observerRef.current.observe(sentinel);
    }
    
    return () => observerRef.current?.disconnect();
  }, [onLoadMore, isLoadingMore]);
  
  // التمرير للأسفل
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // معالجة إرسال الرسالة
  const handleSend = useCallback((content: string, files?: File[]) => {
    onSendMessage(content, files);
    setReplyTo(null);
  }, [onSendMessage]);
  
  // معالجة الرد على رسالة
  const handleReply = (message: Message) => {
    setReplyTo({
      id: message.id,
      content: message.content.substring(0, 100),
      senderName: message.sender?.name || 'مستخدم',
    });
  };
  
  // معالجة تعديل رسالة
  const handleEdit = (message: Message) => {
    const newContent = prompt('عدّل رسالتك:', message.content);
    if (newContent && newContent !== message.content && onEditMessage) {
      onEditMessage(message.id, newContent);
    }
  };
  
  // معالجة حذف رسالة
  const handleDelete = (message: Message) => {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟') && onDeleteMessage) {
      onDeleteMessage(message.id);
    }
  };
  
  const otherParticipant = conversation.other_participant;
  const isOnline = otherParticipant?.is_online || false;
  
  return (
    <div className="h-full flex flex-col bg-gray-100 dir-rtl">
      {/* رأس المحادثة */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* زر العودة (للموبايل) */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <BackIcon />
            </button>
          )}
          
          {/* صورة الطرف الآخر */}
          <Link 
            href={`/profile/${otherParticipant?.id}`}
            className="relative flex-shrink-0"
          >
            <div className={`w-10 h-10 rounded-full overflow-hidden ${
              isOnline ? 'ring-2 ring-green-500' : ''
            }`}>
              {otherParticipant?.avatar ? (
                <Image
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name || ''}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                  {(otherParticipant?.name || '?').charAt(0)}
                </div>
              )}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </Link>
          
          {/* معلومات الطرف الآخر */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link 
                href={`/profile/${otherParticipant?.id}`}
                className="font-medium text-gray-900 hover:text-primary-600 truncate"
              >
                {otherParticipant?.name || 'مستخدم'}
              </Link>
              {otherParticipant?.verified && (
                <span className="text-blue-500">✓</span>
              )}
              <OnlineIndicator isOnline={isOnline} />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>
                {isOnline ? 'متصل الآن' : `آخر ظهور: ${formatRelativeTime(otherParticipant?.last_seen)}`}
              </span>
              
              {conversation.listing_id && (
                <Link
                  href={`/listings/${conversation.listing_id}`}
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <ListingIcon />
                  <span>عرض الإعلان</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="relative flex items-center gap-1">
          {/* زر الاتصال (اختياري) */}
          {false && ( // يمكن تفعيله لاحقاً
            <button className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
              <PhoneIcon />
            </button>
          )}
          
          {/* قائمة المزيد */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreIcon />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50">
                    عرض الملف الشخصي
                  </button>
                  <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50">
                    كتم الإشعارات
                  </button>
                  <button className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50">
                    الإبلاغ عن المحادثة
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* قائمة الرسائل */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {/* مؤشر تحميل المزيد */}
        <div id="load-more-sentinel" className="py-4 text-center">
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              جاري تحميل الرسائل...
            </div>
          )}
        </div>
        
        {/* حالة التحميل الأولي */}
        {isLoadingMessages && !isLoadingMore && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
        
        {/* الرسائل */}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>لا توجد رسائل بعد</p>
            <p className="text-sm mt-1">ابدأ المحادثة بإرسال رسالة!</p>
          </div>
        )}
        
        {messages.map((message) => {
          // في الإنتاج، استخدم ID المستخدم الحقيقي
          const isOwn = false; // TODO: مقارنة مع ID المستخدم الحالي
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              onReply={handleReply}
              onEdit={onEditMessage ? handleEdit : undefined}
              onDelete={onDeleteMessage ? handleDelete : undefined}
            />
          );
        })}
        
        {/* نقطة التمرير التلقائية */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* حقل إدخال الرسالة */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        placeholder={`رسالة إلى ${otherParticipant?.name || 'المستخدم'}...`}
      />
    </div>
  );
}

// Note: ChatView is exported as a named export above
