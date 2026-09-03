import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is a member of this conversation
    const { data: membership, error: memberError } = await supabase
      .from('conversation_members')
      .select('id, last_read_at, left_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
    }

    // Check if user has left the conversation
    if (membership.left_at) {
      return NextResponse.json({ error: 'You have left this conversation' }, { status: 410 });
    }

    // Fetch conversation with listing info
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, title, seller_id, status, media:listing_media(url, is_primary, sort_order))
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('conversation_members')
      .select('user_id, left_at, joined_at')
      .eq('conversation_id', conversationId);

    if (membersError || !members) {
      console.error('Members fetch error:', membersError);
      return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 });
    }

    const otherMember = members.find((m) => m.user_id !== userId && !m.left_at);

    // Fetch other user's profile
    let otherUser = null;
    if (otherMember) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, is_verified, is_suspended')
        .eq('id', otherMember.user_id)
        .single();

      if (profile) {
        otherUser = {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified,
          is_suspended: profile.is_suspended,
        };
      }
    }

    // Get last message
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id, message_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count unread messages
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    // Get message count
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    const listing = conversation.listing as Record<string, unknown> | null;
    const media = (listing?.media as Record<string, unknown>[]) ?? [];
    const primaryMedia = media.find((m) => m.is_primary) ?? media[0];

    return NextResponse.json({
      id: conversation.id,
      listing_id: conversation.listing_id,
      listing: listing
        ? {
            id: listing.id as string,
            title: listing.title as string,
            seller_id: listing.seller_id as string,
            status: listing.status as string,
            thumbnail: (primaryMedia?.url as string) ?? null,
          }
        : null,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      last_message: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            type: lastMessage.message_type,
          }
        : null,
      other_user: otherUser,
      unread_count: unreadCount ?? 0,
      message_count: messageCount ?? 0,
      members: members.map((m) => ({
        user_id: m.user_id,
        left_at: m.left_at,
        joined_at: m.joined_at,
      })),
    });
  } catch (error) {
    console.error('Conversation detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is a member
    const { data: membership, error: memberError } = await supabase
      .from('conversation_members')
      .select('id, left_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
    }

    if (membership.left_at) {
      return NextResponse.json({ error: 'Already left this conversation' }, { status: 400 });
    }

    // Mark user as having left the conversation (soft delete)
    const { error: updateError } = await supabase
      .from('conversation_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', membership.id);

    if (updateError) {
      console.error('Leave conversation error:', updateError);
      return NextResponse.json({ error: 'Failed to leave conversation' }, { status: 500 });
    }

    // Check if all members have left - if so, we could hard delete
    // For now, just return success
    return NextResponse.json({ success: true, message: 'Left conversation successfully' });
  } catch (error) {
    console.error('Leave conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
