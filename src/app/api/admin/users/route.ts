import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Use secure admin client from lib (reads from environment variables)
const supabase = getSupabaseAdminClient();

// GET /api/admin/users - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Filters
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('users')
      .select(`
        *,
        profiles!inner(
          id,
          display_name,
          avatar_url,
          phone,
          is_verified,
          is_suspended,
          role,
          created_at
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('profiles.role', role);
    }

    // Apply status filter
    if (status === 'suspended') {
      query = query.eq('profiles.is_suspended', true);
    } else if (status === 'verified') {
      query = query.eq('profiles.is_verified', true);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'email', 'name', 'last_login_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Execute with pagination
    const { data: users, error, count } = await query.range(from, to);

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user stats
    const [totalRes, verifiedRes, suspendedRes, todayRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('createdAt', new Date().toISOString().split('T')[0]),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
      stats: {
        total: totalRes.count || 0,
        verified: verifiedRes.count || 0,
        suspended: suspendedRes.count || 0,
        new_today: todayRes.count || 0,
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ...data } = body;

    switch (action) {
      case 'suspend_user':
        return await suspendUser(userId, data.reason);
      
      case 'unsuspend_user':
        return await unsuspendUser(userId);
      
      case 'verify_user':
        return await verifyUser(userId);
      
      case 'unverify_user':
        return await unverifyUser(userId);
      
      case 'change_role':
        return await changeRole(userId, data.role);
      
      case 'delete_user':
        return await deleteUser(userId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

// Action functions
async function suspendUser(userId: string, reason?: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_suspended: true, 
      suspended_at: new Date().toISOString(),
      suspension_reason: reason || 'مخالفة شروط الاستخدام'
    })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the action
  await logAuditAction('user_suspend', userId, { reason });

  return NextResponse.json({ success: true, message: 'تم تعليق المستخدم بنجاح' });
}

async function unsuspendUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_suspended: false, 
      suspended_at: null,
      suspension_reason: null
    })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('user_unsuspend', userId);

  return NextResponse.json({ success: true, message: 'تم رفع التعليق عن المستخدم' });
}

async function verifyUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: true })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('user_verify', userId);

  return NextResponse.json({ success: true, message: 'تم تفعيل حساب المستخدم' });
}

async function unverifyUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: false })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('user_unverify', userId);

  return NextResponse.json({ success: true, message: 'تم إلغاء تفعيل الحساب' });
}

async function changeRole(userId: string, newRole: string) {
  const validRoles = ['user', 'verified_user', 'professional_seller', 'moderator', 'admin', 'super_admin'];
  
  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: 'دور غير صالح' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('role_change', userId, { new_role: newRole });

  return NextResponse.json({ success: true, message: 'تم تغيير الدور بنجاح' });
}

async function deleteUser(userId: string) {
  // Soft delete - just mark as deleted/suspended
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_suspended: true, 
      suspension_reason: 'حذف الحساب'
    })
    .eq('userId', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('user_delete', userId);

  return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
}

// Audit logging helper
async function logAuditAction(action: string, targetId: string, details?: Record<string, unknown>) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      target_type: 'user',
      target_id: targetId,
      details: details || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
