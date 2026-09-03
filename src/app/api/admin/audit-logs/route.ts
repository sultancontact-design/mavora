import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)));
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resource_type') || undefined;

    let query = supabase
      .from('audit_logs')
      .select('*, actor:profiles(display_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (action) {
      query = query.eq('action', action);
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, resourceType, resourceId, details, actorId } = body;

    if (!action || !resourceType) {
      return NextResponse.json(
        { error: 'action and resourceType are required' },
        { status: 400 }
      );
    }

    await logAudit({
      action,
      resourceType,
      resourceId,
      details,
      actorId,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to log audit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
