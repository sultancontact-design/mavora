import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Valid roles for filtering
const VALID_ROLES = ['user', 'verified_user', 'professional_seller', 'moderator', 'support_agent', 'finance_manager', 'content_manager', 'analyst', 'admin', 'super_admin'];

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

    // Check if user is admin
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const adminRole = adminProfile?.role ?? 'user';
    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || ''; // active, suspended, banned
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));
    const exportCsv = searchParams.get('export') === 'csv';

    // Build query
    let query = adminClient
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (role && VALID_ROLES.includes(role)) {
      query = query.eq('role', role);
    }

    // Apply status filter
    if (status === 'suspended') {
      query = query.eq('is_suspended', true);
    } else if (status === 'banned') {
      // Need to check users table for banned status
    } else if (status === 'active') {
      query = query.eq('is_suspended', false).eq('is_banned', false);
    }

    // Apply sorting
    const validSortFields = ['display_name', 'email', 'role', 'is_verified', 'is_suspended', 'created_at', 'last_login_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? true : false;
    
    query = query.order(sortField, { ascending: order });

    // For CSV export, fetch all records
    if (exportCsv) {
      const { data, error } = await query;
      
      if (error) {
        console.error('Admin users export error:', error);
        return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
      }

      // Generate CSV
      const headers = ['ID', 'Display Name', 'Email', 'Role', 'Verified', 'Suspended', 'Created At'];
      const csvRows = [
        headers.join(','),
        ...(data ?? []).map((user: Record<string, unknown>) => [
          user.id,
          `"${(user.display_name as string) || ''}"`,
          `"${(user.email as string) || ''}"`,
          user.role || 'user',
          user.is_verified ? 'Yes' : 'No',
          user.is_suspended ? 'Yes' : 'No',
          user.created_at,
        ].join(','))
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin users error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get listing counts per user
    const userIds = (data ?? []).map((u: Record<string, unknown>) => u.id as string);
    let listingCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: listings } = await adminClient
        .from('listings')
        .select('seller_id')
        .in('seller_id', userIds);

      for (const l of listings ?? []) {
        const sid = l.seller_id as string;
        listingCounts[sid] = (listingCounts[sid] ?? 0) + 1;
      }
    }

    const users = (data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      display_name: (p.display_name as string) || '',
      email: (p.email as string) || '',
      avatar_url: p.avatar_url as string | null,
      role: (p.role as string) || 'user',
      is_verified: p.is_verified as boolean,
      is_suspended: p.is_suspended as boolean,
      is_banned: p.is_banned as boolean,
      last_login_at: p.last_login_at as string | null,
      created_at: p.created_at as string,
      listing_count: listingCounts[p.id as string] ?? 0,
    }));

    return NextResponse.json({
      data: users,
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
