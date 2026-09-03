import { NextRequest, NextResponse } from 'next/server';
import { moroccoProvider } from '@/lib/payments/morocco';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await moroccoProvider.handleWebhook(body, headers);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ received: true, eventType: result.eventType });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
