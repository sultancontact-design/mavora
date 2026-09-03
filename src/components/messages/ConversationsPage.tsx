'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Search,
  Filter,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import ConversationView from './ConversationView';

interface ConversationPreview {
  id: string;
  listing_id: string | null;
  updated_at: string;
  created_at: string;
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
type SortOption = 'recent' | 'newest' | 'unread';

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
  onMarkRead,
  onDelete,
  locale,
  t,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  locale: string;
  t: (key: string) => string;
}) {
  const user = useAuthStore((s) => s.user);
  const [showActions, setShowActions] = useState(false);

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
    <div
      className={`group flex w-full items-start gap-3 border-b border-border p-4 text-start transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button onClick={onClick} className="flex flex-1 items-start gap-3 min-w-0">
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
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </button>

      {/* Quick Actions */}
      {showActions && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {conversation.unread_count > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              title={t('messages.mark_read')}
            >
              <CheckCheck className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title={t('messages.leave_conversation')}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ConversationsPage() {
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Filtered and sorted conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (conv) =>
          conv.other_user?.display_name?.toLowerCase().includes(query) ||
          conv.listing_title?.toLowerCase().includes(query) ||
          conv.last_message?.content?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'unread':
        result.sort((a, b) => {
          // Unread first, then by recent activity
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
    }

    return result;
  }, [conversations, searchQuery, sortBy]);

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

  const handleSelectConversation = useCallback(
    (convId: string) => {
      setSelectedConvId(convId);
      if (isMobile) {
        setShowChat(true);
      }
    },
    [isMobile]
  );

  const handleBackToList = useCallback(() => {
    setShowChat(false);
    setSelectedConvId(null);
    fetchConversations();
  }, [fetchConversations]);

  const handleMarkConversationRead = useCallback(async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}/read`, { method: 'PUT' });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      // silent
    }
  }, []);

  const handleDeleteConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (selectedConvId === convId) {
          handleBackToList();
        }
        toast.success(t('messages.conversation_left'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }, [selectedConvId, handleBackToList, t]);

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
        className={`${
          isMobile ? (showChat ? 'hidden' : 'flex') : 'flex'
        } w-full shrink-0 flex-col border-e border-border md:w-80 lg:w-96`}
      >
        {/* Header with Search and Sort */}
        <div className="space-y-3 border-b border-border p-4">
          <h1 className="text-lg font-bold text-foreground">{t('messages.title')}</h1>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.search_conversations')}
              className="ps-9"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredConversations.length} {t('messages.conversations')}
            </span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="me-1 size-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t('messages.sort_recent')}</SelectItem>
                <SelectItem value="newest">{t('messages.sort_newest')}</SelectItem>
                <SelectItem value="unread">{t('messages.sort_unread')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t('messages.no_results')}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedConvId}
                onClick={() => handleSelectConversation(conv.id)}
                onMarkRead={() => handleMarkConversationRead(conv.id)}
                onDelete={() => handleDeleteConversation(conv.id)}
                locale={locale}
                t={t}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Messages Panel / Conversation View */}
      <div
        className={`${isMobile ? (showChat ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col`}
      >
        {selectedConvId ? (
          <ConversationView
            conversationId={selectedConvId}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('messages.select_conversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
