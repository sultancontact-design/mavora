import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// ─── POST: Add media record to a listing ─────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
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
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('userId')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { url, type, sort_order, is_primary } = body as {
      url?: string;
      type?: string;
      sort_order?: number;
      is_primary?: boolean;
    };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // If this is set as primary, clear other primary flags
    if (is_primary) {
      await supabase
        .from('listing_media')
        .update({ is_primary: false })
        .eq('listing_id', listingId);
    }

    const insertData: Record<string, unknown> = {
      listing_id: listingId,
      url,
      type: type === 'video' ? 'video' : 'image',
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      is_primary: is_primary === true,
    };

    const { data, error } = await supabase
      .from('listing_media')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Media create error:', error);
      return NextResponse.json({ error: 'Failed to add media' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Media create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: Remove media record and file from storage ───────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
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
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('userId')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get media_id from query params or body
    const { searchParams } = new URL(request.url);
    let mediaId = searchParams.get('media_id');

    if (!mediaId) {
      try {
        const body = await request.json();
        mediaId = body.media_id;
      } catch {
        // body parse failed
      }
    }

    if (!mediaId) {
      return NextResponse.json({ error: 'media_id is required' }, { status: 400 });
    }

    // Fetch the media record to get the storage path
    const { data: media, error: mediaError } = await supabase
      .from('listing_media')
      .select('*')
      .eq('id', mediaId)
      .eq('listing_id', listingId)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete file from storage (best effort)
    if (media.url) {
      try {
        // Extract path from the public URL
        const urlObj = new URL(media.url);
        // URL format: /storage/v1/object/public/listing-images/{path}
        const pathMatch = urlObj.pathname.match(/\/listing-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from('listing-images').remove([pathMatch[1]]);
        }
      } catch {
        // Storage deletion failed, still proceed with DB deletion
      }
    }

    // Delete the media record
    const { error: deleteError } = await supabase
      .from('listing_media')
      .delete()
      .eq('id', mediaId)
      .eq('listing_id', listingId);

    if (deleteError) {
      console.error('Media delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
    }

    // If deleted media was primary, set the first remaining as primary
    if (media.is_primary) {
      const { data: remaining } = await supabase
        .from('listing_media')
        .select('id')
        .eq('listing_id', listingId)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase
          .from('listing_media')
          .update({ is_primary: true })
          .eq('id', remaining[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH: Update media (reorder, set primary) ──────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
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
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('userId')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { media_items } = body as {
      media_items: Array<{
        id: string;
        sort_order?: number;
        is_primary?: boolean;
      }>;
    };

    if (!media_items || !Array.isArray(media_items)) {
      return NextResponse.json({ error: 'media_items array is required' }, { status: 400 });
    }

    // Process each media item update
    for (const item of media_items) {
      const updates: Record<string, unknown> = {};
      if (typeof item.sort_order === 'number') updates.sort_order = item.sort_order;
      if (typeof item.is_primary === 'boolean') {
        if (item.is_primary) {
          // Clear all other primary flags first
          await supabase
            .from('listing_media')
            .update({ is_primary: false })
            .eq('listing_id', listingId);
        }
        updates.is_primary = item.is_primary;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('listing_media')
          .update(updates)
          .eq('id', item.id)
          .eq('listing_id', listingId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
