import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

/**
 * Public Stats Endpoint - No Authentication Required
 * Returns aggregated statistics for the homepage
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Fetch all stats in parallel for better performance
    const [
      listingsResult,
      usersResult,
      categoriesResult,
      citiesResult,
    ] = await Promise.all([
      // Total active listings
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Total verified users (from profiles)
      supabase
        .from('profiles')
        .select('userId', { count: 'exact', head: true }),
      
      // Total active categories
      supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Total active cities
      supabase
        .from('cities')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    // Calculate stats
    const stats = {
      totalListings: listingsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalCategories: categoriesResult.count || 0,
      totalCities: citiesResult.count || 0,
      // Additional useful stats
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Public Stats Error:', error);
    
    // Return default stats on error (don't break the homepage)
    return NextResponse.json({
      totalListings: 0,
      totalUsers: 0,
      totalCategories: 0,
      totalCities: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch stats',
    });
  }
}
