import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { createInvoice } from '@/lib/invoice';

const PROMO_TOKEN_COSTS: Record<string, number> = {
  featured: 10,
  urgent: 5,
  bump: 3,
  top: 15,
};

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

    const userId = session.user.id;
    const body = await request.json();
    const { listing_id, type, duration_days } = body as {
      listing_id?: string;
      type?: string;
      duration_days?: number;
    };

    if (!listing_id || !type || !duration_days) {
      return NextResponse.json(
        { error: 'listing_id, type, and duration_days are required' },
        { status: 400 }
      );
    }

    const validTypes = ['featured', 'urgent', 'bump', 'top'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid promotion type' }, { status: 400 });
    }

    if (duration_days < 1 || duration_days > 30) {
      return NextResponse.json(
        { error: 'duration_days must be between 1 and 30' },
        { status: 400 }
      );
    }

    const tokensCost = PROMO_TOKEN_COSTS[type] ?? 5;

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not own this listing' },
        { status: 403 }
      );
    }

    // Get wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < tokensCost) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    const startsAt = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + duration_days * 24 * 60 * 60 * 1000
    ).toISOString();

    // Deduct tokens from wallet
    const newBalance = currentBalance - tokensCost;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance.toString() })
      .eq('id', wallet.id);

    if (updateWalletError) {
      console.error('Wallet update error:', updateWalletError);
      return NextResponse.json(
        { error: 'Failed to deduct tokens' },
        { status: 500 }
      );
    }

    // Create wallet transaction
    const { error: txError } = await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'debit',
      amount: tokensCost,
      description: `Promotion: ${type} for listing`,
      metadata: { listing_id, promo_type: type, duration_days },
    });

    if (txError) {
      console.error('Wallet transaction error:', txError);
      // Try to refund
      await supabase
        .from('wallets')
        .update({ balance: currentBalance.toString() })
        .eq('id', wallet.id);
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    // Create promotion
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .insert({
        listing_id,
        type,
        starts_at: startsAt,
        expires_at: expiresAt,
        tokens_used: tokensCost,
      })
      .select('*')
      .single();

    if (promoError) {
      console.error('Promotion create error:', promoError);
      // Refund
      await supabase
        .from('wallets')
        .update({ balance: currentBalance.toString() })
        .eq('id', wallet.id);
      return NextResponse.json(
        { error: 'Failed to create promotion' },
        { status: 500 }
      );
    }

    // Update listing flags based on promotion type
    const updateData: Record<string, boolean> = {};
    if (type === 'featured') updateData.is_featured = true;
    if (type === 'urgent') updateData.is_urgent = true;
    if (type === 'bump') updateData.published_at = new Date().toISOString();
    if (type === 'top' || type === 'bump') {
      updateData.is_featured = true;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing_id);
    }

    // Create invoice for the promotion
    await createInvoice(
      userId,
      'promotion',
      [
        {
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} promotion - ${duration_days} days`,
          quantity: 1,
          unit_price: tokensCost,
        },
      ],
      `Listing promotion: ${type} for ${duration_days} days`,
      { listing_id, promo_type: type, duration_days, promotion_id: promotion.id },
      'MAD',
      'paid'
    );

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Promotions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get('listing_id');

    if (!listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('listing_id', listing_id)
      .eq('isActive', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Promotions fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Promotions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
