import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET /api/admin/categories - List all categories with tree structure
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['admin', 'super_admin', 'moderator', 'content_manager'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all categories
    const { data: categories, error } = await adminClient
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name_ar', { ascending: true });

    if (error) {
      console.error('Admin categories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Build tree structure
    const categoryTree = buildCategoryTree(categories ?? []);

    return NextResponse.json({
      data: categories ?? [],
      tree: categoryTree,
    });
  } catch (error) {
    console.error('Admin categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['admin', 'super_admin', 'content_manager'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name_en, name_ar, name_fr, parent_id, icon_name, slug, isActive } = body;

    // Validate required fields
    if (!name_ar || !name_en) {
      return NextResponse.json(
        { error: 'name_ar and name_en are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const categorySlug = slug || name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Get max sort_order for ordering
    const { count: maxOrder } = await adminClient
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parent_id || null);

    // Create category
    const { data, error } = await adminClient
      .from('categories')
      .insert({
        name_en,
        name_ar,
        name_fr: name_fr || '',
        parent_id: parent_id || null,
        icon_name: icon_name || '',
        slug: categorySlug,
        isActive: is_active !== false,
        sort_order: (maxOrder ?? 0) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Admin category create error:', error);
      
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Admin category create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/categories - Batch update categories (reorder)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['admin', 'super_admin', 'content_manager'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body as { updates: Array<{ id: string; sort_order?: number; isActive?: boolean; name_ar?: string; name_en?: string; name_fr?: string }> };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      );
    }

    // Process each update
    const results = [];
    for (const update of updates) {
      const { id, ...updateData } = update;
      
      const { data, error } = await adminClient
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select('id, name_en, name_ar')
        .single();

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true, data });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: successCount === updates.length,
      updated: successCount,
      total: updates.length,
      results,
    });
  } catch (error) {
    console.error('Admin categories batch update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to build category tree
function buildCategoryTree(categories: Record<string, unknown>[]) {
  const map = new Map<string, Record<string, unknown> & { children?: Record<string, unknown>[] }>();
  const roots: Record<string, unknown>[] = [];

  for (const cat of categories) {
    map.set(cat.id as string, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id as string)!;
    const parentId = cat.parent_id as string | null;

    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
