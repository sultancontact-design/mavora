import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

type TransactionType = 'credit' | 'debit' | 'freeze' | 'unfreeze' | 'pending';
type ReferenceType = 
  | 'token_purchase' 
  | 'subscription' 
  | 'promotion' 
  | 'refund' 
  | 'withdrawal'
  | 'deposit'
  | 'order'
  | 'adjustment'
  | 'bonus'
  | string;

interface TransactionFilter {
  type?: TransactionType;
  reference_type?: ReferenceType;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const per_page = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));

    // Parse filters
    const filters: TransactionFilter = {
      type: searchParams.get('type') as TransactionType | undefined,
      reference_type: searchParams.get('reference_type') as ReferenceType | undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      min_amount: searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
      max_amount: searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
    };

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

    // Build query with filters
    let query = supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('wallet_id', wallet.id);

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.reference_type) {
      query = query.eq('reference_type', filters.reference_type);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to + 'T23:59:59.999Z');
    }

    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Wallet transactions error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Filter by amount in JavaScript (Supabase doesn't support numeric comparisons well on all types)
    let filteredData = data ?? [];
    
    if (filters.min_amount !== undefined) {
      filteredData = filteredData.filter((tx) => parseFloat(tx.amount) >= filters.min_amount!);
    }
    
    if (filters.max_amount !== undefined) {
      filteredData = filteredData.filter((tx) => parseFloat(tx.amount) <= filters.max_amount!);
    }

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    // Calculate running totals for display
    let runningBalance = 0;
    const transactionsWithRunning = [...filteredData].reverse().map((tx) => {
      runningBalance = parseFloat(tx.balance_after);
      return {
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        balance_after: parseFloat(tx.balance_after),
        description: tx.description,
        reference_type: tx.reference_type,
        reference_id: tx.reference_id,
        created_at: tx.created_at,
        metadata: typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : (tx.metadata ?? {}),
      };
    }).reverse(); // Reverse back to newest first

    return NextResponse.json({
      data: transactionsWithRunning,
      total,
      page,
      per_page,
      total_pages,
      filters: {
        available_types: ['credit', 'debit', 'freeze', 'unfreeze'],
        available_references: ['token_purchase', 'subscription', 'promotion', 'refund', 'withdrawal', 'deposit', 'adjustment', 'bonus'],
      },
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
