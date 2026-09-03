import { getSupabaseServerClient } from './supabase';

export async function logAudit(params: {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  actorId?: string;
  request?: Request;
}) {
  try {
    const supabase = getSupabaseServerClient();

    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (params.request) {
      const forwarded = params.request.headers.get('x-forwarded-for');
      ipAddress = forwarded ? forwarded.split(',')[0].trim() : params.request.headers.get('x-real-ip') || null;
      userAgent = params.request.headers.get('user-agent') || null;
    }

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: params.actorId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || {},
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });

    if (error) {
      console.error('Audit log insert failed:', error.message);
    }
  } catch (err) {
    // Audit logging should never throw — fail silently
    console.error('Audit log error:', err);
  }
}
