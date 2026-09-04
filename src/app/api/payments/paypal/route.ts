/**
 * API Route: PayPal Payment Integration
 * Endpoints for creating and managing PayPal payments
 * 
 * POST /api/payments/paypal/create - Create PayPal order
 * GET /api/payments/paypal/:orderId - Get order details
 * POST /api/payments/paypal/:orderId/capture - Capture payment
 * POST /api/payments/paypal/webhook - PayPal webhook handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalProvider } from '@/lib/payments/providers/paypal';
import { getSupabaseServerClient } from '@/lib/supabase';

// Initialize PayPal provider from environment
function getProvider() {
  const config = {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET,
  };

  return getPayPalProvider(config);
}

// ============================================================
// Create PayPal Order
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency = 'MAD', description, orderId, items } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    const paypal = getProvider();

    // Build return/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.origin}`;
    
    const paymentToken = await paypal.createPayment({
      amount: parseFloat(amount),
      currency,
      description: description || `Mavora Payment - Order ${orderId}`,
      orderId,
      customerId: session.user.id,
      returnUrl: `${baseUrl}/api/payments/paypal/success?order=${orderId}`,
      cancelUrl: `${baseUrl}/api/payments/paypal/cancel?order=${orderId}`,
      items,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: paymentToken.order_id,
        approvalUrl: paymentToken.approval_url,
        checkoutUrl: paypal.generateCheckoutUrl(paymentToken.order_id),
      },
    });

  } catch (error) {
    console.error('[PayPal API] Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

// ============================================================
// Get Order Details (for specific order ID in URL)
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId?: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const paypal = getProvider();
    const orderDetails = await paypal.getPaymentDetails(orderId);

    return NextResponse.json({
      success: true,
      data: orderDetails,
    });

  } catch (error) {
    console.error('[PayPal API] Error getting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get PayPal order' },
      { status: 500 }
    );
  }
}
