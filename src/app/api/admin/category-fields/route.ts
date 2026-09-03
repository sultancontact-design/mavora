import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

const VALID_FIELD_TYPES = ['text', 'number', 'select', 'multiselect', 'boolean', 'date'];

// GET /api/admin/category-fields?category_id=UUID
// List all fields (admin, with optional category_id filter)
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
    const categoryId = searchParams.get('category_id');

    const adminClient = getSupabaseAdminClient();

    let query = adminClient
      .from('category_fields')
      .select('*, options:category_field_options(*), category:categories(id, name_en, name_ar, name_fr)')
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin category fields fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch category fields' },
        { status: 500 }
      );
    }

    // Sort options within each field
    const fields = (data ?? []).map((field) => ({
      ...field,
      options: ((field.options as Record<string, unknown>[]) ?? []).sort(
        (a, b) => (a.sort_order as number) - (b.sort_order as number)
      ),
    }));

    return NextResponse.json(fields);
  } catch (error) {
    console.error('Admin category fields error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/category-fields
// Create a new category field
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
    const {
      category_id,
      name_ar,
      name_fr,
      name_en,
      slug,
      field_type,
      is_required = false,
      is_filterable = false,
      sort_order = 0,
      placeholder_ar,
      placeholder_fr,
      placeholder_en,
      unit_ar,
      unit_fr,
      unit_en,
      validation_min,
      validation_max,
    } = body;

    // Validate required fields
    if (!category_id || !name_ar || !name_fr || !name_en || !slug || !field_type) {
      return NextResponse.json(
        { error: 'category_id, name_ar, name_fr, name_en, slug, and field_type are required' },
        { status: 400 }
      );
    }

    if (!VALID_FIELD_TYPES.includes(field_type)) {
      return NextResponse.json(
        { error: `field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    const { data, error } = await adminClient
      .from('category_fields')
      .insert({
        category_id,
        name_ar,
        name_fr,
        name_en,
        slug,
        field_type,
        is_required,
        is_filterable,
        sort_order,
        placeholder_ar: placeholder_ar || null,
        placeholder_fr: placeholder_fr || null,
        placeholder_en: placeholder_en || null,
        unit_ar: unit_ar || null,
        unit_fr: unit_fr || null,
        unit_en: unit_en || null,
        validation_min: validation_min ?? null,
        validation_max: validation_max ?? null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Admin category field create error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A field with this slug already exists for this category' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create category field' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Admin category field create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
