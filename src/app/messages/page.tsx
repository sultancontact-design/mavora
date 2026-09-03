'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import ConversationView from '@/components/messages/ConversationView';
import { 
  Loader2, 
  MessageSquare, 
  Search, 
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  MapPin,
  Star
} from 'lucide-react';
import type { Conversation, Message } from '@/lib/types';

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 border-b bg-white dark:bg-slate-900">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <MavoraLogo size="sm" />
          <h1 className="text-xl font-bold text-primary">{t('common.messages')}</h1>
          <Badge variant="secondary" className="ms-auto">
            {conversations.length}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100%-73px)]">
          {/* Conversations List */}
          <div className={`w-full md:w-80 lg:w-96 border-e bg-white dark:bg-slate-900 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('messages.search_conversations')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10 h-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                /* Loading Skeleton */
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="size-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                /* Empty State */
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                  <p>{searchQuery ? t('messages.no_results') : t('messages.no_conversations')}</p>
                </div>
              ) : (
                /* Conversations List */
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full flex items-start gap-3 p-4 hover:bg-accent transition-colors text-start ${
                        selectedConversation?.id === conv.id ? 'bg-accent' : ''
                      }`}
                    >
                      <Avatar className="size-12 shrink-0">
                        <AvatarImage src={conv.other_user?.avatar_url} alt={conv.other_user?.display_name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.other_user?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">
                            {conv.other_user?.display_name || t('messages.unknown_user')}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0 ms-2">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {conv.listing && (
                          <p className="text-xs text-emerald truncate mb-1">
                            📦 {conv.listing.title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || t('messages.no_messages')}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="shrink-0 size-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-800 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-slate-900">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="size-5" />
                  </Button>
                  <Avatar className="size-10">
                    <AvatarImage src={selectedConversation.other_user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {selectedConversation.other_user?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {selectedConversation.other_user?.display_name}
                    </p>
                    {selectedConversation.listing && (
                      <p className="text-xs text-emerald truncate">
                        📦 {selectedConversation.listing.title}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                        <p>{t('messages.start_conversation')}</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              message.sender_id === user.id
                                ? 'bg-emerald text-white'
                                : 'bg-white dark:bg-slate-700 shadow-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-[10px] mt-1 ${
                              message.sender_id === user.id ? 'text-emerald/70' : 'text-muted-foreground'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white dark:bg-slate-900">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Button type="button" variant="ghost" size="icon">
                      <Paperclip className="size-4" />
                    </Button>
                    <Input
                      type="text"
                      placeholder={t('messages.type_message')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                      className="bg-emerald hover:bg-emerald/90"
                    >
                      {isSending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="size-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{t('messages.select_conversation')}</p>
                  <p className="text-sm mt-2">{t('messages.choose_chat')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
