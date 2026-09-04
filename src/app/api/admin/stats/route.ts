import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/server-client';

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
  // Use secure admin client (server-side only)
  const supabase = getAdminClient();
  try {
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
      totalListingsRes,
      // Wallet stats
      totalWalletBalanceRes,
      // Category stats
      categoriesRes,
      // Recent activity
      recentListingsRes,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id', { count: 'exact', head: true }),
      
      // New listings by period
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('today')),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('week')),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('month')),
      
      // Active/Pending listings
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      
      // Pending reports
      supabase.from('reports').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Revenue (from payments)
      supabase.from('payments').select('amount', { count: 'exact' })
        .eq('status', 'completed'),
      
      // New users by period
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('today')),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('week')),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('createdAt', getDateRange('month')),
      
      // Total listings
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      
      // Total wallet balance
      supabase.from('wallets').select('balance'),
      
      // Categories count
      supabase.from('categories').select('id, name, nameAr, slug', { count: 'exact' }),
      
      // Recent listings (last 10)
      supabase.from('listings')
        .select('id, title, status, createdAt, price, currencyCode')
        .order('createdAt', { ascending: false })
        .limit(10),
    ]);

    // Calculate revenue
    const totalRevenue = (totalRevenueRes.data ?? []).reduce(
      (sum: number, p: Record<string, unknown>) => sum + (p.amount as number || 0),
      0
    );

    // Calculate total wallet balance
    const totalWalletBalance = (totalWalletBalanceRes.data ?? []).reduce(
      (sum: number, w: Record<string, unknown>) => sum + (w.balance as number || 0),
      0
    );

    // Generate chart data from real database records
    const chartData = await generateChartData(30);

    return NextResponse.json({
      success: true,
      overview: {
        total_users: totalUsersRes.count ?? 0,
        total_listings: totalListingsRes.count ?? 0,
        total_revenue: totalRevenue,
        pending_reports: pendingReportsRes.count ?? 0,
        total_wallet_balance: totalWalletBalance,
        active_listings: activeListingsRes.count ?? 0,
        categories_count: categoriesRes.count ?? 0,
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
        total: totalListingsRes.count ?? 0,
      },
      charts: chartData,
      categories: categoriesRes.data ?? [],
      recent_listings: recentListingsRes.data ?? [],
      revenue: {
        total: totalRevenue,
        monthly: totalRevenue, // Would need date filtering for accurate monthly
      },
      wallets: {
        total_balance: totalWalletBalance,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const dateStart = date.toISOString();
    const dateEnd = nextDate.toISOString();
    
    try {
      const [listingRes, userRes] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true })
          .gte('createdAt', dateStart)
          .lt('createdAt', dateEnd),
        supabase.from('users').select('id', { count: 'exact', head: true })
          .gte('createdAt', dateStart)
          .lt('createdAt', dateEnd),
      ]);
      
      listings.push({ date: dateStr, count: listingRes.count ?? 0 });
      users.push({ date: dateStr, count: userRes.count ?? 0 });
    } catch (error) {
      console.warn(`Chart data fetch error for ${dateStr}:`, error);
      listings.push({ date: dateStr, count: 0 });
      users.push({ date: dateStr, count: 0 });
    }
  }
  
  return { listings, users };
}
