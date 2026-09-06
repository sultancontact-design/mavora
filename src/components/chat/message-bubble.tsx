/**
 * فقاعة الرسالة
 * Message Bubble Component
 * 
 * @features
 * - Different styles for sender/receiver
 * - Timestamp display
 * - Read receipts
 * - Reply preview
 * - Image/file attachment support
 * - Edit/delete indicators
 * - Arabic RTL support
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { Message } from '@/lib/chat-service';

// ==================== Types ====================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

// ==================== Icons ====================

const CheckIcon = ({ double = false, read = false }: { double?: boolean; read?: boolean }) => (
  <svg className={`w-4 h-4 ${read ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {double ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    )}
  </svg>
);

const ReplyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

// ==================== Helper Functions ====================

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar-MA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== Component ====================

export default function MessageBubble({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = React.useState(false);
  
  // رسالة النظام
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`flex mb-4 ${isOwn ? 'justify-start' : 'justify-end'} dir-rtl`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* صورة المرسل (للمحادثات الجماعية أو عند الطلب) */}
        {!isOwn && message.sender?.avatar && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={message.sender.avatar}
              alt={message.sender.name}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
        
        {/* محتوى الرسالة */}
        <div className={`relative group`}>
          {/* الرد على رسالة */}
          {message.reply_to_id && (
            <div className={`px-3 py-2 rounded-t-lg text-xs border-b ${
              isOwn 
                ? 'bg-primary-100 border-primary-200 text-primary-800' 
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <div className="font-medium">رد على رسالة</div>
            </div>
          )}
          
          {/* فقاعة الرسالة */}
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isOwn
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm shadow-sm'
            } ${message.reply_to_id ? 'rounded-t-none' : ''}`}
          >
            {/* اسم المرسل (في المحادثات الجماعية) */}
            {!isOwn && (
              <div className={`text-xs font-medium mb-1 ${
                isOwn ? 'text-primary-100' : 'text-primary-600'
              }`}>
                {message.sender?.name || 'مستخدم'}
                {message.sender?.verified && (
                  <span className="mr-1">✓</span>
                )}
              </div>
            )}
            
            {/* المرفق - صورة */}
            {message.message_type === 'image' && message.attachment_url && (
              <div className="mb-2 rounded-lg overflow-hidden">
                <Image
                  src={message.attachment_url}
                  alt="صورة مرفقة"
                  width={300}
                  height={200}
                  className="object-cover max-w-full"
                />
              </div>
            )}
            
            {/* المرفق - ملف */}
            {message.message_type === 'file' && message.attachment_url && (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                  isOwn ? 'bg-primary-500/30' : 'bg-gray-50'
                } hover:opacity-80 transition-opacity`}
              >
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.attachment_name || 'ملف مرفق'}
                  </p>
                  {message.attachment_size && (
                    <p className="text-xs opacity-70">
                      {formatFileSize(message.attachment_size)}
                    </p>
                  )}
                </div>
              </a>
            )}
            
            {/* مشاركة إعلان */}
            {message.message_type === 'listing_share' && message.listing_id && (
              <div className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                isOwn ? 'bg-primary-500/30' : 'bg-gray-50'
              }`}>
                <ImageIcon />
                <span className="text-sm">تمت مشاركة إعلان</span>
              </div>
            )}
            
            {/* نص الرسالة */}
            {message.content && message.content !== '[تم حذف هذه الرسالة]' && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {/* رسالة محذوفة */}
            {message.content === '[تم حذف هذه الرسالة]' && (
              <p className="text-sm italic opacity-60">
                {message.content}
              </p>
            )}
            
            {/* معلومات الرسالة */}
            <div className={`flex items-center justify-end gap-2 mt-1 text-xs ${
              isOwn ? 'text-primary-100' : 'text-gray-400'
            }`}>
              {/* وقت الإرسال */}
              <span>{formatTime(message.created_at)}</span>
              
              {/* مؤشر التعديل */}
              {message.is_edited && (
                <span>تم التعديل</span>
              )}
              
              {/* حالة القراءة (للرسائل الخاصة) */}
              {isOwn && (
                <CheckIcon double={true} read={message.is_read} />
              )}
            </div>
          </div>
          
          {/* أزرار الإجراءات */}
          {showActions && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} ${
              isOwn ? '-translate-x-full -mr-2' : 'translate-x-full ml-2'
            } top-0 flex flex-col gap-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10`}>
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ReplyIcon />
                  رد
                </button>
              )}
              {isOwn && onEdit && !message.is_edited && (
                <button
                  onClick={() => onEdit(message)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <EditIcon />
                  تعديل
                </button>
              )}
              {isOwn && onDelete && (
                <button
                  onClick={() => onDelete(message)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <DeleteIcon />
                  حذف
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { formatTime, formatFileSize };
