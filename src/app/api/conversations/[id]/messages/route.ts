import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Fetch messages with sender info
    const { data, error, count } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, message_type, is_read, created_at', {
        count: 'exact',
      })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get unique sender IDs
    const senderIds = new Set((data ?? []).map((m) => m.sender_id));
    senderIds.delete(userId);

    const profiles: Record<string, { id: string; display_name: string; avatar_url: string | null }> = {};
    if (senderIds.size > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(senderIds));

      if (profileData) {
        for (const p of profileData) {
          profiles[p.id] = p;
        }
      }
    }

    // Also get the current user's profile for self-referencing
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .single();

    if (myProfile) {
      profiles[userId] = myProfile;
    }

    // Mark messages from other users as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    // Update last_read_at for this user
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    const messages: Message[] = (data ?? []).map((m) => ({
      ...m,
      sender: profiles[m.sender_id]
        ? {
            id: profiles[m.sender_id].id,
            display_name: profiles[m.sender_id].display_name,
            avatar_url: profiles[m.sender_id].avatar_url,
          }
        : undefined,
    }));

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      data: messages,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error('Messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body as { content?: string };

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Send message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      })
      .select('id, conversation_id, sender_id, content, message_type, is_read, created_at')
      .single();

    if (msgError || !message) {
      console.error('Message send error:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation's updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
