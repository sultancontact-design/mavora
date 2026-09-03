import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// POST /api/admin/category-fields/[id]/options
// Create a new option for a category field
export async function POST(
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

    const { id: fieldId } = await params;
    const adminClient = getSupabaseAdminClient();

    // Verify field exists
    const { data: field, error: fieldError } = await adminClient
      .from('category_fields')
      .select('id')
      .eq('id', fieldId)
      .single();

    if (fieldError || !field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const body = await request.json();
    const { value_ar, value_fr, value_en, sort_order = 0 } = body;

    if (!value_en) {
      return NextResponse.json(
        { error: 'value_en is required' },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from('category_field_options')
      .insert({
        field_id: fieldId,
        value_ar: value_ar || value_en,
        value_fr: value_fr || value_en,
        value_en,
        sort_order,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Create option error:', error);
      return NextResponse.json(
        { error: 'Failed to create option' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create option error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
