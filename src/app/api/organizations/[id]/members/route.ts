import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profile:profiles(id, display_name, avatar_url)
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Organization members fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Organization members GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
