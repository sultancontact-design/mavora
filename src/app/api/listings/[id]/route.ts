import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { ListingStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { edit } = Object.fromEntries(new URL(request.url).searchParams);

    let query = supabase
      .from('listings')
      .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), category:categories(*), currency:currencies(*), media:listing_media(*)')
      .eq('id', id);

    // If not in edit mode, only return active listings
    if (!edit) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Sort media: primary first, then by sort_order
    const listing = {
      ...data,
      media: ((data.media as Record<string, unknown>[]) ?? []).sort(
        (a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return (a.sort_order as number) - (b.sort_order as number);
        }
      ),
    };

    // Increment view_count only when not in edit mode (fire and forget)
    if (!edit) {
      supabase
        .from('listings')
        .update({ view_count: (data.view_count ?? 0) + 1 })
        .eq('id', id)
        .then(() => {})
        .catch(() => {});
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Listing detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH: Update listing (status, title, description, price, etc.) ──

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
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existing.seller_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status) {
      const validStatuses: ListingStatus[] = ['draft', 'pending_review', 'active', 'sold', 'reserved', 'archived', 'rejected'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'active' && !existing.status) {
        updates.published_at = new Date().toISOString();
      }
    }

    if (typeof body.title === 'string') {
      updates.title = body.title.trim().slice(0, 200);
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim().slice(0, 5000);
    }
    if (body.price !== undefined && body.price !== null) {
      updates.price = Number(body.price);
    }
    if (body.price === null) {
      updates.price = null;
    }
    if (typeof body.category_id === 'string') updates.category_id = body.category_id;
    if (typeof body.country_id === 'string') updates.country_id = body.country_id;
    if (typeof body.city_id === 'string') updates.city_id = body.city_id;
    if (typeof body.currency_id === 'string') updates.currency_id = body.currency_id;
    if (typeof body.video_url === 'string') updates.video_url = body.video_url.trim();
    if (body.video_url === null) updates.video_url = null;

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Listing update error:', error);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Listing update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: Delete a listing and its media ──────────────────────────

export async function DELETE(
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
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.seller_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all media records for this listing
    const { data: mediaRecords } = await supabase
      .from('listing_media')
      .select('url')
      .eq('listing_id', id);

    // Delete files from storage (best effort)
    if (mediaRecords && mediaRecords.length > 0) {
      const pathsToDelete: string[] = [];
      for (const media of mediaRecords) {
        try {
          const urlObj = new URL(media.url as string);
          const pathMatch = urlObj.pathname.match(/\/listing-images\/(.+)/);
          if (pathMatch) {
            pathsToDelete.push(pathMatch[1]);
          }
        } catch {
          // Skip invalid URLs
        }
      }
      if (pathsToDelete.length > 0) {
        await supabase.storage.from('listing-images').remove(pathsToDelete).catch(() => {});
      }
    }

    // Delete media records
    await supabase
      .from('listing_media')
      .delete()
      .eq('listing_id', id);

    // Delete the listing
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Listing delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
