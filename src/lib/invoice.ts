import type { InvoiceItem } from './types';
import { getSupabaseServerClient } from './supabase';

/**
 * Generates an invoice number in format: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `INV-${dateStr}-${rand}`;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
}

export interface CreateInvoiceResult {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  amount: number;
  currency_code: string;
  description?: string;
  created_at: string;
}

/**
 * Creates an invoice with line items in a single transaction.
 * Returns the created invoice record or null on failure.
 */
export async function createInvoice(
  userId: string,
  type: 'token_purchase' | 'subscription' | 'promotion',
  items: CreateInvoiceItemInput[],
  description?: string,
  metadata?: Record<string, unknown>,
  currencyCode: string = 'MAD',
  status: 'pending' | 'paid' = 'pending'
): Promise<CreateInvoiceResult | null> {
  const supabase = getSupabaseServerClient();

  // Calculate total amount from items
  const amount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const invoiceNumber = generateInvoiceNumber();

  // Insert invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      type,
      status,
      amount,
      currency_code: currencyCode,
      description,
      metadata: metadata ?? {},
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    })
    .select('id, invoice_number, type, status, amount, currency_code, description, created_at')
    .single();

  if (invError || !invoice) {
    console.error('Invoice create error:', invError);
    return null;
  }

  // Insert items
  const itemRows = items.map((item, idx) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    sort_order: item.sort_order ?? idx,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemRows);

  if (itemsError) {
    console.error('Invoice items create error:', itemsError);
    // Clean up the invoice if items fail
    await supabase.from('invoices').delete().eq('id', invoice.id);
    return null;
  }

  return invoice;
}
