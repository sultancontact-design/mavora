import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('[Categories API] Starting fetch...');
    const supabase = getSupabaseServerClient();
    console.log('[Categories API] Supabase client created');

    // Fetch all active categories
    // IMPORTANT: Schema uses CAMELCASE columns (parentId, sortOrder, isActive)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)  // camelCase - matches schema
      .order('sortOrder', { ascending: true });  // camelCase - matches schema

    console.log('[Categories API] Query result:', { 
      dataLength: data?.length, 
      error: error?.message,
      errorCode: error?.code 
    });

    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories', details: error.message, code: error.code }, { status: 500 });
    }

    // Group into parent-child hierarchy
    const allCategories = data ?? [];
    const parentCategories = allCategories
      .filter((cat) => cat.parentId === null)  // camelCase - matches schema
      .map((parent) => ({
        ...parent,
        children: allCategories
          .filter((cat) => cat.parentId === parent.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),  // camelCase
      }));

    return NextResponse.json(parentCategories);
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
