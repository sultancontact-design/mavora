import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

const VALID_FIELD_TYPES = ['text', 'number', 'select', 'multiselect', 'boolean', 'date'];

// GET /api/admin/category-fields/[id]
// Get a single category field with its options
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = getSupabaseAdminClient();

    const { data, error } = await adminClient
      .from('category_fields')
      .select('*, options:category_field_options(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const field = {
      ...data,
      options: ((data.options as Record<string, unknown>[]) ?? []).sort(
        (a, b) => (a.sort_order as number) - (b.sort_order as number)
      ),
    };

    return NextResponse.json(field);
  } catch (error) {
    console.error('Admin category field detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/category-fields/[id]
// Update a category field
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = getSupabaseAdminClient();

    // Verify field exists
    const { data: existing, error: fetchError } = await adminClient
      .from('category_fields')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name_ar !== undefined) updates.name_ar = body.name_ar;
    if (body.name_fr !== undefined) updates.name_fr = body.name_fr;
    if (body.name_en !== undefined) updates.name_en = body.name_en;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.field_type !== undefined) {
      if (!VALID_FIELD_TYPES.includes(body.field_type)) {
        return NextResponse.json(
          { error: `field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.field_type = body.field_type;
    }
    if (body.is_required !== undefined) updates.is_required = body.is_required;
    if (body.is_filterable !== undefined) updates.is_filterable = body.is_filterable;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.placeholder_ar !== undefined) updates.placeholder_ar = body.placeholder_ar || null;
    if (body.placeholder_fr !== undefined) updates.placeholder_fr = body.placeholder_fr || null;
    if (body.placeholder_en !== undefined) updates.placeholder_en = body.placeholder_en || null;
    if (body.unit_ar !== undefined) updates.unit_ar = body.unit_ar || null;
    if (body.unit_fr !== undefined) updates.unit_fr = body.unit_fr || null;
    if (body.unit_en !== undefined) updates.unit_en = body.unit_en || null;
    if (body.validation_min !== undefined) updates.validation_min = body.validation_min ?? null;
    if (body.validation_max !== undefined) updates.validation_max = body.validation_max ?? null;

    const { data, error } = await adminClient
      .from('category_fields')
      .update(updates)
      .eq('id', id)
      .select('*, options:category_field_options(*)')
      .single();

    if (error) {
      console.error('Admin category field update error:', error);
      return NextResponse.json(
        { error: 'Failed to update category field' },
        { status: 500 }
      );
    }

    const field = {
      ...data,
      options: ((data.options as Record<string, unknown>[]) ?? []).sort(
        (a, b) => (a.sort_order as number) - (b.sort_order as number)
      ),
    };

    return NextResponse.json(field);
  } catch (error) {
    console.error('Admin category field update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/category-fields/[id]
// Delete a category field and its options (cascading)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = getSupabaseAdminClient();

    // Verify field exists
    const { data: existing, error: fetchError } = await adminClient
      .from('category_fields')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Delete options first (though CASCADE should handle this)
    await adminClient
      .from('category_field_options')
      .delete()
      .eq('field_id', id);

    // Delete the field
    const { error: deleteError } = await adminClient
      .from('category_fields')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Admin category field delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete category field' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin category field delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
