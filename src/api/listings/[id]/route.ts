import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET /api/listings/[id] - Get single listing details
export async GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch listing with category and user info
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, nameAr, nameFr, slug),
        user:profiles!listings_user_id_fkey(id, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch listing media
    const { data: media } = await supabase
      .from('listing_media')
      .select('*')
      .eq('listing_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    // Increment view count
    await supabase
      .from('listings')
      .update({ view_count: (listing.view_count || 0) + 1 })
      .eq('id', id);

    // Return combined data
    return NextResponse.json({
      ...listing,
      media: media || [],
    });

  } catch (error) {
    console.error('Listing detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
