'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ConversationPreview {
  id: string;
  listing_id: string | null;
  updated_at: string;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  other_user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  listing_title: string | null;
  listing_thumbnail: string | null;
  unread_count: number;
}

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
  };
}

type RealtimeStatus = 'connecting' | 'connected' | 'error';

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
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const displayName = conversation.other_user?.display_name ?? t('common.messages');
  const avatarUrl = conversation.other_user?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  let previewText = '';
  if (conversation.last_message) {
    const isOwn = conversation.last_message.sender_id === user?.id;
    const prefix = isOwn
      ? locale === 'ar'
        ? 'أنت: '
        : locale === 'fr'
          ? 'Vous: '
          : 'You: '
      : '';
    previewText = prefix + conversation.last_message.content;
  }

  const time = conversation.last_message
    ? formatMessageTime(conversation.last_message.created_at, locale)
    : formatMessageTime(conversation.created_at, locale);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-border p-4 text-start transition-colors hover:bg-accent/50 ${isSelected ? 'bg-accent' : ''}`}
    >
      <Avatar className="size-12 shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        {conversation.listing_title && (
          <p className="mt-0.5 truncate text-xs text-emerald font-medium">{conversation.listing_title}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {previewText || '—'}
          </p>
          {conversation.unread_count > 0 && (
            <Badge className="shrink-0 h-5 min-w-5 rounded-full bg-emerald px-1.5 text-xs text-white">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
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
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn ? 'rounded-tr-sm bg-emerald text-white' : 'rounded-tl-sm bg-muted text-foreground'}`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}
        >
          {formatMessageTime(message.created_at, locale)}
        </p>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Supabase Realtime subscription for new messages in the selected conversation
  useEffect(() => {
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!selectedConvId) {
      setRealtimeStatus('connecting');
      return;
    }

    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('messages:' + selectedConvId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (in case we already appended via the send response)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Update the conversation's last message in the sidebar
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConvId
                ? {
                    ...c,
                    updated_at: newMsg.created_at,
                    last_message: {
                      content: newMsg.content,
                      created_at: newMsg.created_at,
                      sender_id: newMsg.sender_id,
                    },
                  }
                : c
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedConvId]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);
    setMessages([]);

    async function loadMessages() {
      try {
        let allMessages: Message[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(`/api/conversations/${selectedConvId}/messages?page=${page}&per_page=100`);
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
    }

    loadMessages();
  }, [selectedConvId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Auto-scroll on mount
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }, 100);
  }, [loadingMessages]);

  const handleSelectConversation = useCallback(
    (convId: string) => {
      setSelectedConvId(convId);
      if (isMobile) {
        setShowChat(true);
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    },
    [isMobile]
  );

  const handleBackToList = useCallback(() => {
    setShowChat(false);
    setSelectedConvId(null);
    fetchConversations();
  }, [fetchConversations]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConvId || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);

        // Realtime via Supabase will handle the other participant's update automatically
        // Update the conversation's last message in the list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? {
                  ...c,
                  updated_at: msg.created_at,
                  last_message: {
                    content: msg.content,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id,
                  },
                }
              : c
          )
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
  }, [selectedConvId, newMessage, sending, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Loading state
  if (loadingConvs) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0 && !selectedConvId) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('messages.no_conversations')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('messages.no_conversations_subtitle')}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t('messages.contact_to_start')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] border-t border-border" dir={direction}>
      {/* Conversation List */}
      <div
        className={`${isMobile ? (showChat ? 'hidden' : 'flex') : 'flex'} w-full shrink-0 flex-col border-e border-border md:w-80 lg:w-96`}
      >
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">{t('messages.title')}</h1>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConvId}
              onClick={() => handleSelectConversation(conv.id)}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Messages Panel */}
      <div
        className={`${isMobile ? (showChat ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col`}
      >
        {selectedConv ? (
          <>
            {/* Realtime Status Indicator */}
            <div className="flex items-center border-b border-border px-4 py-1">
              <div className={`flex items-center gap-1.5 text-[10px] ${realtimeStatus === 'connected' ? 'text-emerald' : realtimeStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                <span className={`inline-block size-1.5 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald' : realtimeStatus === 'error' ? 'bg-destructive' : 'bg-muted-foreground animate-pulse'}`} />
                {t('realtime.' + realtimeStatus)}
              </div>
            </div>

            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleBackToList}
                  aria-label={t('common.back')}
                >
                  <ArrowLeft className="size-5" />
                </Button>
              )}
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={selectedConv.other_user?.avatar_url ?? undefined} alt={selectedConv.other_user?.display_name ?? ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {selectedConv.other_user?.display_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedConv.other_user?.display_name ?? t('common.messages')}
                </p>
                {selectedConv.listing_title && (
                  <p className="truncate text-xs text-emerald font-medium">{selectedConv.listing_title}</p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <ImageIcon className="mx-auto size-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">{t('messages.new_conversation')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

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
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                  className="shrink-0 bg-emerald text-white hover:bg-emerald/90"
                  aria-label={t('messages.send')}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('messages.no_conversations')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
