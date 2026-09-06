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

    // Try different column names for flexibility
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .or(`id.eq.${id},uuid.eq.${id}`)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      
      // If table structure is different, try a simpler query
      const { data: fallback, error: fallbackError } = await supabase
        .from('listings')
        .select('*')
        .limit(1);
        
      if (fallbackError) {
        return NextResponse.json({ 
          error: 'Database error',
          details: error.message,
          hint: 'Check if listings table exists'
        }, { status: 500 });
      }
      
      // Return first listing as reference if the specific one isn't found
      return NextResponse.json({ 
        error: 'Listing not found',
        availableIds: fallback?.map((l: any) => l.id || l.uuid) || []
      }, { status: 404 });
    }

    if (!listing) {
      // Get some valid IDs for debugging
      const { data: sample } = await supabase
        .from('listings')
        .select('id, title')
        .limit(3);
        
      return NextResponse.json({ 
        error: 'Listing not found',
        searchedId: id,
        sampleListings: sample || [],
        hint: 'Check if this ID exists in the database'
      }, { status: 404 });
    }

    // Fetch category info if category_id exists
    let category = null;
    if (listing.category_id) {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', listing.category_id)
        .single();
      category = catData;
    }

    // Fetch user info if user_id exists
    let user = null;
    if (listing.user_id) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', listing.user_id)
        .single();
      user = userData;
    }

    // Fetch media
    let media = [];
    const { data: mediaData } = await supabase
      .from('listing_media')
      .select('*')
      .eq('listing_id', listing.id)
      .order('is_primary', { ascending: false });
    media = mediaData || [];

    // Increment view count safely
    try {
      const viewCol = listing.view_count !== undefined ? 'view_count' : 'viewCount';
      await supabase
        .from('listings')
        .update({ [viewCol]: (listing.view_count || listing.viewCount || 0) + 1 })
        .eq('id', listing.id);
    } catch (e) {
      // Non-critical, continue
    }

    // Return combined data with normalized field names
    return NextResponse.json({
      id: listing.id || listing.uuid,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currencyCode: listing.currency_code || listing.currencyCode || 'MAD',
      condition: listing.condition,
      status: listing.status,
      negotiable: listing.negotiable,
      viewCount: (listing.view_count || listing.viewCount || 0) + 1,
      contactPhone: listing.contact_phone || listing.contactPhone,
      locationAddress: listing.location_address || listing.locationAddress,
      createdAt: listing.created_at || listing.createdAt,
      updatedAt: listing.updated_at || listing.updatedAt,
      category,
      user,
      media,
    });

  } catch (error) {
    console.error('Listing detail error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
