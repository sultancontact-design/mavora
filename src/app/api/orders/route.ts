import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PaginatedResponse } from '@/lib/types';

interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  items?: OrderItem[];
  payment?: {
    id: string;
    status: string;
    provider: string;
    amount: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));
    const status = searchParams.get('status');

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    // Build query
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && ['pending', 'processing', 'completed', 'cancelled', 'refunded'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Fetch items and payment info for each order
    const ordersWithDetails: Order[] = [];
    
    for (const order of orders ?? []) {
      // Get order items
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Get payment info
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, provider, amount')
        .eq('order_id', order.id)
        .maybeSingle();

      ordersWithDetails.push({
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
              amount: parseFloat(payment.amount),
            }
          : undefined,
      });
    }

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    const response: PaginatedResponse<Order> = {
      data: ordersWithDetails,
      total,
      page,
      per_page,
      total_pages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, currency_code = 'MAD', metadata = {} } = body as {
      items: Array<{
        item_type: string;
        description: string;
        quantity: number;
        unit_price: number;
        reference_id?: string;
        metadata?: Record<string, unknown>;
      }>;
      currency_code?: string;
      metadata?: Record<string, unknown>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_type || !item.description || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { error: `Invalid item at index ${i}: item_type, description, quantity, and unit_price are required` },
          { status: 400 }
        );
      }
      if (item.quantity <= 0 || item.unit_price <= 0) {
        return NextResponse.json(
          { error: `Invalid item at index ${i}: quantity and unit_price must be positive` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = 0; // TODO: Calculate tax based on location/settings
    const discountAmount = 0; // TODO: Apply discounts if any
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency_code,
        metadata,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      reference_id: item.reference_id ?? null,
      metadata: item.metadata ?? null,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Clean up the order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: order.id,
        order_number: orderNumber,
        status: 'pending',
        total_amount: totalAmount,
        currency_code,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
