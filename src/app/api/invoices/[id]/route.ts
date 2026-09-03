import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { Invoice } from '@/lib/types';

const VALID_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'cancelled'] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

export async function GET(
  _request: NextRequest,
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

    const { id } = await params;

    // Fetch invoice (RLS ensures user owns it)
    const { data: inv, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !inv) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true });

    const invoice: Invoice = {
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
      items: (items ?? []).map((item) => ({
        id: item.id,
        invoice_id: item.invoice_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        sort_order: item.sort_order,
      })),
    };

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('id, invoice_number, status, amount, paid_at')
      .single();

    if (error) {
      console.error('Invoice update error:', error);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
