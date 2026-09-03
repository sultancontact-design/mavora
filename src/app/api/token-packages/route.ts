import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('token_packages')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('Token packages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch token packages' }, { status: 500 });
    }

    return NextResponse.json(
      (data ?? []).map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        tokens: pkg.tokens,
        price: parseFloat(pkg.price),
        currency_code: pkg.currency_code,
        sortOrder: pkg.sort_order,
      }))
    );
  } catch (error) {
    console.error('Token packages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
