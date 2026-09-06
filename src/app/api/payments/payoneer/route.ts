/**
 * API Route: Payoneer Payment & Payout Integration
 * Endpoints for Payoneer payments and seller payouts
 * 
 * POST /api/payments/payoneer/payment - Create payment
 * POST /api/payments/payoneer/payout - Create payout to seller
 * GET /api/payments/payoneer/payouts - List payouts
 * POST /api/payments/payoneer/webhook - Payoneer webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayoneerProvider } from '@/lib/payments/providers/payoneer';
import { getSupabaseServerClient } from '@/lib/supabase';

// Initialize Payoneer provider from environment
function getProvider() {
  const config = {
    environment: (process.env.PAYONEER_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
    apiKey: process.env.PAYONEER_API_KEY || '',
    apiSecret: process.env.PAYONEER_API_SECRET || '',
    programId: process.env.PAYONEER_PROGRAM_ID || '',
    webhookSecret: process.env.PAYONEER_WEBHOOK_SECRET,
  };

  return getPayoneerProvider(config);
}

// ============================================================
// Create Payment (Buyer)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    const payoneer = getProvider();

    switch (action) {
      case 'create_payment': {
        const { amount, currency = 'MAD', description, orderId } = params;
        
        if (!amount || !orderId) {
          return NextResponse.json(
            { error: 'Missing required fields: amount, orderId' },
            { status: 400 }
          );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.origin}`;
        
        const payment = await payoneer.createPayment({
          amount: parseFloat(amount),
          currency,
          description: description || `Mavora Payment - ${orderId}`,
          orderId,
          customerId: session.user.id,
          returnUrl: `${baseUrl}/payments/success?order=${orderId}&provider=payoneer`,
          cancelUrl: `${baseUrl}/payments/cancel?order=${orderId}`,
        });

        return NextResponse.json({
          success: true,
          data: {
            sessionId: payment.sessionId,
            redirectUrl: payment.redirectUrl,
            checkoutUrl: payoneer.generateCheckoutUrl(payment.sessionId),
          },
        });
      }

      case 'register_payee': {
        // For sellers wanting to receive payouts via Payoneer
        const { email, firstName, lastName, country = 'MA' } = params;
        
        if (!email) {
          return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
          );
        }

        const result = await payoneer.registerPayee({
          type: 'INDIVIDUAL',
          email,
          first_name: firstName,
          last_name: lastName,
          country,
          currency: 'MAD',
        });

        return NextResponse.json({ success: true, data: result });
      }

      case 'create_payout': {
        // Admin/Seller creates payout request
        const { payeeId, amount, currency = 'MAD', description } = params;
        
        if (!payeeId || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields: payeeId, amount' },
            { status: 400 }
          );
        }

        const payout = await payoneer.createPayout({
          payeeId,
          amount: parseFloat(amount),
          currency,
          description: description || 'Mavora seller payout',
          clientReferenceId: `mavora_${Date.now()}`,
        });

        return NextResponse.json({ success: true, data: payout });
      }

      case 'get_payouts': {
        const { payeeId, status, limit = 20, offset = 0 } = params;
        
        const payouts = await payoneer.listPayouts({
          payeeId,
          status,
          limit,
          offset,
        });

        return NextResponse.json({ success: true, data: payouts });
      }

      case 'get_fees': {
        const { amount, currency = 'MAD', destinationCountry = 'MA' } = params;
        
        if (!amount) {
          return NextResponse.json(
            { error: 'Amount is required' },
            { status: 400 }
          );
        }

        const fees = await payoneer.getPayoutFeesEstimate(
          parseFloat(amount),
          currency,
          destinationCountry
        );

        return NextResponse.json({ success: true, data: fees });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Payoneer API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payoneer operation failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// Payoneer Webhook Handler
// ============================================================

export async function WEBHOOK_POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;

    console.log('[Payoneer Webhook] Received event');

    const payoneer = getProvider();
    
    const { valid, event } = await payoneer.verifyWebhookSignature(headers, body);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const result = await payoneer.processWebhook({
      rawBody: event,
      headers: Object.fromEntries(headers.entries()),
    });

    console.log('[Payoneer Webhook] Processed:', result.status);

    // TODO: Update database based on event type
    // TODO: Send notifications

    return NextResponse.json({ success: true, received: true });

  } catch (error) {
    console.error('[Payoneer Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
