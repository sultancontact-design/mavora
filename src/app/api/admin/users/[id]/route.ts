import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Valid roles
const VALID_ROLES = ['user', 'verified_user', 'professional_seller', 'moderator', 'support_agent', 'finance_manager', 'content_manager', 'analyst', 'admin'];

interface UpdateUserBody {
  role?: string;
  is_suspended?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  is_verified?: string;
}

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['admin', 'super_admin'].includes(adminProfile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Fetch user profile with related data
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's listings count
    const { count: listingCount } = await adminClient
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq(['userId'], userId);

    // Get user's reports (as reporter)
    const { data: reportsMade } = await adminClient
      .from('reports')
      .select('id, status, created_at')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get reports against user
    const { data: reportsAgainst } = await adminClient
      .from('reports')
      .select('id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(display_name)')
      .eq('target_type', 'user')
      .eq('target_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent listings
    const { data: recentListings } = await adminClient
      .from('listings')
      .select('id, title, status, view_count, created_at')
      .eq(['userId'], userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        ...profile,
        listing_count: listingCount ?? 0,
        reports_made: reportsMade ?? [],
        reports_against: reportsAgainst ?? [],
        recent_listings: recentListings ?? [],
      }
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check admin role - only super_admin can change roles to admin
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const adminRole = adminProfile?.role ?? '';
    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const body: UpdateUserBody = await request.json();

    // Validate input
    const updateData: Record<string, unknown> = {};

    // Role changes - only super_admin can assign admin roles
    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      
      // Prevent non-super_admin from assigning admin roles
      if ((body.role === 'admin' || body.role === 'super_admin') && adminRole !== 'super_admin') {
        return NextResponse.json({ error: 'Only super_admin can assign admin roles' }, { status: 403 });
      }
      
      // Prevent modifying super_admin unless you are super_admin
      if (adminRole !== 'super_admin') {
        const { data: targetUser } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (targetUser?.role === 'super_admin') {
          return NextResponse.json({ error: 'Cannot modify super_admin' }, { status: 403 });
        }
      }
      
      updateData.role = body.role;
    }

    // Suspension
    if (body.is_suspended !== undefined) {
      updateData.is_suspended = body.is_suspended;
    }

    // Ban/Unban
    if (body.is_banned !== undefined) {
      updateData.is_banned = body.is_banned;
      updateData.ban_reason = body.ban_reason || null;
      updateData.banned_at = body.is_banned ? new Date().toISOString() : null;
    }

    // Verification
    if (body.is_verified !== undefined) {
      updateData.is_verified = body.is_verified;
    }

    // Perform update
    const { data, error } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, display_name, role, is_suspended, is_banned, is_verified')
      .single();

    if (error) {
      console.error('Admin user update error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
