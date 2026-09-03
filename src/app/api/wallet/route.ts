import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

interface WalletSummary {
  id: string;
  balance: number;
  frozen_balance: number;
  available_balance: number;
  currency_code: string;
  transaction_count: number;
  created_at: string;
}

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
    const { count: totalCount } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', wallet.id);

    // Calculate frozen balance (from pending orders/payments)
    const { data: frozenTransactions } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('wallet_id', wallet.id)
      .eq('type', 'freeze');

    const frozenBalance = (frozenTransactions ?? []).reduce(
      (sum, tx) => sum + Math.abs(parseFloat(tx.amount)),
      0
    );

    const balance = parseFloat(wallet.balance);
    const summary: WalletSummary = {
      id: wallet.id,
      balance,
      frozen_balance: frozenBalance,
      available_balance: balance - frozenBalance,
      currency_code: wallet.currency_code || 'MAD',
      transaction_count: totalCount ?? 0,
      created_at: wallet.created_at,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet - Internal use for crediting/debiting wallet
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

    // This endpoint should only be used internally or by admin
    // For now, we'll allow users to withdraw to their bank account
    const body = await request.json();
    const { action, amount, description } = body as {
      action?: string;
      amount?: number;
      description?: string;
    };

    if (action === 'withdraw') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
      }

      if (amount < 10) {
        return NextResponse.json({ error: 'Minimum withdrawal is 10 MAD' }, { status: 400 });
      }

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      const currentBalance = parseFloat(wallet.balance);

      // Check frozen balance
      const { data: frozenTxs } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', wallet.id)
        .eq('type', 'freeze');

      const frozenBalance = (frozenTxs ?? []).reduce(
        (sum, tx) => sum + Math.abs(parseFloat(tx.amount)),
        0
      );

      const availableBalance = currentBalance - frozenBalance;

      if (amount > availableBalance) {
        return NextResponse.json(
          { 
            error: 'Insufficient funds',
            available: availableBalance,
            requested: amount,
          },
          { status: 400 }
        );
      }

      // Create withdrawal request (would need approval in production)
      const newBalance = currentBalance - amount;

      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance.toString() })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('Wallet update error:', updateError);
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
      }

      // Record the transaction
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type: 'debit',
        amount: amount.toFixed(2),
        balance_after: newBalance.toFixed(2),
        reference_type: 'withdrawal',
        description: description || `Withdrawal request: ${amount} ${wallet.currency_code || 'MAD'}`,
      });

      if (txError) {
        console.error('Transaction recording error:', txError);
        // Transaction recorded but wallet updated - log for reconciliation
      }

      return NextResponse.json({
        success: true,
        new_balance: newBalance,
        transaction_type: 'withdrawal',
        message: 'Withdrawal request submitted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: withdraw' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Wallet action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
