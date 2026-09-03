import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PaginatedResponse, Listing } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const category_id = searchParams.get('category_id');
    const country_id = searchParams.get('country_id');
    const city_id = searchParams.get('city_id');
    const seller_id = searchParams.get('seller_id');
    const status = searchParams.get('status');
    const sort_by = searchParams.get('sort_by') ?? 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '12', 10)));
    const search = searchParams.get('search')?.trim();

    let query;
    // When seller_id is provided without status, show all statuses (own listings)
    // Otherwise only show active
    if (seller_id) {
      query = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), category:categories(*), currency:currencies(*), media:listing_media(*)', { count: 'exact' })
        .eq('seller_id', seller_id);
      if (status) {
        query = query.eq('status', status);
      }
      query = query.order('created_at', { ascending: false });
    } else {
      query = supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified, phone, created_at), category:categories(*), currency:currencies(*), media:listing_media(*)', { count: 'exact' })
        .eq('status', 'active');
    }

    if (category_id) {
      // Check if it's a parent category — if so, include all children
      query = query.eq('category_id', category_id);
    }

    if (country_id) {
      query = query.eq('country_id', country_id);
    }

    if (city_id) {
      query = query.eq('city_id', city_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    switch (sort_by) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query
      .range(from, to);

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    };

    // Validate required fields
    const missing: string[] = [];
    if (!title || title.trim().length < 3) missing.push('title');
    if (!description || description.trim().length < 20) missing.push('description');
    if (!category_id) missing.push('category_id');
    if (!country_id) missing.push('country_id');
    if (!city_id) missing.push('city_id');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: missing },
        { status: 400 }
      );
    }

    // Validate status
    const listingStatus = status === 'draft' ? 'draft' : 'active';

    const insertData: Record<string, unknown> = {
      seller_id: userId,
      title: title.trim(),
      description: description.trim(),
      category_id,
      country_id,
      city_id,
      status: listingStatus,
      view_count: 0,
      is_featured: false,
      is_urgent: false,
      published_at: listingStatus === 'active' ? new Date().toISOString() : null,
    };

    // Optional fields
    if (price !== undefined && price !== null && price !== '') {
      insertData.price = Number(price);
    } else {
      insertData.price = null;
    }

    if (currency_id) {
      insertData.currency_id = currency_id;
    }

    if (video_url) {
      insertData.video_url = video_url;
    }

    const { data, error } = await supabase
      .from('listings')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Listing create error:', error);
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }

    // Insert notification for the seller
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'listing_published',
      title: 'new_listing',
      body: 'listing_published',
      data: { listing_id: data.id, listing_title: data.title },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Listing create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
