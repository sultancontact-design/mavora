import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET /api/admin/plans - List all plans
export async function GET(request: Request) {
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

    if (!['admin', 'super_admin'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all plans
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Admin plans fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Get subscription counts per plan
    const planIds = (plans ?? []).map((p: Record<string, unknown>) => p.id as string);
    let subscriptionCounts: Record<string, number> = {};

    if (planIds.length > 0) {
      const { data: subscriptions } = await adminClient
        .from('subscriptions')
        .select('plan_id, status')
        .in('plan_id', planIds)
        .eq('status', 'active');

      for (const sub of subscriptions ?? []) {
        const planId = sub.plan_id as string;
        subscriptionCounts[planId] = (subscriptionCounts[planId] ?? 0) + 1;
      }
    }

    // Enrich plans with subscriber count
    const enrichedPlans = (plans ?? []).map((plan: Record<string, unknown>) => ({
      ...plan,
      subscriber_count: subscriptionCounts[plan.id as string] ?? 0,
    }));

    return NextResponse.json({
      data: enrichedPlans,
    });
  } catch (error) {
    console.error('Admin plans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/plans - Create new plan
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

    // Check admin role - only super_admin can create plans
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (adminProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can create plans' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      name_ar,
      description,
      description_ar,
      price_monthly,
      price_yearly,
      listings_limit,
      featured_limit,
      images_per_listing,
      duration_days,
      features,
      isActive,
      sort_order,
      highlight_color,
    } = body;

    // Validate required fields
    if (!name || !name_ar || price_monthly === undefined) {
      return NextResponse.json(
        { error: 'name, name_ar, and price_monthly are required' },
        { status: 400 }
      );
    }

    // Create plan
    const { data, error } = await adminClient
      .from('plans')
      .insert({
        name,
        name_ar,
        description: description || '',
        description_ar: description_ar || '',
        price_monthly: parseFloat(price_monthly),
        price_yearly: price_yearly ? parseFloat(price_yearly) : null,
        listings_limit: listings_limit || 10,
        featured_limit: featured_limit || 0,
        images_per_listing: images_per_listing || 5,
        duration_days: duration_days || 30,
        features: features || [],
        isActive: is_active !== false,
        sort_order: sort_order || 0,
        highlight_color: highlight_color || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Admin plan create error:', error);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Plan created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Admin plan create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/plans - Batch update plans
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

    if (!['admin', 'super_admin'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body as { updates: Array<{ id: string; [key: string]: unknown }> };

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
      
      // Convert price values to numbers if present
      if ('price_monthly' in updateData && typeof updateData.price_monthly === 'string') {
        updateData.price_monthly = parseFloat(updateData.price_monthly as string);
      }
      if ('price_yearly' in updateData && typeof updateData.price_yearly === 'string') {
        updateData.price_yearly = parseFloat(updateData.price_yearly as string);
      }
      
      const { data, error } = await adminClient
        .from('plans')
        .update(updateData)
        .eq('id', id)
        .select('id, name, name_ar')
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
    console.error('Admin plans batch update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
