/**
 * مكون العميل لصفحة الرسائل
 * Messages Page Client Component
 */

'use client';

import React, { useState, useCallback } from 'react';
import ConversationList from '@/components/chat/conversation-list';
import ChatView from '@/components/chat/chat-view';
import { useConversations, useConversationMessages } from '@/hooks/use-realtime-chat';
import { Conversation, Message } from '@/lib/chat-service';

// ==================== Component ====================

export default function MessagesPageClient() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // جلب المحادثات
  const {
    conversations,
    isLoading: isLoadingConversations,
    refresh: refreshConversations,
  } = useConversations();
  
  // جلب رسائل المحادثة المحددة
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    loadMore,
    hasMore,
  } = useConversationMessages({
    conversationId: selectedConversation?.id || '',
    enabled: !!selectedConversation,
  });
  
  // اختيار محادثة
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  }, []);
  
  // العودة للقائمة (موبايل)
  const handleBack = useCallback(() => {
    setShowMobileChat(false);
  }, []);
  
  // إرسال رسالة جديدة
  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!selectedConversation) return;
    
    try {
      await sendMessage(content, files);
      // تحديث قائمة المحادثات لعرض آخر رسالة
      refreshConversations();
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      alert('فشل في إرسال الرسالة. حاول مرة أخرى.');
    }
  }, [selectedConversation, sendMessage, refreshConversations]);
  
  // تعديل رسالة
  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content);
    } catch (error) {
      console.error('خطأ في تعديل الرسالة:', error);
      alert('فشل في تعديل الرسالة.');
    }
  }, [editMessage]);
  
  // حذف رسالة
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('خطأ في حذف الرسالة:', error);
      alert('فشل في حذف الرسالة.');
    }
  }, [deleteMessage]);
  
  return (
    <div className="h-[calc(100vh-64px)] flex bg-white dir-rtl" dir="rtl">
      {/* قائمة المحادثات - الجانب الأيمن */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-l border-gray-200 flex-col`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
        />
      </div>
      
      {/* عرض المحادثة - الجانب الأيسر */}
      <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col`}>
        {selectedConversation ? (
          <ChatView
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onMarkAsRead={markAsRead}
            isLoadingMessages={isLoadingMessages}
            isLoadingMore={isLoadingMore}
            onLoadMore={hasMore ? loadMore : undefined}
            onBack={handleBack}
          />
        ) : (
          /* حالة عدم اختيار محادثة */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              {/* أيقونة */}
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-gray-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>
              
              {/* النص */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                مرحباً بك في الرسائل
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                اختر محادثة من القائمة لعرض الرسائل، أو ابدأ محادثة جديدة من صفحة أي إعلان
              </p>
              
              {/* نصائح */}
              <div className="text-sm text-gray-400 space-y-1">
                <p>💡 نصائح:</p>
                <p>• كن محترماً في حواراتك</p>
                <p>• لا تشارك معلومات شخصية حساسة</p>
                <p>• أكمل المعاملات داخل المنصة</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Note: MessagesPageClient is exported as a named export above
