/**
 * خدمة المحادثات والرسائل
 * Chat & Messaging Service
 * 
 * @features
 * - Real-time messaging via Supabase Realtime
 * - Conversation management
 * - Message typing indicators
 * - Read receipts
 * - File/image attachments
 * - Message search
 * - Arabic RTL support
 */

import { supabase } from '@/lib/supabase';

// ==================== Types ====================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'listing_share';
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  is_read: boolean;
  is_edited: boolean;
  edited_at?: string;
  reply_to_id?: string;
  listing_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    is_online?: boolean;
  };
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  listing_id?: string;
  listing_title?: string;
  listing_image?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_muted?: boolean;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
  other_participant?: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    is_online?: boolean;
    last_seen?: string;
  };
}

export interface CreateMessageDTO {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system' | 'listing_share';
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  reply_to_id?: string;
  listing_id?: string;
}

export interface CreateConversationDTO {
  participant_id: string; // The other participant
  listing_id?: string;
  initial_message?: string;
}

// ==================== Conversation Management ====================

/**
 * جلب جميع محادثات المستخدم
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_1:participant_1_id(id, name, avatar, verified, is_online, last_seen),
      participant_2:participant_2_id(id, name, avatar, verified, is_online, last_seen)
    `)
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('خطأ في جلب المحادثات:', error);
    throw error;
  }
  
  // تحسين البيانات: إضافة معلومات الطرف الآخر
  return (data || []).map(conv => ({
    ...conv,
    other_participant: conv.participant_1_id === userId 
      ? conv.participant_2 
      : conv.participant_1,
  }));
}

/**
 * إنشاء محادثة جديدة
 */
