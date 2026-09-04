/**
 * API Route: PayPal Webhook Handler
 * Endpoint: POST /api/payments/paypal/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalProvider } from '@/lib/payments/providers/paypal';

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

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const headers = request.headers;

    console.log('[PayPal Webhook] Received event');

    const paypal = getProvider();
    
    // Verify webhook signature
    const { valid, event } = await paypal.verifyWebhookSignature(headers, body);

    if (!valid) {
      console.warn('[PayPal Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process the webhook
    const result = await paypal.processWebhook({
      rawBody: event,
      headers: Object.fromEntries(headers.entries()),
    });

    console.log('[PayPal Webhook] Processed:', result.status);

    // TODO: Update order status in database based on result
    // TODO: Send notification to user
    // TODO: Trigger any post-payment workflows

    return NextResponse.json({
      success: true,
      received: true,
    });

  } catch (error) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle PayPal verification request
export async function GET() {
  // PayPal sends GET requests to verify webhook URL
  return NextResponse.json({ status: 'ok' });
}
