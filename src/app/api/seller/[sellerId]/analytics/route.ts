/**
 * API Route: Seller Analytics
 * Provides comprehensive analytics data for sellers
 * 
 * GET /api/seller/[sellerId]/analytics - Get dashboard data
 * GET /api/seller/[sellerId]/export - Export data as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { sellerAnalytics } from '@/lib/analytics/seller-analytics';

// ============================================================
// Get Seller Analytics Dashboard Data
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerId } = await params;
    
    // Verify user is the seller or admin (simplified)
    // In production, check if user owns this seller account
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateRange = {
      start: startDate,
      end: now,
      preset: range as any,
    };

    // Get dashboard data
    const dashboardData = await sellerAnalytics.getDashboardData(sellerId, dateRange);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('[Seller Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics data' },
      { status: 500 }
    );
  }
}
