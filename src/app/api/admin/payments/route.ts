import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET /api/admin/payments - List all payments/transactions
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

    if (!['admin', 'super_admin', 'finance_manager'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const provider = searchParams.get('provider') || '';
    const type = searchParams.get('type') || ''; // invoice, subscription, token
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));

    // Build query for invoices
    let query = adminClient
      .from('invoices')
      .select('*, user:profiles(id, display_name, email)', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && ['pending', 'paid', 'failed', 'refunded', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply type filter
    if (type && ['token_purchase', 'subscription', 'promotion'].includes(type)) {
      query = query.eq('type', type);
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }

    // Apply sorting
    const validSortFields = ['created_at', 'amount', 'status', 'invoice_number', 'type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin payments fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Calculate summary statistics
    const [totalRevenueRes, todayRevenueRes, monthRevenueRes] = await Promise.all([
      adminClient
        .from('invoices')
        .select('amount')
        .eq('status', 'paid'),
      
      adminClient
        .rpc('sum_invoices_by_date_range', {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          status_filter: 'paid'
        }).maybeSingle(),
        
      adminClient
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const totalRevenue = (totalRevenueRes.data ?? []).reduce(
      (sum: number, inv: Record<string, unknown>) => sum + (inv.amount as number || 0),
      0
    );
    
    const monthRevenue = (monthRevenueRes.data ?? []).reduce(
      (sum: number, inv: Record<string, unknown>) => sum + (inv.amount as number || 0),
      0
    );

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      summary: {
        total_revenue: totalRevenue,
        month_revenue: monthRevenue,
        total_transactions: count ?? 0,
      },
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
