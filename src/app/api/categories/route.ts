import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Fetch all active categories
    // Note: Supabase/PostgreSQL typically uses snake_case columns
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)  // Use snake_case for DB column
      .order('sort_order', { ascending: true });  // Use snake_case for DB column

    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Group into parent-child hierarchy
    const allCategories = data ?? [];
    const parentCategories = allCategories
      .filter((cat) => cat.parent_id === null)  // Use snake_case for DB column
      .map((parent) => ({
        ...parent,
        children: allCategories
          .filter((cat) => cat.parent_id === parent.id)
          .sort((a, b) => a.sort_order - b.sort_order),  // Use snake_case
      }));

    return NextResponse.json(parentCategories);
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
