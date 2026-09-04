import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('isActive', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Currencies fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Currencies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
