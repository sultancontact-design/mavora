import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
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
    const { listing_id, action, note } = body as {
      listing_id?: string;
      action?: string;
      note?: string;
    };

    if (!listing_id || !action) {
      return NextResponse.json(
        { error: 'listing_id and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'archive'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or archive' },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      approve: 'active',
      reject: 'rejected',
      archive: 'archived',
    };

    const newStatus = statusMap[action];
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (action === 'approve') {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listing_id)
      .select('id, status')
      .single();

    if (error || !data) {
      console.error('Moderation error:', error);
      return NextResponse.json(
        { error: 'Failed to moderate listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      action,
      note: note ?? null,
    });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
