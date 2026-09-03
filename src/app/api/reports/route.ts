import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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
    const { target_type, target_id, reason, description } = body as {
      target_type?: string;
      target_id?: string;
      reason?: string;
      description?: string;
    };

    if (!target_type || !target_id || !reason) {
      return NextResponse.json(
        { error: 'target_type, target_id, and reason are required' },
        { status: 400 }
      );
    }

    const validTargets = ['listing', 'profile', 'review'];
    if (!validTargets.includes(target_type)) {
      return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 });
    }

    const validReasons = ['scam', 'prohibited', 'duplicate', 'wrong_category', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: session.user.id,
        target_type,
        target_id,
        reason,
        description: description?.trim() ?? null,
      })
      .select('id')
      .single();

    if (error) {
      // Handle duplicate report (unique constraint on reporter_id + target_type + target_id)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already reported' },
          { status: 409 }
        );
      }
      console.error('Report create error:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error('Report create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('reporter_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Reports fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / per_page));

    return NextResponse.json({
      data: data ?? [],
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
