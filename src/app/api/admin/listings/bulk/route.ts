import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Valid bulk actions
const VALID_ACTIONS = ['approve', 'reject', 'archive', 'delete', 'feature', 'unfeature'];

interface BulkOperationBody {
  listing_ids: string[];
  action: string;
  reason?: string;
  note?: string;
}

// POST /api/admin/listings/bulk - Bulk operations on listings
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
    const body: BulkOperationBody = await request.json();

    if (!body.listing_ids || !Array.isArray(body.listing_ids) || body.listing_ids.length === 0) {
      return NextResponse.json(
        { error: 'listing_ids is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!body.action || !VALID_ACTIONS.includes(body.action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Limit batch size
    if (body.listing_ids.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 listings per batch operation' },
        { status: 400 }
      );
    }

    // Map action to status/value
    const actionMap: Record<string, { status?: string; is_featured?: boolean; deleted?: boolean }> = {
      approve: { status: 'active' },
      reject: { status: 'rejected' },
      archive: { status: 'archived' },
      delete: { deleted: true },
      feature: { is_featured: true },
      unfeature: { is_featured: false },
    };

    const operation = actionMap[body.action];
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // Process each listing
    for (const listingId of body.listing_ids) {
      try {
        const updateData: Record<string, unknown> = {};

        if (operation.status !== undefined) {
          updateData.status = operation.status;
          if (body.action === 'approve') {
            updateData.published_at = new Date().toISOString();
          }
          if (body.action === 'reject' && body.reason) {
            updateData.rejection_reason = body.reason;
          }
        }

        if (operation.is_featured !== undefined) {
          updateData.is_featured = operation.is_featured;
          if (body.action === 'feature') {
            updateData.featured_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
          } else {
            updateData.featured_until = null;
          }
        }

        if (operation.deleted) {
          // Soft delete
          updateData.deleted_at = new Date().toISOString();
          updateData.status = 'archived';
        }

        const { error } = await adminClient
          .from('listings')
          .update(updateData)
          .eq('id', listingId);

        if (error) {
          results.failed++;
          results.errors.push(`${listingId}: ${error.message}`);
        } else {
          results.success++;
        }

        // Log the activity
        await adminClient.from('audit_logs').insert({
          user_id: session.user.id,
          action: `listing.${body.action}`,
          entity_type: 'listing',
          entity_id: listingId,
          details: {
            bulk_operation: true,
            reason: body.reason ?? null,
            note: body.note ?? null,
          },
          ip_address: request.headers.get('x-forwarded-for') ?? 'unknown',
        }).ignore(); // Don't fail if logging fails

      } catch (err) {
        results.failed++;
        results.errors.push(`${listingId}: ${(err as Error).message}`);
      }
    }

    // Return summary
    return NextResponse.json({
      message: `Bulk ${body.action} completed`,
      action: body.action,
      total_processed: body.listing_ids.length,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/listings/bulk - Get available bulk actions info
export async function GET() {
  return NextResponse.json({
    available_actions: VALID_ACTIONS.map(action => ({
      value: action,
      label: action.charAt(0).toUpperCase() + action.slice(1),
      description: getActionDescription(action),
    })),
    max_batch_size: 50,
    requires_confirmation: ['reject', 'delete'],
  });
}

function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    approve: 'Approve and publish listings',
    reject: 'Reject listings with optional reason',
    archive: 'Archive listings from public view',
    delete: 'Soft delete listings',
    feature: 'Feature listings for 7 days',
    unfeature: 'Remove featured status',
  };
  return descriptions[action] || action;
}
