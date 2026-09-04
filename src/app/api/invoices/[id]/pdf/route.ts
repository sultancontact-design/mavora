import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

type StatusLabel = {
  [key: string]: string;
};

type TypeLabel = {
  [key: string]: string;
};

const STATUS_LABELS: StatusLabel = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: TypeLabel = {
  token_purchase: 'Token Purchase',
  subscription: 'Subscription',
  promotion: 'Listing Promotion',
};

function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat('en-MA', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

    const invoiceItems = items ?? [];
    const amount = parseFloat(inv.amount);
    const statusLabel = STATUS_LABELS[inv.status] ?? inv.status;
    const typeLabel = TYPE_LABELS[inv.type] ?? inv.type;

    const itemsRows = invoiceItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
            ${escapeHtml(item.description)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px;">
            ${formatCurrency(parseFloat(item.unit_price), inv.currency_code)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; font-weight: 600;">
            ${formatCurrency(parseFloat(item.total_price), inv.currency_code)}
          </td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(inv.invoice_number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 40px 16px; }
    .container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #102A43; color: #fff; padding: 32px; }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { font-size: 14px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-label { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 4px; }
    .info-value { font-size: 15px; font-weight: 600; color: #102A43; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-refunded { background: #e0e7ff; color: #3730a3; }
    .status-cancelled { background: #f3f4f6; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    thead th:last-child { text-align: right; }
    .total-row { display: flex; justify-content: flex-end; padding: 16px 0; border-top: 2px solid #102A43; }
    .total-amount { font-size: 24px; font-weight: 700; color: #102A43; }
    .footer { padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MAVORA</h1>
      <p>Your trusted online marketplace</p>
    </div>
    <div class="body">
      <div class="info-grid">
        <div>
          <div class="info-label">Invoice Number</div>
          <div class="info-value">${escapeHtml(inv.invoice_number)}</div>
        </div>
        <div>
          <div class="info-label">Date</div>
          <div class="info-value">${formatDate(inv.created_at)}</div>
        </div>
        <div>
          <div class="info-label">Type</div>
          <div class="info-value">${escapeHtml(typeLabel)}</div>
        </div>
        <div>
          <div class="info-label">Status</div>
          <div class="info-value"><span class="status-badge status-${escapeHtml(inv.status)}">${escapeHtml(statusLabel)}</span></div>
        </div>
      </div>
      ${inv.description ? `<p style="margin-bottom: 24px; color: #374151; font-size: 14px;">${escapeHtml(inv.description)}</p>` : ''}
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <div class="total-row">
        <div>
          <div class="info-label">Total</div>
          <div class="total-amount">${formatCurrency(amount, inv.currency_code)}</div>
        </div>
      </div>
      ${inv.paid_at ? `<p style="text-align: right; font-size: 13px; color: #6b7280;">Paid on ${formatDate(inv.paid_at)}</p>` : ''}
    </div>
    <div class="footer">
      MAVORA Marketplace &mdash; Invoice generated automatically. For support, contact support@mavora.ma
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${inv.invoice_number}.html"`,
      },
    });
  } catch (error) {
    console.error('Invoice PDF error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
