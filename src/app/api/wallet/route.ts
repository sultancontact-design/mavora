import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get existing wallet
    let { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No wallet found — create one
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert({ user_id: session.user.id })
        .select()
        .single();

      if (insertError) {
        console.error('Wallet create error:', insertError);
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }

      wallet = newWallet;
    } else if (error) {
      console.error('Wallet fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }

    // Get transaction count
    const { count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', wallet.id);

    return NextResponse.json({
      id: wallet.id,
      balance: parseFloat(wallet.balance),
      currency_code: wallet.currency_code,
      transaction_count: count ?? 0,
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
