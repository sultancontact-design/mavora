import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

const VALID_REASONS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'scam',
  'fake_account',
  'other',
];

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

    const body = await request.json();
    const { reason, description } = body as {
      reason?: string;
      description?: string;
    };

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        {
          error: 'Invalid reason. Valid reasons: ' + VALID_REASONS.join(', '),
        },
        { status: 400 }
      );
    }

    // Check for existing report by this user on this conversation
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id, status')
      .eq('reporter_id', userId)
      .eq('target_type', 'conversation')
      .eq('target_id', conversationId)
      .single();

    if (existingReport) {
      if (existingReport.status === 'pending') {
        return NextResponse.json(
          { error: 'You have already reported this conversation' },
          { status: 409 }
        );
      }
      // Allow re-reporting if previous was resolved/dismissed
    }

    // Create the report
    const { error: reportError } = await supabase.from('reports').insert({
      reporter_id: userId,
      target_type: 'conversation',
      target_id: conversationId,
      reason,
      description: description?.trim() || null,
      status: 'pending',
    });

    if (reportError) {
      console.error('Report creation error:', reportError);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Report conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
