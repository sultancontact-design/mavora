import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getSupabaseAdminClient();

    // Fetch all profiles with listing counts
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin users error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get listing counts per user
    const { data: listingCounts } = await adminClient
      .from('listings')
      .select('seller_id')
      .not('seller_id', 'is', null);

    const countMap: Record<string, number> = {};
    for (const l of listingCounts ?? []) {
      const sid = l.seller_id as string;
      countMap[sid] = (countMap[sid] ?? 0) + 1;
    }

    const users = (profiles ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      display_name: (p.display_name as string) ?? '',
      email: '',
      avatar_url: p.avatar_url as string | null,
      is_verified: p.is_verified as boolean,
      is_suspended: p.is_suspended as boolean,
      created_at: p.created_at as string,
      listing_count: countMap[p.id as string] ?? 0,
    }));

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
