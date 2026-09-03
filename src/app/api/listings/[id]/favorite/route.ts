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

    const { id: listingId } = await params;

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Check if already favorited
    const { data: existing, error: fetchError } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', session.user.id)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (fetchError) {
      console.error('Favorite check error:', fetchError);
      return NextResponse.json({ error: 'Failed to check favorite' }, { status: 500 });
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('listing_id', listingId);

      if (deleteError) {
        console.error('Favorite remove error:', deleteError);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
      }

      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite (idempotent)
      const { error: insertError } = await supabase
        .from('favorites')
        .upsert(
          { user_id: session.user.id, listing_id: listingId },
          { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
        );

      if (insertError) {
        console.error('Favorite add error:', insertError);
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
      }

      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
