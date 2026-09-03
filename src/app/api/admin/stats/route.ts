import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Fetch all counts in parallel
    const [usersRes, listingsRes, countriesRes, categoriesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('countries').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      total_users: usersRes.count ?? 0,
      total_listings: listingsRes.count ?? 0,
      total_countries: countriesRes.count ?? 0,
      total_categories: categoriesRes.count ?? 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
