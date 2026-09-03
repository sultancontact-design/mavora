'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Loader2,
  ArrowLeft,
  MoreVertical,
  Flag,
  Trash2,
  CheckCheck,
  User,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
  };
}

interface ConversationDetail {
  id: string;
  listing_id: string | null;
  listing: {
    id: string;
    title: string;
    seller_id: string;
    status: string;
    thumbnail: string | null;
  } | null;
  other_user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
    is_suspended?: boolean;
  } | null;
  last_message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    type: string;
  } | null;
  unread_count: number;
}

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
}

type SortOption = 'newest' | 'oldest';

function formatMessageTime(dateStr: string, locale: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) {
    return locale === 'ar' ? 'الآن' : locale === 'fr' ? "à l'instant" : 'just now';
  }
  if (minutes < 60) {
    return locale === 'ar'
      ? `منذ ${minutes} د`
      : locale === 'fr'
        ? `${minutes}min`
        : `${minutes}m`;
  }
  if (hours < 24) {
    return locale === 'ar'
      ? `منذ ${hours} س`
      : locale === 'fr'
        ? `${hours}h`
        : `${hours}h`;
  }
  if (days < 7) {
    return locale === 'ar'
      ? `منذ ${days} يوم`
      : locale === 'fr'
        ? `il y a ${days}j`
        : `${days}d ago`;
  }
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const { locale } = useTranslation();

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="mt-auto size-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url ?? undefined} alt={message.sender?.display_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {message.sender?.display_name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn ? 'rounded-tr-sm bg-emerald text-white' : 'rounded-tl-sm bg-muted text-foreground'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        <div className={`mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
            {formatMessageTime(message.created_at, locale)}
          </p>
          {isOwn && (
            <CheckCheck className={`size-3 ${message.is_read ? 'text-blue-300' : 'text-white/50'}`} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  
  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation details
  const fetchConversationDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      } else if (res.status === 410) {
        toast.error(t('messages.conversation_left'));
        onBack();
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingDetail(false);
    }
  }, [conversationId, t, onBack]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    setMessages([]);

    try {
      let allMessages: Message[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`/api/conversations/${conversationId}/messages?page=${page}&per_page=100`);
        if (!res.ok) break;
        const data = await res.json();
        allMessages = [...allMessages, ...data.data];
        hasMore = page < data.total_pages;
        page++;
      }

      setMessages(allMessages);
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversationDetail();
    fetchMessages();
  }, [fetchConversationDetail, fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loadingMessages]);

  // Initial scroll
  useEffect(() => {
    if (!loadingMessages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      }, 100);
    }
  }, [loadingMessages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);
        
        // Update conversation's last message
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                last_message: {
                  id: msg.id,
                  content: msg.content,
                  created_at: msg.created_at,
                  sender_id: msg.sender_id,
                  type: msg.message_type,
                },
              }
            : prev
        );
      } else {
        const err = await res.json().catch(() => ({ error: t('common.error') }));
        toast.error(err.error || t('common.error'));
        setNewMessage(content);
      }
    } catch {
      toast.error(t('common.error'));
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [conversationId, newMessage, sending, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleMarkAsRead = useCallback(async () => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, { method: 'PUT' });
      setMessages((prev) =>
        prev.map((m) => (m.sender_id !== user?.id ? { ...m, is_read: true } : m))
      );
      setConversation((prev) => (prev ? { ...prev, unread_count: 0 } : prev));
    } catch {
      // silent
    }
  }, [conversationId, user?.id]);

  const handleReport = useCallback(async () => {
    if (!reportReason) {
      toast.error(t('messages.select_reason'));
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription || undefined,
        }),
      });

      if (res.ok) {
        toast.success(t('messages.report_submitted'));
        setReportDialogOpen(false);
        setReportReason('');
        setReportDescription('');
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmittingReport(false);
    }
  }, [conversationId, reportReason, reportDescription, t]);

  const handleLeaveConversation = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('messages.conversation_left'));
        setDeleteDialogOpen(false);
        onBack();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  }, [conversationId, onBack, t]);

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  if (loadingDetail) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className={locale === 'ar' ? 'rotate-180 size-5' : 'size-5'} />
          </Button>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">{t('messages.not_found')}</p>
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir={direction}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onBack}
          aria-label={t('common.back')}
        >
          <ArrowLeft className={locale === 'ar' ? 'rotate-180 size-5' : 'size-5'} />
        </Button>

        <Avatar className="size-9 shrink-0">
          <AvatarImage
            src={conversation.other_user?.avatar_url ?? undefined}
            alt={conversation.other_user?.display_name ?? ''}
          />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {conversation.other_user?.display_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) ?? '?'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {conversation.other_user?.display_name ?? t('common.messages')}
            </p>
            {conversation.other_user?.is_verified && (
              <Badge variant="secondary" className="bg-emerald/10 text-emerald text-[10px] px-1.5">
                ✓
              </Badge>
            )}
          </div>
          {conversation.listing && (
            <button
              className="truncate text-left text-xs text-emerald hover:underline"
              onClick={() => window.open(`/listing/${conversation.listing?.id}`, '_blank')}
            >
              {conversation.listing.title}
            </button>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkAsRead}>
              <CheckCheck className="me-2 size-4" />
              {t('messages.mark_read')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
              <Flag className="me-2 size-4" />
              {t('messages.report')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="me-2 size-4" />
              {t('messages.leave_conversation')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <User className="size-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">{conversation.other_user?.display_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('messages.start_conversation')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Listing Link (if exists and at bottom) */}
      {conversation.listing && (
        <div className="border-t border-border px-4 py-2">
          <a
            href={`/listing/${conversation.listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4" />
            <span className="truncate">{conversation.listing.title}</span>
          </a>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messages.type_message')}
            disabled={sending}
            className="flex-1"
            dir="auto"
            maxLength={5000}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="shrink-0 bg-emerald text-white hover:bg-emerald/90"
            aria-label={t('messages.send')}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
        {newMessage.length > 4500 && (
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {newMessage.length}/5000
          </p>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('messages.report_title')}</DialogTitle>
            <DialogDescription>{t('messages.report_description')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('messages.reason')}</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('messages.select_reason')}</option>
                <option value="spam">{t('messages.reason_spam')}</option>
                <option value="harassment">{t('messages.reason_harassment')}</option>
                <option value="inappropriate_content">{t('messages.reason_inappropriate')}</option>
                <option value="scam">{t('messages.reason_scam')}</option>
                <option value="fake_account">{t('messages.reason_fake')}</option>
                <option value="other">{t('messages.reason_other')}</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('messages.description')}</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder={t('messages.description_placeholder')}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || submittingReport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submittingReport ? <Loader2 className="me-2 size-4 animate-spin" /> : <Flag className="me-2 size-4" />}
              {t('messages.submit_report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('messages.leave_title')}</DialogTitle>
            <DialogDescription>{t('messages.leave_description')}</DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleLeaveConversation}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? <Loader2 className="me-2 size-4 animate-spin" /> : <Trash2 className="me-2 size-4" />}
              {t('messages.confirm_leave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
