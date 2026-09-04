import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Valid actions that can be logged
const VALID_ACTIONS = [
  // User actions
  'user.role_changed',
  'user.suspended',
  'user.unsuspended',
  'user.banned',
  'user.unbanned',
  'user.verified',
  'user.unverified',
  // Listing actions
  'listing.approved',
  'listing.rejected',
  'listing.archived',
  'listing.featured',
  'listing.unfeatured',
  // Report actions
  'report.resolved',
  'report.dismissed',
  // Category actions
  'category.created',
  'category.updated',
  'category.deleted',
  // Settings actions
  'setting.updated',
  // Payment actions
  'payment.refunded',
  'payment.flagged',
];

// Valid entity types
const VALID_ENTITY_TYPES = ['user', 'listing', 'report', 'category', 'setting', 'payment', 'order'];

interface ActivityLogBody {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// POST /api/admin/activity - Log admin activity
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role ?? 'user';
    if (!['admin', 'super_admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate body
    const body: ActivityLogBody = await request.json();

    if (!body.action || !body.entity_type) {
      return NextResponse.json(
        { error: 'action and entity_type are required' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(body.action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_ENTITY_TYPES.includes(body.entity_type)) {
      return NextResponse.json(
        { error: `Invalid entity_type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') ?? 
                      request.headers.get('x-real-ip') ?? 
                      body.ip_address ??
                      'unknown';
    
    const userAgent = request.headers.get('user-agent') ?? 
                      body.user_agent ??
                      null;

    // Create audit log entry
    const { data, error } = await adminClient
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: body.action,
        entity_type: body.entity_type,
        entity_id: body.entity_id ?? null,
        details: body.details ?? {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Activity log creation error:', error);
      // Don't fail the request if logging fails, just warn
      console.warn('Failed to create activity log:', error.message);
    }

    return NextResponse.json({
      success: true,
      log_id: data?.id,
      message: 'Activity logged successfully',
    });

  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/activity - Get admin activity logs
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const adminClient = getSupabaseAdminClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role ?? 'user';
    if (!['admin', 'super_admin', 'moderator'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const userId = searchParams.get('user_id');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '50', 10)));
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = adminClient
      .from('audit_logs')
      .select(`
        *,
        user:profiles!audit_logs_user_id_fkey(display_name, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Activity logs fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });

  } catch (error) {
    console.error('Activity logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
