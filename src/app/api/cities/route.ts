import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const country_id = searchParams.get('country_id');

    let query = supabase
      .from('cities')
      .select('*')
      .eq('isActive', true)
      .order('sort_order', { ascending: true });

    if (country_id) {
      query = query.eq('country_id', country_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Cities fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Cities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
