import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PaginatedResponse, Listing } from '@/lib/types';

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

// SQL Injection Prevention: Validate sort_by parameter
const VALID_SORT_OPTIONS = ['newest', 'oldest', 'price_asc', 'price_desc', 'popular'] as const;
const VALID_STATUSES = ['active', 'draft', 'pending_review', 'sold', 'reserved', 'archived', 'rejected'] as const;

function isValidSort(value: string): value is typeof VALID_SORT_OPTIONS[number] {
  return VALID_SORT_OPTIONS.includes(value as typeof VALID_SORT_OPTIONS[number]);
}

function isValidStatus(value: string): value is typeof VALID_STATUSES[number] {
  return VALID_STATUSES.includes(value as typeof VALID_STATUSES[number]);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Extract and validate parameters
    const category_id = searchParams.get('category_id');
    const country_id = searchParams.get('country_id');
    const city_id = searchParams.get('city_id');
    const seller_id = searchParams.get('seller_id');
    const status = searchParams.get('status');
    const sort_by = searchParams.get('sort_by') ?? 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '12', 10)));
    const search = sanitizeInput(searchParams.get('search') ?? '');
    
    // Additional filters
    const featured = searchParams.get('featured') === 'true';
    const urgent = searchParams.get('urgent') === 'true';
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const condition = searchParams.get('condition'); // new, used, like_new, etc.

    // Validate sort_by
    const validSort = isValidSort(sort_by) ? sort_by : 'newest';

    let query;
    // When seller_id is provided without status, show all statuses (own listings)
    // Otherwise only show active
    if (seller_id) {
      query = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), category:categories(*), currency:currencies(*), media:listing_media(*)', { count: 'exact' })
        .eq('seller_id', seller_id);
      if (status && isValidStatus(status)) {
        query = query.eq('status', status);
      }
    } else {
      query = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), category:categories(*), currency:currencies(*), media:listing_media(*)', { count: 'exact' })
        .eq('status', 'active');
    }

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (country_id) {
      query = query.eq('country_id', country_id);
    }

    if (city_id) {
      query = query.eq('city_id', city_id);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    if (urgent) {
      query = query.eq('is_urgent', true);
    }

    if (min_price !== null && min_price !== '') {
      const minNum = parseFloat(min_price);
      if (!isNaN(minNum)) {
        query = query.gte('price', minNum);
      }
    }

    if (max_price !== null && max_price !== '') {
      const maxNum = parseFloat(max_price);
      if (!isNaN(maxNum)) {
        query = query.lte('price', maxNum);
      }
    }

    // Full-text search with sanitized input (SQL injection safe via Supabase parameterized queries)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting - using validated sort option
    switch (validSort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: true });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Listings fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    // Sort media: primary first, then by sort_order
    const listings: Listing[] = (data ?? []).map((listing: Record<string, unknown>) => ({
      ...listing,
      media: ((listing.media as Record<string, unknown>[]) ?? []).sort(
        (a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return (a.sort_order as number) - (b.sort_order as number);
        }
      ),
    }));

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    const response: PaginatedResponse<Listing> = {
      data: listings,
      total,
      page,
      per_page,
      total_pages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Listings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to create a listing' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
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
      media_urls,
    } = body as {
      title?: string;
      description?: string;
      price?: number | string | null;
      currency_id?: string;
      category_id?: string;
      country_id?: string;
      city_id?: string;
      status?: string;
      video_url?: string;
      is_featured?: boolean;
      is_urgent?: boolean;
      field_values?: Array<{ field_id: string; value: string }>;
      media_urls?: Array<{ url: string; is_primary?: boolean; sort_order?: number }>;
    };

    // Validate and sanitize required fields
    const errors: Record<string, string> = {};
    
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (description.trim().length > 5000) {
      errors.description = 'Description must be less than 5000 characters';
    }

    if (!category_id || typeof category_id !== 'string') {
      errors.category_id = 'Category is required';
    }

    if (!country_id || typeof country_id !== 'string') {
      errors.country_id = 'Country is required';
    }

    if (!city_id || typeof city_id !== 'string') {
      errors.city_id = 'City is required';
    }

    // Validate price if provided
    if (price !== undefined && price !== null && price !== '') {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        errors.price = 'Price must be a valid positive number';
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'active'];
    const listingStatus = validStatuses.includes(status ?? '') ? status : 'active';

    // Sanitize inputs for XSS prevention
    const insertData: Record<string, unknown> = {
      seller_id: userId,
      title: sanitizeInput(title!),
      description: sanitizeInput(description!),
      category_id: category_id!,
      country_id: country_id!,
      city_id: city_id!,
      status: listingStatus === 'draft' ? 'draft' : 'pending_review',
      view_count: 0,
      is_featured: is_featured === true,
      is_urgent: is_urgent === true,
      published_at: listingStatus === 'active' ? new Date().toISOString() : null,
    };

    // Optional fields
    if (price !== undefined && price !== null && price !== '') {
      insertData.price = Number(price);
    } else {
      insertData.price = null;
    }

    if (currency_id && typeof currency_id === 'string') {
      insertData.currency_id = currency_id;
    }

    if (video_url && typeof video_url === 'string') {
      // Basic URL validation for YouTube/Vimeo
      const VIDEO_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/;
      if (VIDEO_URL_REGEX.test(video_url.trim())) {
        insertData.video_url = video_url.trim();
      }
    }

    // Create the listing
    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert(insertData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Listing create error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create listing', details: insertError.message }, 
        { status: 500 }
      );
    }

    // Save dynamic field values if provided
    if (field_values && Array.isArray(field_values) && field_values.length > 0) {
      const fieldInserts = field_values.map((fv) => ({
        listing_id: listing.id,
        field_id: fv.field_id,
        value: sanitizeInput(fv.value),
      }));

      const { error: fieldError } = await supabase
        .from('listing_field_values')
        .upsert(fieldInserts, { onConflict: 'listing_id,field_id' });

      if (fieldError) {
        console.error('Field values save warning:', fieldError);
        // Don't fail the whole operation, just log it
      }
    }

    // Save media URLs if provided
    if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
      const mediaInserts = media_urls.map((m, idx) => ({
        listing_id: listing.id,
        url: m.url,
        type: 'image',
        sort_order: m.sort_order ?? idx,
        is_primary: m.is_primary ?? idx === 0,
      }));

      const { error: mediaError } = await supabase
        .from('listing_media')
        .insert(mediaInserts);

      if (mediaError) {
        console.error('Media save warning:', mediaError);
        // Don't fail the whole operation, just log it
      }
    }

    // Insert notification for the seller
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'listing_published',
      title: 'new_listing',
      body: 'listing_published',
      data: { listing_id: listing.id, listing_title: listing.title },
    }).catch(() => {}); // Non-critical, don't fail if notification fails

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('Listing create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
