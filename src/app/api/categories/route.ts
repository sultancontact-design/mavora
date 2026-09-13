import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('[Categories API] Starting fetch...');
    const supabase = getSupabaseServerClient();
    console.log('[Categories API] Supabase client created');

    // Fetch from database - DB uses camelCase columns
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });

    console.log('[Categories API] Query result:', { 
      dataLength: data?.length, 
      error: error?.message,
      errorCode: error?.code 
    });

    // If DB query successful, return real data
    if (!error && data && data.length > 0) {
      console.log('[Categories API] ✅ Returning DB data');
      
      // Group into parent-child hierarchy - DB uses camelCase columns
      const allCategories = data;
      const parentCategories = allCategories
        .filter((cat) => cat.parentId === null)
        .map((parent) => ({
          ...parent,
          children: allCategories
            .filter((cat) => cat.parentId === parent.id)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      return NextResponse.json(parentCategories);
    }

    // If DB failed or empty, return empty array (no mock fallback)
    console.warn('[Categories API] ⚠️ DB query failed/empty');
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('[Categories API] ❌ Error:', error);
    
    // Return empty array on any error (no mock fallback)
    return NextResponse.json([]);
  }
}
