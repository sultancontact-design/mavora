/**
 * مكون إدخال الرسالة
 * Message Input Component
 * 
 * @features
 * - Text input with emoji support
 * - File/image attachment
 * - Reply preview
 * - Character count
 * - Send button with state
 * - Arabic RTL support
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';

// ==================== Types ====================

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  maxLength?: number;
}

// ==================== Icons ====================

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EmojiIcon = () => (
  <span className="text-lg">😊</span>
);

// ==================== Component ====================

export default function MessageInput({
  onSend,
  onTyping,
  placeholder = 'اكتب رسالتك...',
  disabled = false,
  replyTo,
  onCancelReply,
  maxLength = 1000,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // معالجة إرسال الرسالة
  const handleSend = useCallback(() => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;
    
    onSend(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
    setShowEmojiPicker(false);
    
    // إعادة ضبط ارتفاع حقل الإدخال
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [message, attachments, disabled, onSend]);
  
  // معالجة ضغط Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // إرسال بـ Enter بدون Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // تغيير حجم حقل الإدخال تلقائياً
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // تغيير الحجم تلقائياً
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    
    // إشارة الكتابة
    if (onTyping) {
      if (!isComposing && e.target.value.trim()) {
        onTyping(true);
      } else if (!e.target.value.trim()) {
        onTyping(false);
      }
    }
  };
  
  // إضافة مرفق
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = Array.from(e.target.files || []);
    const newFiles = type === 'image' 
      ? files.filter(f => f.type.startsWith('image/'))
      : files.filter(f => !f.type.startsWith('image/'));
    
    setAttachments(prev => [...prev, ...newFiles].slice(0, 5)); // حد أقصى 5 مرفقات
    
    // إعادة تعيين المدخل
    e.target.value = '';
  };
  
  // إزالة مرفق
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // إضافة إيموجي
  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };
  
  // قائمة الإيموجي الشائعة
  const commonEmojis = ['😀', '😂', '👍', '❤️', '🎉', '👋', '🙏', '💪', '🔥', '✅', '⭐', '💯'];
  
  const canSend = (message.trim() || attachments.length > 0) && !disabled;
  
  return (
    <div className="border-t border-gray-200 bg-white p-4 dir-rtl">
      {/* معاينة الرد */}
      {replyTo && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary-600">
              الرد على {replyTo.senderName}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {replyTo.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600 mr-2"
          >
            <CloseIcon />
          </button>
        </div>
      )}
      
      {/* معاينة المرفقات */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon />
              ) : (
                <AttachIcon />
              )}
              <span className="text-sm text-gray-700 max-w-[150px] truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 text-gray-400 hover:text-red-500"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* حقل الإدخال والأدوات */}
      <div className="flex items-end gap-3">
        {/* أزرار الإرفاق */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* زر إرفاق صورة */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            title="إرفاق صورة"
            disabled={disabled}
          >
            <ImageIcon />
          </button>
          
          {/* زر إرفاق ملف */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            title="إرفاق ملف"
            disabled={disabled}
          >
            <AttachIcon />
          </button>
          
          {/* مدخلات مخفية للملفات */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'file')}
          />
        </div>
        
        {/* حقل النص */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-200 text-right dir-rtl"
            style={{ maxHeight: '120px' }}
          />
          
          {/* عداد الأحرف */}
          {message.length > maxLength * 0.9 && (
            <span className={`absolute left-3 bottom-2 text-xs ${
              message.length >= maxLength ? 'text-red-500' : 'text-gray-400'
            }`}>
              {message.length}/{maxLength}
            </span>
          )}
          
          {/* منتقي الإيموجي */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* أزرار الإرسال والإيموجي */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* زر الإيموجي */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            title="إيموجي"
            disabled={disabled}
          >
            <EmojiIcon />
          </button>
          
          {/* زر الإرسال */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-3 rounded-full transition-all ${
              canSend
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="إرسال"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
