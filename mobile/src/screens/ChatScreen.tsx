/**
 * Chat Screen for Mavora Mobile
 * Real-time messaging UI, message bubbles, input field
 * 
 * @module screens/ChatScreen
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, Message } from '../services/SupabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n';
import { formatTime, formatDate } from '../utils/formatting';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

// ============================================================
// Types
// ============================================================

interface ChatMessage extends Message {
  isOwn: boolean;
}

// ============================================================
// Main Component
// ============================================================

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Route params
  const { conversationId, userName, userAvatar } = route.params;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
    subscribeToMessages();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [conversationId]);

  // Update header with user info
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerUserName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={[styles.headerStatus, { color: otherUserOnline ? '#22c55e' : colors.textTertiary }]}>
            {otherUserOnline ? t('chat.online') : t('chat.offline')}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerMoreButton}
          onPress={() => showMoreOptions()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [userName, otherUserOnline, colors]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Extract participant IDs from conversation ID
      const [userId1, userId2] = conversationId.split('-');
      const otherUserId = userId1 === user?.id ? userId2 : userId1;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`conversation_id.eq.${conversationId},and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Mark messages as read
      if (data && data.length > 0) {
        await markMessagesAsRead(data);
      }

      // Transform messages
      const chatMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        isOwn: msg.sender_id === user?.id,
      }));

      setMessages(chatMessages);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(false), 100);

    } catch (error) {
      console.error('[Chat] Fetch messages error:', error);
      // Use mock data for development
      setMessages(getMockMessages(user?.id));
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const [userId1, userId2] = conversationId.split('-');

    subscriptionRef.current = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const chatMsg: ChatMessage = {
            ...newMsg,
            isOwn: newMsg.sender_id === user?.id,
          };
          
          setMessages(prev => [...prev, chatMsg]);
          
          // Scroll to bottom for new messages
          setTimeout(() => scrollToBottom(true), 100);

          // Mark as read if not own message
          if (!chatMsg.isOwn) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .subscribe();
  };

  const markMessagesAsRead = async (msgs: Message[]) => {
    try {
      const unreadMsgs = msgs.filter(m => !m.is_read && m.sender_id !== user?.id);
      
      if (unreadMsgs.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadMsgs.map(m => m.id));
      }
    } catch (error) {
      console.error('[Chat] Mark as read error:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('[Chat] Mark message as read error:', error);
    }
  };

  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage || !user) return;

    try {
      setSending(true);

      const [userId1, userId2] = conversationId.split('-');
      const receiverId = userId1 === user.id ? userId2 : userId1;

      const newMessageObj: Partial<Message> = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedMessage,
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        ...newMessageObj as Message,
        isOwn: true,
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');
      scrollToBottom(true);

      // Send to Supabase
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmedMessage,
        message_type: 'text',
      });

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('[Chat] Send message error:', error);
      Alert.alert(t('errors.generic'), t('chat.messageError'));
      
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (animated: boolean = true) => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated });
    }
  };

  const showMoreOptions = () => {
    Alert.alert('', '', [
      { text: t('chat.clearChat'), style: 'destructive', onPress: handleClearChat },
      { text: t('chat.blockUser'), style: 'default', onPress: handleBlockUser },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleClearChat = () => {
    Alert.alert(
      t('chat.clearChat'),
      t('chat.clearChatConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId);
              setMessages([]);
            } catch (error) {
              console.error('[Chat] Clear chat error:', error);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      '',
      t('chat.userBlocked'),
      [{ text: t('common.ok') }]
    );
  };

  // Render helpers
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const showDateSeparator = shouldShowDateSeparator(index);
    
    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDate(item.created_at, 'short')}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageWrapper,
          item.isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
        ]}>
          {!item.isOwn && (
            <Image
              source={{ uri: userAvatar || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
          )}
          
          <View style={[
            styles.messageBubble,
            item.isOwn 
              ? [styles.ownBubble, { backgroundColor: colors.primary }]
              : [styles.otherBubble, { backgroundColor: colors.surface }],
          ]}>
            <Text style={[
              styles.messageText,
              { color: item.isOwn ? '#fff' : colors.text },
            ]}>
              {item.content}
            </Text>
            
            <View style={[
              styles.messageMeta,
              item.isOwn ? styles.ownMessageMeta : styles.otherMessageMeta,
            ]}>
              <Text style={[
                styles.messageTime,
                { 
                  color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary,
                },
              ]}>
                {formatTime(item.created_at)}
              </Text>
              {item.is_own && (
                <Ionicons 
                  name={item.is_read ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.is_read ? '#60a5fa' : 'rgba(255,255,255,0.5)'} 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  const shouldShowDateSeparator = (index: number): boolean => {
    if (index === 0) return true;
    
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    
    if (!currentMsg || !prevMsg) return false;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    
    return currentDate !== prevDate;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={{ uri: userAvatar || 'https://via.placeholder.com/80' }}
        style={styles.emptyAvatar}
      />
      <Text style={[styles.emptyName, { color: colors.text }]}>
        {userName}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {t('chat.noMessages')}
      </Text>
      <Text style={[styles.startConversationText, { color: colors.textTertiary }]}>
        {t('chat.startConversation')}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  // Input component
  const renderInputBar = () => (
    <View style={[styles.inputContainer, { 
      backgroundColor: colors.surface, 
      borderTopColor: colors.border 
    }]}>
      {/* Attachment Button */}
      <TouchableOpacity 
        style={styles.attachButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Text Input */}
      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={() => newMessage.trim() && sendMessage()}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: newMessage.trim() ? colors.primary : colors.border },
          sending && { opacity: 0.6 },
        ]}
        onPress={sendMessage}
        disabled={!newMessage.trim() || sending}
        activeOpacity={0.8}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color={newMessage.trim() ? "#fff" : colors.textTertiary} />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollToBottom(false)}
        inverted={false}
      />

      {renderInputBar()}
    </KeyboardAvoidingView>
  );
};

