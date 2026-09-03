import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('isActive', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Countries fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Countries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
