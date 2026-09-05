import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

export async function GET() {
  try {
    console.log('[Categories API] Starting fetch...');
    const supabase = getSupabaseServerClient();
    console.log('[Categories API] Supabase client created');

    // Try to fetch from database
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
      
      // Group into parent-child hierarchy
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

    // If DB failed or empty, use mock data
    console.warn('[Categories API] ⚠️ DB query failed/empty, using mock data');
    
    // Transform mock data to match expected format
    const mockResponse = MOCK_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.nameAr || cat.name,
      nameAr: cat.nameAr,
      nameFr: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      isActive: true,
      parentId: null,
      sortOrder: 0,
      listingCount: cat.listingCount,
      children: [],
      color: cat.color,
    }));

    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error('[Categories API] ❌ Error, using mock data:', error);
    
    // Return mock data on any error
    const mockResponse = MOCK_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.nameAr || cat.name,
      nameAr: cat.nameAr,
      nameFr: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      isActive: true,
      parentId: null,
      sortOrder: 0,
      listingCount: cat.listingCount,
      children: [],
      color: cat.color,
    }));

    return NextResponse.json(mockResponse);
  }
}
