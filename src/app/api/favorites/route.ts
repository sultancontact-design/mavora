import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PaginatedResponse, Listing } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '12', 10)));

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await supabase
      .from('favorites')
      .select(
        'created_at, listing:listings(*, seller:profiles!listings_seller_id_fkey(*, user_roles(role)), category:categories(*), currency:currencies(*), media:listing_media(*))',
        { count: 'exact' }
      )
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Favorites fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    // Extract listings from the favorites, sort media
    const listings: Listing[] = (data ?? []).map((fav: Record<string, unknown>) => {
      const listing = fav.listing as Record<string, unknown>;
      return {
        ...listing,
        media: ((listing.media as Record<string, unknown>[]) ?? []).sort(
          (a: Record<string, unknown>, b: Record<string, unknown>) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order as number) - (b.sort_order as number);
          }
        ),
      };
    });

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
    console.error('Favorites error:', error);
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

    const body = await request.json();
    const { listing_id } = body as { listing_id?: string };

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // Idempotent insert — ignore if already favorited
    const { error } = await supabase
      .from('favorites')
      .upsert(
        { user_id: session.user.id, listing_id },
        { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Favorite add error:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (error) {
    console.error('Favorite add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
