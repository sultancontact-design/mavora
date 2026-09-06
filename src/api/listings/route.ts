import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';

// GET /api/listings - Get all listings with pagination
export async GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'));
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'newest';
    const status = searchParams.get('status') || 'active';

    const supabase = getSupabaseAdminClient();
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, nameAr, nameFr, slug),
        user:profiles!listings_user_id_fkey(id, display_name, avatar_url)
      `, { count: 'exact' })
      .eq('status', status)
      .range((page - 1) * perPage, page * perPage - 1);

    // Apply filters
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    return NextResponse.json({
      listings: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });

  } catch (error) {
    console.error('Listings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/listings - Create new listing
export async POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required. Please log in to create a listing.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category_id, location, condition, currency, images } = body;

    // Validate required fields
    if (!title || !description || !category_id) {
      return NextResponse.json({ error: 'Title, description, and category are required' }, { status: 400 });
    }

    // Create listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        title,
        description,
        price: parseFloat(price) || 0,
        currency_code: currency || 'MAD',
        category_id,
        location_address: location,
        condition: condition || 'new',
        user_id: session.user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }

    // Add images if provided
    if (images?.length > 0) {
      const mediaData = images.map((url: string, index: number) => ({
        listing_id: listing.id,
        url,
        is_primary: index === 0,
      }));

      await supabase.from('listing_media').insert(mediaData);
    }

    return NextResponse.json({ 
      success: true, 
      id: listing.id,
      message: 'Listing created successfully' 
    });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
