import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prevent self-reporting
    if (listing.seller_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot report your own listing' },
        { status: 400 }
      );
    }

    // Check for duplicate report
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', session.user.id)
      .eq('target_type', 'listing')
      .eq('target_id', id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'Already reported' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { reason, description } = body as {
      reason?: string;
      description?: string;
    };

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    const validReasons = ['scam', 'prohibited', 'duplicate', 'wrong_category', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: session.user.id,
        target_type: 'listing',
        target_id: id,
        reason,
        description: description?.trim() ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Report create error:', error);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error('Report create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
