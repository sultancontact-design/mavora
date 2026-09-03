import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)));

    // Get wallet first
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ data: [], total: 0, page, per_page, total_pages: 1 });
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Wallet transactions error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    return NextResponse.json({
      data: (data ?? []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balance_after: parseFloat(tx.balance_after),
        description: tx.description,
        reference_type: tx.reference_type,
        reference_id: tx.reference_id,
        created_at: tx.created_at,
      })),
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
