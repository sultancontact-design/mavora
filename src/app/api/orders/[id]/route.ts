import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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

    const { id: orderId } = await params;
    const userId = session.user.id;

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    // Get payment info
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    // Get payment events if payment exists
    let paymentEvents = [];
    if (payment) {
      const { data: events } = await supabase
        .from('payment_events')
        .select('*')
        .eq('payment_id', payment.id)
        .order('created_at', { ascending: false });
      paymentEvents = events ?? [];
    }

    return NextResponse.json({
      id: order.id,
      user_id: order.user_id,
      order_number: order.order_number,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      tax_amount: parseFloat(order.tax_amount),
      discount_amount: parseFloat(order.discount_amount),
      total_amount: parseFloat(order.total_amount),
      currency_code: order.currency_code,
      metadata: typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata ?? {}),
      created_at: order.created_at,
      updated_at: order.updated_at,
      paid_at: order.paid_at,
      cancelled_at: order.cancelled_at,
      items: (items ?? []).map((item) => ({
        id: item.id,
        order_id: item.order_id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        reference_id: item.reference_id,
        metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata ?? {}),
      })),
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            provider: payment.provider,
            provider_payment_id: payment.provider_payment_id,
            amount: parseFloat(payment.amount),
            currency_code: payment.currency_code,
            error_message: payment.error_message,
            created_at: payment.created_at,
            paid_at: payment.paid_at,
            events: paymentEvents.map((e) => ({
              id: e.id,
              event_type: e.event_type,
              data: typeof e.data === 'string' ? JSON.parse(e.data) : (e.data ?? {}),
              created_at: e.created_at,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const { id: orderId } = await params;
    const userId = session.user.id;

    // Verify ownership
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow cancelling pending orders
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'cancel') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Order cancel error:', updateError);
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action. Supported actions: cancel' }, { status: 400 });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
