/**
 * API Route: Coupon Operations by Code
 * 
 * GET /api/promotions/coupons/[code] - Get coupon details
 * POST /api/promotions/coupons/[code]/apply - Apply coupon to cart
 * GET /api/promotions/coupons/[code]/stats - Get statistics (admin)
 * PATCH /api/promotions/coupons/[code] - Update coupon (admin)
 * DELETE /api/promotions/coupons/[code] - Delete/disable coupon (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { couponManager, CouponStatus } from '@/lib/promotions/coupons';
import { getSupabaseServerClient } from '@/lib/supabase';

// ============================================================
// Get Coupon Details
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const coupon = couponManager.getCoupon(code);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive information in public endpoint
    const publicCoupon = {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      scope: coupon.scope,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      description: coupon.description,
      descriptionEn: coupon.descriptionEn,
      status: coupon.status,
    };

    return NextResponse.json({
      success: true,
      coupon: publicCoupon,
    });

  } catch (error) {
    console.error('[Coupons API] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to get coupon' },
      { status: 500 }
    );
  }
}

// ============================================================
// Apply Coupon to Cart
// ============================================================

export async function APPLY_POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const body = await request.json();
    const { cart } = body;

    if (!cart || !cart.items || !cart.subtotal) {
      return NextResponse.json(
        { error: 'Cart data is required with items and subtotal' },
        { status: 400 }
      );
    }

    // Add user context to cart
    const cartContext = {
      ...cart,
      userId: session.user.id,
    };

    const result = couponManager.validateAndApply(code, cartContext);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Coupons API] Apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}

// ============================================================
// Get Coupon Statistics (Admin)
// ============================================================

export async function STATS_GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const stats = couponManager.getCouponStats(code);

    if (!stats) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('[Coupons API] Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get coupon stats' },
      { status: 500 }
    );
  }
}

// ============================================================
// Update Coupon (Admin)
// ============================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(CouponStatus).includes(status)) {
      return NextResponse.json(
        { error: `Valid status required: ${Object.values(CouponStatus).join(', ')}` },
        { status: 400 }
      );
    }

    const updatedCoupon = couponManager.updateCouponStatus(code, status);

    if (!updatedCoupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
      message: `Coupon ${status} successfully`,
    });

  } catch (error) {
    console.error('[Coupons API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// ============================================================
// Delete/Disable Coupon (Admin)
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const deleted = couponManager.deleteCoupon(code);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon disabled successfully',
    });

  } catch (error) {
    console.error('[Coupons API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
