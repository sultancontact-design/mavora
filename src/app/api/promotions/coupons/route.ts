/**
 * API Route: Coupons & Discounts
 * Endpoints for coupon management and validation
 * 
 * GET /api/promotions/coupons - List all coupons (admin)
 * POST /api/promotions/coupons - Create new coupon (admin)
 * GET /api/promotions/coupons/:code - Get coupon details
 * POST /api/promotions/coupons/apply - Apply coupon to cart
 * GET /api/promotions/coupons/:code/stats - Get coupon statistics (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { couponManager, CouponType, DiscountScope, CouponStatus } from '@/lib/promotions/coupons';
import { getSupabaseServerClient } from '@/lib/supabase';

// ============================================================
// List All Coupons (Admin)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (simplified)
    // In production, check role/permissions

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CouponStatus | null;
    const type = searchParams.get('type') as CouponType | null;
    const scope = searchParams.get('scope') as DiscountScope | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const coupons = couponManager.listCoupons({
      status: status || undefined,
      type: type || undefined,
      scope: scope || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: coupons,
      total: coupons.length,
    });

  } catch (error) {
    console.error('[Coupons API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list coupons' },
      { status: 500 }
    );
  }
}

// ============================================================
// Create New Coupon (Admin)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      scope,
      maxUses,
      maxUsesPerUser,
      minimumOrderAmount,
      maximumDiscountAmount,
      validFrom,
      validUntil,
      applicableCategories,
      applicableListings,
      applicableUsers,
      description,
      descriptionEn,
    } = body;

    // Validate required fields
    if (!code || !type || value === undefined || !scope) {
      return NextResponse.json(
        { error: 'Missing required fields: code, type, value, scope' },
        { status: 400 }
      );
    }

    // Validate dates
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (fromDate >= untilDate) {
      return NextResponse.json(
        { error: 'validFrom must be before validUntil' },
        { status: 400 }
      );
    }

    // Validate type
    if (!Object.values(CouponType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid coupon type. Must be one of: ${Object.values(CouponType).join(', ')}` },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = couponManager.createCoupon({
      code,
      type,
      value: parseFloat(value),
      scope,
      maxUses: parseInt(maxUses) || -1,
      maxUsesPerUser: parseInt(maxUsesPerUser) || 1,
      minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : undefined,
      maximumDiscountAmount: maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : undefined,
      validFrom: fromDate,
      validUntil: untilDate,
      applicableCategories,
      applicableListings,
      applicableUsers,
      createdBy: session.user.id,
      description,
      descriptionEn,
    });

    return NextResponse.json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully',
    });

  } catch (error) {
    console.error('[Coupons API] Create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
