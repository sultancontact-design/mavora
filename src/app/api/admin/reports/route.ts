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

    // Fetch pending reports with reporter and target info
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin reports fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // For listing-type reports, fetch listing title
    const listingIds = (data ?? [])
      .filter((r: Record<string, unknown>) => r.target_type === 'listing')
      .map((r: Record<string, unknown>) => r.target_id as string);

    let listingMap: Record<string, { title: string; seller_id: string }> = {};
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, seller_id')
        .in('id', listingIds);

      if (listings) {
        listingMap = Object.fromEntries(
          listings.map((l: Record<string, unknown>) => [
            l.id,
            { title: l.title as string, seller_id: l.seller_id as string },
          ])
        );
      }
    }

    const enriched = (data ?? []).map((report: Record<string, unknown>) => ({
      ...report,
      listing: listingMap[report.target_id as string] ?? null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { report_id, action } = body as {
      report_id?: string;
      action?: string;
    };

    if (!report_id || !action) {
      return NextResponse.json(
        { error: 'report_id and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['resolve', 'dismiss'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be resolve or dismiss' },
        { status: 400 }
      );
    }

    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';

    const { data, error } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq('id', report_id)
      .eq('status', 'pending')
      .select('id, status')
      .single();

    if (error || !data) {
      console.error('Report resolve error:', error);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id, status: data.status, action });
  } catch (error) {
    console.error('Report resolve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
