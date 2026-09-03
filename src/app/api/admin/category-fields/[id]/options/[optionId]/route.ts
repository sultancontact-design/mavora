import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// PATCH /api/admin/category-fields/[id]/options/[optionId]
// Update a category field option
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
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

    const { id: fieldId, optionId } = await params;
    const adminClient = getSupabaseAdminClient();

    // Verify option belongs to this field
    const { data: existing, error: fetchError } = await adminClient
      .from('category_field_options')
      .select('id')
      .eq('id', optionId)
      .eq('field_id', fieldId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.value_ar !== undefined) updates.value_ar = body.value_ar;
    if (body.value_fr !== undefined) updates.value_fr = body.value_fr;
    if (body.value_en !== undefined) updates.value_en = body.value_en;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data, error } = await adminClient
      .from('category_field_options')
      .update(updates)
      .eq('id', optionId)
      .select('*')
      .single();

    if (error) {
      console.error('Update option error:', error);
      return NextResponse.json(
        { error: 'Failed to update option' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update option error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/category-fields/[id]/options/[optionId]
// Delete a category field option
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
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

    const { id: fieldId, optionId } = await params;
    const adminClient = getSupabaseAdminClient();

    // Verify option belongs to this field
    const { data: existing, error: fetchError } = await adminClient
      .from('category_field_options')
      .select('id')
      .eq('id', optionId)
      .eq('field_id', fieldId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    const { error: deleteError } = await adminClient
      .from('category_field_options')
      .delete()
      .eq('id', optionId);

    if (deleteError) {
      console.error('Delete option error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete option' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete option error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
