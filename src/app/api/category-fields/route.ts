import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// GET /api/category-fields?category_id=UUID
// Returns all fields for a category with their options, ordered by sort_order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('category_fields')
      .select('*, options:category_field_options(*)')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Category fields fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch category fields' },
        { status: 500 }
      );
    }

    // Sort options within each field by sort_order
    const fields = (data ?? []).map((field) => ({
      ...field,
      options: ((field.options as Record<string, unknown>[]) ?? []).sort(
        (a, b) => (a.sort_order as number) - (b.sort_order as number)
      ),
    }));

    return NextResponse.json(fields);
  } catch (error) {
    console.error('Category fields error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
