import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { ListingStatus } from '@/lib/types';

const VALID_STATUSES: ListingStatus[] = ['active', 'draft', 'sold', 'reserved', 'archived'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user owns the listing
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status, title')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body as { status?: ListingStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { status };

    // Set published_at when activating
    if (status === 'active' && existing.status !== 'active') {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      console.error('Listing status update error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Create a notification for the seller about the status change
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'listing_status_change',
      title: 'listing_published',
      body: `Listing "${existing.title}" status changed to ${status}`,
      data: { listing_id: id, old_status: existing.status, new_status: status },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Listing status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
