import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get reviews for this seller (reviews are per seller, not per listing)
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, display_name, avatar_url)')
      .eq('seller_id', listing.seller_id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reviews fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Calculate average rating
    const reviews = data ?? [];
    const totalRating = reviews.reduce((sum: number, r: Record<string, unknown>) => sum + (r.rating as number), 0);
    const avgRating = reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0;

    return NextResponse.json({
      reviews,
      avg_rating: avgRating,
      total: reviews.length,
    });
  } catch (error) {
    console.error('Reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Cannot review yourself
    if (listing.seller_id === userId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 });
    }

    // Parse body
    const body = await request.json();
    const { rating, comment } = body as {
      rating?: number;
      comment?: string;
    };

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Check for existing review (one per user per seller)
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', userId)
      .eq('seller_id', listing.seller_id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        seller_id: listing.seller_id,
        reviewer_id: userId,
        listing_id: id,
        rating,
        comment: comment?.trim() || null,
      })
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, display_name, avatar_url)')
      .single();

    if (error) {
      console.error('Review create error:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
