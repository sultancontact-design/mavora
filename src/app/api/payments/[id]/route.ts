import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getActiveProvider } from '@/lib/payments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paymentId } = await params;
    const userId = session.user.id;

    // Fetch payment with order verification
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        order:orders(id, user_id)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify the payment belongs to this user (via order)
    const order = payment.order as { id: string; user_id: string } | null;
    if (!order || order.user_id !== userId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get status from provider if not in final state
    let providerStatus = null;
    if (!['paid', 'failed', 'refunded', 'cancelled'].includes(payment.status)) {
      try {
        const provider = getActiveProvider();
        const result = await provider.getPaymentStatus(payment.provider_payment_id);
        if (result.success) {
          providerStatus = result.status;
        }
      } catch (providerError) {
        console.error('Provider status check error:', providerError);
        // Continue with stored status
      }
    }

    // Get payment events
    const { data: events } = await supabase
      .from('payment_events')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      id: payment.id,
      order_id: payment.order_id,
      amount: parseFloat(payment.amount),
      currency_code: payment.currency_code,
      status: providerStatus || payment.status,
      provider: payment.provider,
      provider_payment_id: payment.provider_payment_id,
      error_message: payment.error_message,
      metadata: typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : (payment.metadata ?? {}),
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      paid_at: payment.paid_at,
      events: (events ?? []).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        data: typeof e.data === 'string' ? JSON.parse(e.data) : (e.data ?? {}),
        created_at: e.created_at,
      })),
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
