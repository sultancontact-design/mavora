import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('Plans fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json(
      (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        name_fr: p.name_fr,
        name_en: p.name_en,
        description: p.description,
        price_monthly: parseFloat(p.price_monthly),
        price_yearly: parseFloat(p.price_yearly),
        currency_code: p.currency_code,
        listing_limit: p.listing_limit,
        featured_limit: p.featured_limit,
        max_images_per_listing: p.max_images_per_listing,
        sortOrder: p.sort_order,
      }))
    );
  } catch (error) {
    console.error('Plans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
