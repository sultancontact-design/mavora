import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

    // Use admin client to get all listings regardless of status
    const adminClient = getSupabaseAdminClient();

    let query = adminClient
      .from('listings')
      .select('*, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, is_verified), category:categories!listings_category_id_fkey(id, name_en, name_ar, name_fr), currency:currencies!listings_currency_id_fkey(code)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Admin listings error:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    return NextResponse.json({
      data: data ?? [],
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Admin listings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
