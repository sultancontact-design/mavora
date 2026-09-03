import { NextRequest, NextResponse } from 'next/server';
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

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Subscription fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const sub = data[0];
    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        starts_at: sub.starts_at,
        expires_at: sub.expires_at,
        auto_renew: sub.auto_renew,
        plan: sub.plan
          ? {
              id: sub.plan.id,
              name: sub.plan.name,
              name_ar: sub.plan.name_ar,
              name_fr: sub.plan.name_fr,
              name_en: sub.plan.name_en,
              listing_limit: sub.plan.listing_limit,
              featured_limit: sub.plan.featured_limit,
              max_images_per_listing: sub.plan.max_images_per_listing,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
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
    const { plan_id } = body as { plan_id?: string };

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Ensure wallet exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!existingWallet) {
      await supabase.from('wallets').insert({ user_id: session.user.id });
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('isActive', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Deactivate any existing active subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    // Calculate expiry (1 month from now)
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        plan_id,
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
      })
      .select('*, plan:plans(*)')
      .single();

    if (subError) {
      console.error('Subscription create error:', subError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        starts_at: subscription.starts_at,
        expires_at: subscription.expires_at,
        auto_renew: subscription.auto_renew,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          name_ar: subscription.plan.name_ar,
          name_fr: subscription.plan.name_fr,
          name_en: subscription.plan.name_en,
          listing_limit: subscription.plan.listing_limit,
          featured_limit: subscription.plan.featured_limit,
          max_images_per_listing: subscription.plan.max_images_per_listing,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Subscription create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
