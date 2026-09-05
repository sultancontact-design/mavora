import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Use secure admin client from lib (reads from environment variables)
const supabase = getSupabaseAdminClient();

// GET /api/admin/listings - List all listings with filters
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
    const status = searchParams.get('status') || '';
    const category_id = searchParams.get('category_id') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(id, name, nameAr, slug),
        seller:profiles!listings_userId_fkey(display_name, avatar_url, is_verified)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply category filter
    if (category_id) {
      query = query.eq('categoryId', category_id);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'title', 'price', 'viewCount'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Execute with pagination
    const { data: listings, error, count } = await query.range(from, to);

    if (error) {
      console.error('Listings fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get listing stats
    const [totalRes, activeRes, pendingRes, todayRes] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .gte('createdAt', new Date().toISOString().split('T')[0]),
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
      stats: {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        pending: pendingRes.count || 0,
        new_today: todayRes.count || 0,
      },
    });
  } catch (error) {
    console.error('Admin listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/listings - Moderate listings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, listingId, ...data } = body;

    switch (action) {
      case 'approve':
        return await approveListing(listingId);
      
      case 'reject':
        return await rejectListing(listingId, data.reason);
      
      case 'archive':
        return await archiveListing(listingId);
      
      case 'feature':
        return await featureListing(listingId, data.days);
      
      case 'delete':
        return await deleteListing(listingId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin listing action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

// Action functions
async function approveListing(listingId: string) {
  const { error } = await supabase
    .from('listings')
    .update({ 
      status: 'active',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .eq('id', listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('listing_approve', listingId);

  return NextResponse.json({ success: true, message: 'تم قبول الإعلان' });
}

async function rejectListing(listingId: string, reason?: string) {
  const { error } = await supabase
    .from('listings')
    .update({ 
      status: 'rejected',
      rejectionReason: reason || 'لا يلتقي بشروط المنصة',
      updatedAt: new Date().toISOString()
    })
    .eq('id', listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('listing_reject', listingId, { reason });

  return NextResponse.json({ success: true, message: 'تم رفض الإعلان' });
}

async function archiveListing(listingId: string) {
  const { error } = await supabase
    .from('listings')
    .update({ 
      status: 'archived',
      updatedAt: new Date().toISOString()
    })
    .eq('id', listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('listing_archive', listingId);

  return NextResponse.json({ success: true, message: 'تم أرشفة الإعلان' });
}

async function featureListing(listingId: string, days: number = 7) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  const { error } = await supabase
    .from('listings')
    .update({ 
      featuredUntil: featuredUntil.toISOString(),
      updatedAt: new Date().toISOString()
    })
    .eq('id', listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('listing_feature', listingId, { days });

  return NextResponse.json({ success: true, message: `تم تمييز الإعلان لمدة ${days} يوم` });
}

async function deleteListing(listingId: string) {
  // First delete associated media
  await supabase.from('listing_media').delete().eq('listingId', listingId);
  
  // Then delete the listing
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction('listing_delete', listingId);

  return NextResponse.json({ success: true, message: 'تم حذف الإعلان' });
}

// Audit logging helper
async function logAuditAction(action: string, targetId: string, details?: Record<string, unknown>) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      target_type: 'listing',
      target_id: targetId,
      details: details || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
