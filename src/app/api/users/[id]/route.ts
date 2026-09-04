import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Fetch the public profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, is_verified, created_at')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count active listings
    const { count: listingCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq(['userId'], id)
      .eq('status', 'active');

    // Average review rating (from listing_reviews table)
    const { data: reviewData } = await supabase
      .from('listing_reviews')
      .select('rating')
      .eq(['userId'], id);

    let avgRating: number | null = null;
    const ratings = (reviewData ?? []).map((r: { rating: number }) => r.rating).filter((r: number) => r > 0);
    if (ratings.length > 0) {
      avgRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
      avgRating = Math.round(avgRating * 10) / 10;
    }

    return NextResponse.json({
      ...profile,
      listing_count: listingCount ?? 0,
      average_review_rating: avgRating,
    });
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