export async function createConversation(
  userId: string,
  dto: CreateConversationDTO
): Promise<Conversation> {
  // التحقق من وجود محادثة سابقة بين نفس الأطراف لنفس الإعلان
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(participant_1_id.eq.${userId},participant_2_id.eq.${dto.participant_id}),and(participant_1_id.eq.${dto.participant_id},participant_2_id.eq.${userId})`)
    .eq('listing_id', dto.listing_id || '')
    .maybeSingle();
  
  if (existing) {
    return existing;
  }
  
  // إنشاء محادثة جديدة
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant_1_id: userId,
      participant_2_id: dto.participant_id,
      listing_id: dto.listing_id,
    })
    .select()
    .single();
  
  if (error) {
    console.error('خطأ في إنشاء المحادثة:', error);
    throw error;
  }
  
  // إرسال الرسالة الأولية إن وجدت
  if (dto.initial_message) {
    await sendMessage(userId, {
      conversation_id: data.id,
      content: dto.initial_message,
    });
  }
  
  return data;
}

/**
 * الحصول على محادثة أو إنشاؤها
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string
): Promise<Conversation> {
  return createConversation(userId, {
    participant_id: otherUserId,
    listing_id: listingId,
  });
}

/**
 * تحديث المحادثة (كتم، أرشفة، etc.)
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Pick<Conversation, 'is_muted' | 'is_archived'>>
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);
  
  if (error) {
    console.error('خطأ في تحديث المحادثة:', error);
    throw error;
  }
}

/**
 * كتم إشعارات المحادثة
 */
export async function muteConversation(conversationId: string): Promise<void> {
  await updateConversation(conversationId, { is_muted: true });
}

/**
 * إلغاء كتم المحادثة
 */
export async function unmuteConversation(conversationId: string): Promise<void> {
  await updateConversation(conversationId, { is_muted: false });
}

/**
 * أرشفة المحادثة
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  await updateConversation(conversationId, { is_archived: true });
}

// ==================== Message Management ====================

/**
 * جلب رسائل محادثة معينة
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name, avatar, verified, is_online)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (before) {
    query = query.lt('id', before);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('خطأ في جلب الرسائل:', error);
    throw error;
  }
  
  // عكس الترتيب لعرض الأحدث في الأسفل
  return (data || []).reverse();
}

/**
 * إرسال رسالة جديدة
 */
export async function sendMessage(
  userId: string,
  dto: CreateMessageDTO
): Promise<Message> {
  // الحصول على معلومات المستقبل
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_1_id, participant_2_id')
    .eq('id', dto.conversation_id)
    .single();
  
  if (!conv) {
    throw new Error('المحادثة غير موجودة');
  }
  
  const receiverId = conv.participant_1_id === userId 
    ? conv.participant_2_id 
    : conv.participant_1_id;
  
  // إنشاء الرسالة
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: dto.conversation_id,
      sender_id: userId,
      receiver_id: receiverId,
      content: dto.content,
      message_type: dto.message_type || 'text',
      attachment_url: dto.attachment_url,
      attachment_name: dto.attachment_name,
      attachment_size: dto.attachment_size,
      reply_to_id: dto.reply_to_id,
      listing_id: dto.listing_id,
    })
    .select(`
      *,
      sender:sender_id(id, name, avatar, verified, is_online)
    `)
    .single();
  
  if (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    throw error;
  }
  
  // تحديث وقت آخر رسالة في المحادثة
  await supabase
    .from('conversations')
    .update({
      last_message: dto.content.substring(0, 100),
      last_message_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', dto.conversation_id);
  
  return data;
}

/**
 * تعديل رسالة
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<Message> {
  // التحقق من ملكية الرسالة
  const { data: existing } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();
  
  if (!existing || existing.sender_id !== userId) {
    throw new Error('غير مصرح بتعديل هذه الرسالة');
  }
  
  const { data, error } = await supabase
    .from('messages')
    .update({
      content: newContent,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();
  
  if (error) {
    console.error('خطأ في تعديل الرسالة:', error);
    throw error;
  }
  
  return data;
}

/**
 * حذف رسالة (ناعم - وضع علامة محذوفة)
 */
export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();
  
  if (!existing || existing.sender_id !== userId) {
    throw new Error('غير مصرح بحذف هذه الرسالة');
  }
  
  const { error } = await supabase
    .from('messages')
    .update({ content: '[تم حذف هذه الرسالة]', is_deleted: true })
    .eq('id', messageId);
  
  if (error) {
    console.error('خطأ في حذف الرسالة:', error);
    throw error;
  }
}

/**
 * تحديد رسالة كمقروءة
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId);
  
  if (error) {
    console.error('خطأ في تحديد الرسالة كمقروءة:', error);
    throw error;
  }
}

/**
 * تحديد جميع رسائل محادثة كمقروءة
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في تحديد المحادثة كمقروءة:', error);
    throw error;
  }
}

// ==================== Search & Utilities ====================

/**
 * البحث في الرسائل
 */
export async function searchMessages(
  userId: string,
  query: string,
  limit = 20
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      conversation:conversation_id(id, listing_title),
      sender:sender_id(id, name, avatar)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('خطأ في البحث في الرسائل:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * الحصول على عدد الرسائل غير المقروءة
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في جلب عدد الرسائل غير المقروءة:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * الحصول على عدد الرسائل غير المقروءة لكل محادثة
 */
export async function getUnreadCountsPerConversation(
  userId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('receiver_id', userId)
    .eq('is_read', false);
  
  if (error) {
    console.error('خطأ في جلب عدد الرسائل غير المقروءة:', error);
    return {};
  }
  
  const counts: Record<string, number> = {};
  (data || []).forEach(msg => {
    counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
  });
  
  return counts;
}

// ==================== Real-time Subscriptions ====================

type MessageCallback = (message: Message) => void;
type TypingCallback = (conversationId: string, userId: string, isTyping: boolean) => void;

/**
 * الاشتراك في رسائل محادثة جديدة
 */
export function subscribeToMessages(
  conversationId: string,
  callback: MessageCallback
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

/**
 * الاشتراك في تحديثات الرسائل (قراءة، تعديل)
 */
export function subscribeToMessageUpdates(
  conversationId: string,
  callback: MessageCallback
) {
  return supabase
    .channel(`message_updates:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

/**
 * إرسال إشارة "يكتب..."
 */
export function sendTypingIndicator(
  conversationId: string,
  userId: string,
  isTyping: boolean
): void {
  // يمكن استخدام Presence في Supabase Realtime
  const channel = supabase.channel(`typing:${conversationId}`);
  
  if (isTyping) {
    channel.track({ user_id: userId, typing: true });
  } else {
    channel.track({ user_id: userId, typing: false });
  }
}

/**
 * الاشتراك في إشارات الكتابة
 */
export function subscribeToTyping(
  conversationId: string,
  callback: TypingCallback
) {
  return supabase
    .channel(`typing:${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      // التعامل مع تحديثات الحضور
    })
    .subscribe();
}

// ==================== Export ====================

export const chatService = {
  // المحادثات
  getUserConversations,
  createConversation,
  getOrCreateConversation,
  updateConversation,
  muteConversation,
  unmuteConversation,
  archiveConversation,
  
  // الرسائل
  getConversationMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationAsRead,
  
  // البحث والإحصائيات
  searchMessages,
  getUnreadCount,
  getUnreadCountsPerConversation,
  
  // Real-time
  subscribeToMessages,
  subscribeToMessageUpdates,
  sendTypingIndicator,
  subscribeToTyping,
};

export default chatService;
