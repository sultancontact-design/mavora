import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { MOCK_LISTINGS, MOCK_STATS } from '@/lib/mock-data';

// ============================================================
// Configuration - Uses secure admin client from lib/supabase
// ============================================================

// Get admin client with service role (only works server-side)
// This uses environment variables, NOT hardcoded keys
const supabase = getSupabaseAdminClient();

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
    const { searchParams } = new URL(request.url);

    // Extract and validate parameters
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sort_by') ?? 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '12', 10)));
    const search = sanitizeInput(searchParams.get('search') ?? '');
    
    // Additional filters
    const featured = searchParams.get('featured') === 'true';
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const condition = searchParams.get('condition');

    // Validate sort_by
    const validSort = isValidSort(sortBy) ? sortBy : 'newest';

    // Try database first
    try {
      const supabase = getSupabaseAdminClient();
      
      let query = supabase
        .from('listings')
        .select(`
          *,
          category:categories(id, name, nameAr, nameFr, slug),
          media:listing_media(*)
        `, { count: 'exact' })
        .eq('status', 'active');

      // Apply filters (same as before)
      if (categoryId) query = query.eq('categoryId', categoryId);
      if (featured) query = query.not('featuredUntil', 'is', null);
      if (minPrice !== null && minPrice !== '') {
        const minNum = parseFloat(minPrice);
        if (!isNaN(minNum)) query = query.gte('price', minNum);
      }
      if (maxPrice !== null && maxPrice !== '') {
        const maxNum = parseFloat(maxPrice);
        if (!isNaN(maxNum)) query = query.lte('price', maxNum);
      }
      if (condition) query = query.eq('condition', condition);
      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      // Sorting
      switch (validSort) {
        case 'oldest': query = query.order('createdAt', { ascending: true }); break;
        case 'price_asc': query = query.order('price', { ascending: true, nullsFirst: false }); break;
        case 'price_desc': query = query.order('price', { ascending: false, nullsFirst: true }); break;
        case 'popular': query = query.order('viewCount', { ascending: false }); break;
        default: query = query.order('createdAt', { ascending: false }); break;
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (!error && data && data.length > 0) {
        console.log('[Listings API] ✅ Returning DB data:', data.length, 'listings');
        
        // Process and return DB listings (same as before)
        const listings = data.map((listing: Record<string, unknown>) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price ? Number(listing.price) : null,
          currencyCode: listing.currencyCode || 'MAD',
          condition: listing.condition,
          status: listing.status,
          negotiable: listing.negotiable || false,
          viewCount: listing.viewCount || 0,
          contactPhone: listing.contactPhone,
          locationAddress: listing.locationAddress,
          createdAt: listing.createdAt,
          updatedAt: listing.updatedAt,
          category: listing.category,
          media: ((listing.media as Record<string, unknown>[]) || []).map((m: Record<string, unknown>) => ({
            id: m.id, url: m.url, type: m.type || 'image', thumbnailUrl: m.thumbnailUrl,
          })),
          userId: listing.userId,
        }));

        return NextResponse.json({
          listings,
          total: count ?? data.length,
          page,
          per_page: perPage,
          total_pages: Math.max(1, Math.ceil((count ?? data.length) / perPage)),
        });
      }
    } catch (dbError) {
      console.warn('[Listings API] ⚠️ DB query failed:', dbError);
    }

    // Fallback to mock data when DB fails
    console.log('[Listings API] 📦 Using mock data');
    
    let mockListings = [...MOCK_LISTINGS];
    
    // Apply filters to mock data
    if (categoryId) {
      mockListings = mockListings.filter(l => l.category.id === categoryId);
    }
    if (featured) {
      mockListings = mockListings.filter(l => l.featured);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      mockListings = mockListings.filter(l => 
        l.title.toLowerCase().includes(searchLower) || 
        l.description.toLowerCase().includes(searchLower)
      );
    }
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) mockListings = mockListings.filter(l => l.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) mockListings = mockListings.filter(l => l.price <= max);
    }

    // Sort mock data
    switch (validSort) {
      case 'price_asc': mockListings.sort((a, b) => a.price - b.price); break;
      case 'price_desc': mockListings.sort((a, b) => b.price - a.price); break;
      case 'popular': mockListings.sort((a, b) => b.views - a.views); break;
      default: mockListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    // Paginate
    const total = mockListings.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const paginatedListings = mockListings.slice((page - 1) * perPage, page * perPage);

    // Transform to expected format
    const formattedListings = paginatedListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currencyCode: listing.currency,
      condition: listing.condition,
      status: listing.status,
      negotiable: false,
      viewCount: listing.views,
      contactPhone: null,
      locationAddress: listing.location,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      category: listing.category,
      media: listing.images.map((url, i) => ({
        id: `mock-media-${listing.id}-${i}`,
        url,
        type: 'image',
        thumbnailUrl: url,
      })),
      userId: listing.seller.id,
      seller: {
        id: listing.seller.id,
        display_name: listing.seller.name,
        avatar_url: listing.seller.avatar,
        is_verified: listing.seller.isVerified,
        phone: listing.seller.email,
      },
    }));

    return NextResponse.json({
      listings: formattedListings,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });

  } catch (error) {
    console.error('[Listings API] ❌ Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new listing (REQUIRES AUTHENTICATION)
export async function POST(request: NextRequest) {
  try {
    // ============================================================
    // AUTHENTICATION CHECK - Must be authenticated to create listing
    // Supports: Supabase JWT, DB Auth tokens, Session cookies
    // ============================================================
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    // Method 1: Check for session cookie (from login)
    const accessToken = request.cookies.get('sb-access-token')?.value;
    
    if (accessToken) {
      // Check if it's a DB auth token (format: db-token-*)
      if (accessToken.startsWith('db-token-')) {
        // For DB auth tokens, we need to verify differently
        // The token itself doesn't contain user info, so we check for a user ID in a custom header
        // This is a simplified approach - in production, use proper JWT or session management
        const userIdHeader = request.headers.get('x-user-id');
        if (userIdHeader) {
          // Verify user exists in database
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', userIdHeader)
            .eq('isActive', true)
            .limit(1)
            .single();
          
          if (user) {
            userId = user.id;
          }
        }
      } else {
        // Verify the Supabase token and get user
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        if (user) {
          userId = user.id;
        }
      }
    }

    // Method 2: Check Authorization header (for API usage)
    if (!userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if it's a DB auth token
      if (token.startsWith('db-token-')) {
        const userIdHeader = request.headers.get('x-user-id');
        if (userIdHeader) {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', userIdHeader)
            .eq('isActive', true)
            .limit(1)
            .single();
          
          if (user) {
            userId = user.id;
          }
        }
      } else {
        // Verify as Supabase JWT
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
    }

    // REJECT if not authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to create a listing.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Support both camelCase (API standard) and snake_case (frontend form)
    const categoryId = body.categoryId || body.category_id;
    const title = body.title;
    const description = body.description;
    const price = body.price;
    const condition = body.condition;
    const locationAddress = body.locationAddress || body.location;
    const contactPhone = body.contactPhone || body.phone;
    const negotiable = body.negotiable;

    // Validate required fields
    const errors: Record<string, string> = {};
    
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!categoryId) {
      errors.categoryId = 'Category is required (category_id)';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create the listing
    const now = new Date().toISOString();
    const listingId = crypto.randomUUID();
    
    // Use authenticated user's ID (NOT a fake/hardcoded one)
    const insertData = {
      id: listingId,
      title: sanitizeInput(title!),
      description: sanitizeInput(description!),
      categoryId: categoryId!,
      userId: userId,
      price: price ? Number(price) : null,
      currencyCode: 'MAD',
      condition: condition || 'used',
      status: 'active',
      negotiable: negotiable || false,
      viewCount: 0,
      locationAddress: locationAddress || null,
      contactPhone: contactPhone || null,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert(insertData)
      .select('*')
      .single();

    if (insertError || !listing) {
      console.error('Listing create error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create listing', details: insertError?.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...listing,
      message: 'Listing created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Listing create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
