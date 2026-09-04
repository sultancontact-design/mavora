import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { Invoice, PaginatedResponse } from '@/lib/types';

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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10));
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Invoices fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Get items for all invoices
    const invoiceIds = (data ?? []).map((inv) => inv.id);
    let itemsMap: Record<string, Invoice['items']> = {};

    if (invoiceIds.length > 0) {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('sort_order', { ascending: true });

      if (items) {
        for (const item of items) {
          if (!itemsMap[item.invoice_id]) {
            itemsMap[item.invoice_id] = [];
          }
          itemsMap[item.invoice_id]!.push({
            id: item.id,
            invoice_id: item.invoice_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price),
            sort_order: item.sort_order,
          });
        }
      }
    }

    const invoices: Invoice[] = (data ?? []).map((inv) => ({
      id: inv.id,
      user_id: inv.user_id,
      invoice_number: inv.invoice_number,
      type: inv.type,
      status: inv.status,
      amount: parseFloat(inv.amount),
      currency_code: inv.currency_code,
      description: inv.description,
      metadata: inv.metadata,
      paid_at: inv.paid_at,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      items: itemsMap[inv.id],
    }));

    const total = count ?? 0;
    const result: PaginatedResponse<Invoice> = {
      data: invoices,
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