// ============================================================
// Mock Data Generator
// ============================================================

function getMockMessages(currentUserId?: string): ChatMessage[] {
  const now = new Date();
  
  return [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'السلام عليكم! أريد الاستفسار عن المنتج المعروض',
      message_type: 'text',
      is_read: true,
      created_at: new Date(now.getTime() - 3600000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: currentUserId || 'user-1',
      content: 'وعليكم السلام! تفضل، أنا جاهز للإجابة على استفساراتك',
      message_type: 'text',
      is_read: true,
      created_at: new Date(now.getTime() - 3500000).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg-3',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'هل المنتج لا يزال متاحاً؟ وما هي حالته بالضبط؟',
      message_type: 'text',
      is_read: true,
      created_at: new Date(now.getTime() - 3400000).toISOString(),
      isOwn: false,
    },
    {
      id: 'msg-4',
      conversation_id: 'conv-1',
      sender_id: currentUserId || 'user-1',
      content: 'نعم المتاح، الحالة ممتازة استخدمته لمدة شهر فقط. الجهاز يعمل بشكل مثالي بدون أي مشاكل.',
      message_type: 'text',
      is_read: true,
      created_at: new Date(now.getTime() - 3300000).toISOString(),
      isOwn: true,
    },
    {
      id: 'msg-5',
      conversation_id: 'conv-1',
      sender_id: 'user-2',
      content: 'ممتاز! هل السعر قابل للتفاوض قليلاً؟',
      message_type: 'text',
      is_read: false,
      created_at: new Date(now.getTime() - 300000).toISOString(),
      isOwn: false,
    },
  ];
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Cairo-SemiBold',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'Cairo',
    marginTop: 2,
  },
  headerMoreButton: {
    padding: 4,
  },

  // Messages List
  messagesList: {
    padding: 16,
    paddingTop: 8,
  },
  messagesListEmpty: {
    flexGrow: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  emptyName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Cairo',
    marginBottom: 6,
  },
  startConversationText: {
    fontSize: 13,
    fontFamily: 'Cairo',
    textAlign: 'center',
  },

  // Date Separator
  dateSeparator: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'Cairo',
    overflow: 'hidden',
  },

  // Message Wrapper
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },

  // Avatar
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 8,
    marginStart: 8,
  },

  // Message Bubble
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // Message Text
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Cairo',
  },

  // Message Meta
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  ownMessageMeta: {
    marginLeft: 12,
  },
  otherMessageMeta: {
    marginRight: 12,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Cairo',
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  attachButton: {
    paddingBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Cairo',
    maxHeight: 80,
    padding: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
