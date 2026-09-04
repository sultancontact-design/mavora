import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { ListingStatus, UserRole } from '@/lib/types';

// XSS Prevention: Sanitize string input
function sanitizeInput(str: string): string {
  return str
    .replace(/[<>"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    .trim();
}

// Valid statuses for listings
const VALID_STATUSES: ListingStatus[] = ['draft', 'pending_review', 'active', 'sold', 'reserved', 'archived', 'rejected'];

// Admin roles that can perform admin actions
const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator', 'content_manager'];

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
      .select(`
        *, 
        seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), 
        category:categories(*), 
        currency:currencies(*), 
        media:listing_media(*),
        field_values:listing_field_values(*, field:category_fields(*))
      `)
      .eq('id', id);

    // If not in edit mode, only return active listings (or own listing if authenticated)
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
        .catch((err: unknown) => {
          // Non-critical: view count update failed silently
          console.debug('View count increment failed:', err);
        });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Listing detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT: Full update of a listing ──────────────────────────────────

export async function PUT(
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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update a listing' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify user owns the listing or is admin
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isAdmin = session.user.app_metadata?.role && 
      ADMIN_ROLES.includes(session.user.app_metadata.role as UserRole);

    if (existing.seller_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'You can only update your own listings' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      currency_id,
      category_id,
      country_id,
      city_id,
      status,
      video_url,
      is_featured,
      is_urgent,
      field_values,
      media_items,
    } = body as {
      title?: string;
      description?: string;
      price?: number | string | null;
      currency_id?: string;
      category_id?: string;
      country_id?: string;
      city_id?: string;
      status?: ListingStatus;
      video_url?: string | null;
      is_featured?: boolean;
      is_urgent?: boolean;
      field_values?: Array<{ field_id: string; value: string }>;
      media_items?: Array<{
        id?: string;
        url?: string;
        sort_order?: number;
        is_primary?: boolean;
        _delete?: boolean;
      }>;
    };

    // Build updates object with validation
    const updates: Record<string, unknown> = {};

    // Validate and update title
    if (typeof title === 'string') {
      if (title.trim().length < 3) {
        return NextResponse.json(
          { error: 'Validation failed', details: { title: 'Title must be at least 3 characters' } },
          { status: 400 }
        );
      }
      updates.title = sanitizeInput(title).slice(0, 200);
    }

    // Validate and update description
    if (typeof description === 'string') {
      if (description.trim().length < 20) {
        return NextResponse.json(
          { error: 'Validation failed', details: { description: 'Description must be at least 20 characters' } },
          { status: 400 }
        );
      }
      updates.description = sanitizeInput(description).slice(0, 5000);
    }

    // Validate price
    if (price !== undefined && price !== null) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: { price: 'Price must be a valid positive number' } },
          { status: 400 }
        );
      }
      updates.price = numPrice;
    }
    if (price === null) {
      updates.price = null;
    }

    // Update other fields
    if (typeof category_id === 'string') updates.category_id = category_id;
    if (typeof country_id === 'string') updates.country_id = country_id;
    if (typeof city_id === 'string') updates.city_id = city_id;
    if (typeof currency_id === 'string') updates.currency_id = currency_id;
    if (typeof video_url === 'string') {
      const VIDEO_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/;
      updates.video_url = VIDEO_URL_REGEX.test(video_url.trim()) ? video_url.trim() : null;
    }
    if (video_url === null) updates.video_url = null;
    if (typeof is_featured === 'boolean') updates.is_featured = is_featured;
    if (typeof is_urgent === 'boolean') updates.is_urgent = is_urgent;

    // Validate status change
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: 'Validation failed', details: { status: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` } },
          { status: 400 }
        );
      }
      updates.status = status;
      if (status === 'active' && existing.status !== 'active') {
        updates.published_at = new Date().toISOString();
      }
    }

    // Perform the update
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Listing update error:', error);
      return NextResponse.json({ error: 'Failed to update listing', details: error.message }, { status: 500 });
    }

    // Update dynamic field values if provided
    if (field_values && Array.isArray(field_values) && field_values.length > 0) {
      const fieldUpserts = field_values.map((fv) => ({
        listing_id: id,
        field_id: fv.field_id,
        value: sanitizeInput(fv.value),
      }));

      const { error: fieldError } = await supabase
        .from('listing_field_values')
        .upsert(fieldUpserts, { onConflict: 'listing_id,field_id' });
      
      if (fieldError) {
        console.error('Field values update warning:', fieldError);
      }
    }

    // Update media items if provided (reorder, set primary, add new)
    if (media_items && Array.isArray(media_items)) {
      for (const item of media_items) {
        // Handle deletion
        if (item._delete && item.id) {
          // Delete from storage first
          const { data: mediaRecord } = await supabase
            .from('listing_media')
            .select('url')
            .eq('id', item.id)
            .eq('listing_id', id)
            .single();

          if (mediaRecord?.url) {
            try {
              const urlObj = new URL(mediaRecord.url);
              const pathMatch = urlObj.pathname.match(/\/listing-images\/(.+)/);
              if (pathMatch) {
                try {
                await supabase.storage.from('listing-images').remove([pathMatch[1]]);
              } catch {/* Storage delete is non-critical */}
              }
            } catch {/* ignore */}
          }

          const { error: mediaDeleteError } = await supabase
            .from('listing_media')
            .delete()
            .eq('id', item.id)
            .eq('listing_id', id);
          
          if (mediaDeleteError) {
            console.warn('Media delete warning:', mediaDeleteError);
          }
        }
        // Handle update (reorder, primary)
        else if (item.id) {
          const mediaUpdates: Record<string, unknown> = {};
          if (typeof item.sort_order === 'number') mediaUpdates.sort_order = item.sort_order;
          if (typeof item.is_primary === 'boolean') {
            if (item.is_primary) {
              await supabase
                .from('listing_media')
                .update({ is_primary: false })
                .eq('listing_id', id);
            }
            mediaUpdates.is_primary = item.is_primary;
          }

          if (Object.keys(mediaUpdates).length > 0) {
            const { error: mediaUpdateError } = await supabase
              .from('listing_media')
              .update(mediaUpdates)
              .eq('id', item.id)
              .eq('listing_id', id);
            
            if (mediaUpdateError) {
              console.warn('Media update warning:', mediaUpdateError);
            }
          }
        }
        // Handle new media
        else if (item.url) {
          const { error: mediaInsertError } = await supabase
            .from('listing_media')
            .insert({
              listing_id: id,
              url: item.url,
              type: 'image',
              sort_order: item.sort_order ?? 0,
              is_primary: item.is_primary ?? false,
            });
          
          if (mediaInsertError) {
            console.warn('Media insert warning:', mediaInsertError);
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Listing update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH: Partial update of a listing (backward compatibility) ───

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reuse PUT logic for backward compatibility
  return PUT(request, { params });
}

// ─── DELETE: Soft delete (archive) or hard delete a listing ─────────

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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete a listing' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify user owns the listing or is admin
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isAdmin = session.user.app_metadata?.role && 
      ADMIN_ROLES.includes(session.user.app_metadata.role as UserRole);

    if (listing.seller_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'You can only delete your own listings' }, { status: 403 });
    }

    // Check if hard delete is requested (default is soft delete / archive)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete && isAdmin) {
      // Hard delete: Remove everything permanently
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
          try {
            await supabase.storage.from('listing-images').remove(pathsToDelete);
          } catch {/* Storage delete is non-critical */}
        }
      }

      // Delete media records
      await supabase
        .from('listing_media')
        .delete()
        .eq('listing_id', id);

      // Delete field values
      await supabase
        .from('listing_field_values')
        .delete()
        .eq('listing_id', id);

      // Delete favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', id);

      // Delete the listing
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Listing hard delete error:', deleteError);
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: 'hard' });
    } else {
      // Soft delete: Archive the listing
      const { error: archiveError } = await supabase
        .from('listings')
        .update({ status: 'archived' })
        .eq('id', id);

      if (archiveError) {
        console.error('Listing archive error:', archiveError);
        return NextResponse.json({ error: 'Failed to archive listing' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: 'soft' });
    }
  } catch (error) {
    console.error('Listing delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
