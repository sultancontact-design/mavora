import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function PUT(
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
      .select('id, left_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
    }

    if (membership.left_at) {
      return NextResponse.json({ error: 'You have left this conversation' }, { status: 410 });
    }

    const now = new Date().toISOString();

    // Mark all unread messages from other users as read
    const { error: markReadError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (markReadError) {
      console.error('Mark messages read error:', markReadError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // Update last_read_at for this user's membership
    const { error: updateMemberError } = await supabase
      .from('conversation_members')
      .update({ last_read_at: now })
      .eq('id', membership.id);

    if (updateMemberError) {
      console.error('Update last_read_at error:', updateMemberError);
      // Non-fatal - messages were marked as read
    }

    return NextResponse.json({
      success: true,
      read_at: now,
    });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
