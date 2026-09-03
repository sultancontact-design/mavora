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
      .from('organizations')
      .select(`
        id,
        name,
        name_ar,
        name_fr,
        name_en,
        description,
        description_ar,
        description_fr,
        description_en,
        logo_url,
        cover_url,
        website,
        phone,
        address,
        is_verified,
        is_active,
        created_at,
        updated_at,
        owner:profiles!organizations_owner_id_fkey(id, display_name, avatar_url),
        member_count:organization_members(count)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Organization GET by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
