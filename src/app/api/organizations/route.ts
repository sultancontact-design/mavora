import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));

    let query = supabase
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
        isActive,
        created_at,
        updated_at,
        owner:profiles!organizations_owner_id_fkey(id, display_name, avatar_url),
        member_count:organization_members(count)
      `, { count: 'exact' })
      .eq('isActive', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,name_en.ilike.%${search}%,name_fr.ilike.%${search}%`);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      data: data ?? [],
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error('Organizations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, name_ar, name_fr, name_en, description, description_ar, description_fr, description_en, logo_url, cover_url, website, phone, address } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Organization name is required (min 2 characters)' }, { status: 400 });
    }

    const userId = session.user.id;

    const { data: org, error: insertError } = await supabase
      .from('organizations')
      .insert({
        owner_id: userId,
        name: name.trim(),
        name_ar: name_ar?.trim() ?? null,
        name_fr: name_fr?.trim() ?? null,
        name_en: name_en?.trim() ?? null,
        description: description?.trim() ?? null,
        description_ar: description_ar?.trim() ?? null,
        description_fr: description_fr?.trim() ?? null,
        description_en: description_en?.trim() ?? null,
        logo_url: logo_url ?? null,
        cover_url: cover_url ?? null,
        website: website?.trim() ?? null,
        phone: phone?.trim() ?? null,
        address: address?.trim() ?? null,
      })
      .select('id, name, created_at')
      .single();

    if (insertError) {
      console.error('Organization create error:', insertError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Auto-add the owner as an 'owner' member
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error('Organizations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
