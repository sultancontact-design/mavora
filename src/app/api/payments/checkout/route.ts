import { NextRequest, NextResponse } from 'next/server';
import { stripeProvider } from '@/lib/payments/stripe';
import { moroccoProvider } from '@/lib/payments/morocco';
import { registerProvider, getActiveProviderName, getActiveProvider } from '@/lib/payments';
import type { CreateCheckoutParams } from '@/lib/types';

// Register providers on module load
registerProvider('stripe', stripeProvider);
registerProvider('morocco', moroccoProvider);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateCheckoutParams>;
    const { amount, currency, description, metadata, returnUrl, cancelUrl, customerId } = body;

    if (!amount || !currency || !description || !returnUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, description, returnUrl, cancelUrl' },
        { status: 400 }
      );
    }

    const providerName = getActiveProviderName();
    const provider = getActiveProvider();

    const result = await provider.createCheckout({
      amount,
      currency,
      description,
      metadata: metadata || {},
      returnUrl,
      cancelUrl,
      customerId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, provider: providerName },
        { status: 503 }
      );
    }

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
      provider: providerName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
