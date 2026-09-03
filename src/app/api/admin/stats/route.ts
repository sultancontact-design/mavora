import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Helper to get date ranges
function getDateRange(period: 'today' | 'week' | 'month') {
  const now = new Date();
  let start: Date;
  
  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      break;
  }
  
  return start.toISOString();
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();
    
    // Check authentication and admin role
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role ?? 'user';
    if (!['admin', 'super_admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = (url.searchParams.get('period') as 'today' | 'week' | 'month') || 'month';

    // Fetch all stats in parallel
    const [
      totalUsersRes,
      newListingsTodayRes,
      newListingsWeekRes,
      newListingsMonthRes,
      activeListingsRes,
      pendingListingsRes,
      pendingReportsRes,
      totalRevenueRes,
      usersTodayRes,
      usersWeekRes,
      usersMonthRes,
      listingsChartRes,
      usersChartRes,
    ] = await Promise.all([
      // Total users
      adminClient.from('profiles').select('id', { count: 'exact', head: true }),
      
      // New listings by period
      adminClient.from('listings').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('today')),
      adminClient.from('listings').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('week')),
      adminClient.from('listings').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('month')),
      
      // Active/Pending listings
      adminClient.from('listings').select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      adminClient.from('listings').select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      
      // Pending reports
      adminClient.from('reports').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Revenue (from invoices)
      adminClient.from('invoices').select('amount', { count: 'exact' })
        .eq('status', 'paid'),
      
      // New users by period
      adminClient.from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('today')),
      adminClient.from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('week')),
      adminClient.from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', getDateRange('month')),
      
      // Chart data - last 30 days of listings
      adminClient.rpc('get_listings_by_day', { days_limit: 30 }).maybeSingle(),
      
      // Chart data - last 30 days of users
      adminClient.rpc('get_users_by_day', { days_limit: 30 }).maybeSingle(),
    ]);

    // Calculate revenue
    const totalRevenue = (totalRevenueRes.data ?? []).reduce(
      (sum: number, inv: Record<string, unknown>) => sum + (inv.amount as number || 0),
      0
    );

    // Generate chart data from real database records
    const chartData = await generateChartData(30);

    return NextResponse.json({
      overview: {
        total_users: totalUsersRes.count ?? 0,
        total_listings: 0, // Will be calculated
        total_revenue: totalRevenue,
        pending_reports: pendingReportsRes.count ?? 0,
      },
      users: {
        total: totalUsersRes.count ?? 0,
        today: usersTodayRes.count ?? 0,
        this_week: usersWeekRes.count ?? 0,
        this_month: usersMonthRes.count ?? 0,
      },
      listings: {
        today: newListingsTodayRes.count ?? 0,
        this_week: newListingsWeekRes.count ?? 0,
        this_month: newListingsMonthRes.count ?? 0,
        active: activeListingsRes.count ?? 0,
        pending: pendingListingsRes.count ?? 0,
      },
      charts: {
        listings: chartData.listings,
        users: chartData.users,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// Generate real chart data from database
async function generateChartData(days: number) {
  const listings: { date: string; count: number }[] = [];
  const users: { date: string; count: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateStr = date.toISOString().split('T')[0];
    
    // Fetch real counts from database
    try {
      const [listingCount, userCount] = await Promise.all([
        db.listing.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        db.user.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
          },
        }),
      ]);
      
      listings.push({ date: dateStr, count: listingCount });
      users.push({ date: dateStr, count: userCount });
    } catch (error) {
      // Fallback to 0 if query fails
      listings.push({ date: dateStr, count: 0 });
      users.push({ date: dateStr, count: 0 });
    }
  }
  
  return { listings, users };
}
