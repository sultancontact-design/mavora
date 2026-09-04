import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

interface ConversationWithPreview {
  id: string;
  listing_id: string | null;
  created_at: string;
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

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversation IDs for this user
    const { data: memberships, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (memberError || !memberships) {
      console.error('Members fetch error:', memberError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (memberships.length === 0) {
      return NextResponse.json([]);
    }

    const conversationIds = memberships.map((m) => m.conversation_id);
    const readMap = new Map(memberships.map((m) => [m.conversation_id, m.last_read_at]));

    // Fetch conversations with listing info
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        listing_id,
        created_at,
        updated_at,
        listing:listings(title, media:listing_media(url, is_primary, sort_order))
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Conversations fetch error:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json([]);
    }

    // Get all member user IDs across all conversations
    const { data: allMembers, error: allMembersError } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds);

    if (allMembersError) {
      console.error('All members fetch error:', allMembersError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const otherUserIds = new Set<string>();
    const convMembersMap = new Map<string, string[]>();
    for (const member of allMembers ?? []) {
      if (!convMembersMap.has(member.conversation_id)) {
        convMembersMap.set(member.conversation_id, []);
      }
      convMembersMap.get(member.conversation_id)!.push(member.user_id);
      if (member.user_id !== userId) {
        otherUserIds.add(member.user_id);
      }
    }

    // Fetch other users' profiles
    const profiles: Record<string, { id: string; display_name: string; avatar_url: string | null }> = {};
    if (otherUserIds.size > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(otherUserIds));

      if (profileData) {
        for (const p of profileData) {
          profiles[p.id] = p;
        }
      }
    }

    // Get last messages for each conversation
    const { data: lastMessages, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    const lastMsgMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    if (lastMessages) {
      for (const msg of lastMessages) {
        if (!lastMsgMap.has(msg.conversation_id)) {
          lastMsgMap.set(msg.conversation_id, msg);
        }
      }
    }

    // Count unread messages per conversation
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', userId);

    const unreadCountMap = new Map<string, number>();
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const lastRead = readMap.get(msg.conversation_id);
        // We rely on is_read flag directly since we'll update it on read
        unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) ?? 0) + 1);
      }
    }

    // Build response
    const result: ConversationWithPreview[] = (conversations ?? []).map((conv) => {
      const members = convMembersMap.get(conv.id) ?? [];
      const otherUserId = members.find((uid) => uid !== userId);
      const otherUser = otherUserId ? profiles[otherUserId] ?? null : null;
      const listing = conv.listing as Record<string, unknown> | null;
      const media = (listing?.media as Record<string, unknown>[]) ?? [];
      const primaryMedia = media.find((m) => m.is_primary) ?? media[0];

      return {
        id: conv.id,
        listing_id: conv.listing_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message: lastMsgMap.get(conv.id) ?? null,
        other_user: otherUser
          ? { id: otherUser.id, display_name: otherUser.display_name, avatar_url: otherUser.avatar_url }
          : null,
        listing_title: (listing?.title as string) ?? null,
        listing_thumbnail: (primaryMedia?.url as string) ?? null,
        unread_count: unreadCountMap.get(conv.id) ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body as { listing_id?: string };

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Get listing and seller
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('userId')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId === userId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const sellerId = listing.userId;

    // Check for existing conversation between these two users for this listing
    const { data: existingMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (existingMembers && existingMembers.length > 0) {
      const convIds = existingMembers.map((m) => m.conversation_id);
      const { data: otherMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('user_id', sellerId);

      if (otherMembers && otherMembers.length > 0) {
        // Check if any of these conversations are for the same listing
        const sharedConvIds = otherMembers.map((m) => m.conversation_id);
        const { data: sharedConvs } = await supabase
          .from('conversations')
          .select('id')
          .in('id', sharedConvIds)
          .eq('listing_id', listing_id);

        if (sharedConvs && sharedConvs.length > 0) {
          // Return existing conversation
          return NextResponse.json({ id: sharedConvs[0].id, existing: true });
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convCreateError } = await supabase
      .from('conversations')
      .insert({ listing_id })
      .select('id')
      .single();

    if (convCreateError || !newConv) {
      console.error('Conversation create error:', convCreateError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add both members
    const { error: memberError } = await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: userId },
      { conversation_id: newConv.id, user_id: sellerId },
    ]);

    if (memberError) {
      console.error('Member add error:', memberError);
      // Try to clean up the conversation
      await supabase.from('conversations').delete().eq('id', newConv.id);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ id: newConv.id, existing: false }, { status: 201 });
  } catch (error) {
    console.error('Conversation create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
