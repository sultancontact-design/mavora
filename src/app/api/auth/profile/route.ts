import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { updateProfileSchema } from '@/lib/validations/auth';
import type { User } from '@/lib/types';

// ============================================================
// Security Headers
// ============================================================

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

// ============================================================
// Helper: Get authenticated user
// ============================================================

async function getAuthenticatedUser(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: 'common.unauthorized' };
  }
  
  return { user, error: null };
}

// ============================================================
// Helper: Build user object from auth and profile data
// ============================================================

function buildUserObject(authUser: { id: string; email?: string | null; created_at: string; user_metadata?: Record<string, unknown> }, 
                         profile: Record<string, unknown> | null,
                         role?: string): User {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    display_name: (profile?.display_name as string) ?? 
                  (authUser.user_metadata?.display_name as string) ?? '',
    phone: profile?.phone as string | undefined,
    avatar_url: profile?.avatar_url as string | undefined,
    bio: profile?.bio as string | undefined,
    country_id: profile?.country_id as string | undefined,
    city_id: profile?.city_id as string | undefined,
    is_verified: (profile?.is_verified as boolean) ?? false,
    is_suspended: (profile?.is_suspended as boolean) ?? false,
    role: (role as User['role']) ?? 'user',
    created_at: (profile?.created_at as string) ?? authUser.created_at,
  };
}

// ============================================================
// GET /api/auth/profile
// Returns the current user's full profile
// ============================================================

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Authenticate user
    const { user: authUser, error: authError } = await getAuthenticatedUser(supabase);
    
    if (authError || !authUser) {
      const errorResponse = NextResponse.json(
        { error: 'common.unauthorized' },
        { status: 401 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Fetch the user's profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.error('[AUTH] Profile fetch error:', profileError?.message);
      
      const errorResponse = NextResponse.json(
        { error: 'auth.user_not_found' },
        { status: 404 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Build and return user object
    const profileData = profile as Record<string, unknown>;
    const userRoles = profileData.user_roles as Record<string, unknown> | undefined;
    const user = buildUserObject(authUser, profile, userRoles?.role as string | undefined);

    const response = NextResponse.json({
      profile: user,
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Get profile unexpected error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}

// ============================================================
// PATCH /api/auth/profile
// Updates the current user's profile
// ============================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Authenticate user
    const { user: authUser, error: authError } = await getAuthenticatedUser(supabase);
    
    if (authError || !authUser) {
      const errorResponse = NextResponse.json(
        { error: 'common.unauthorized' },
        { status: 401 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: 'common.error' },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Validate input with Zod
    const validationResult = updateProfileSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message ?? 'common.error';
      
      const errorResponse = NextResponse.json(
        { 
          error: firstError,
          details: validationResult.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    const updates = validationResult.data;

    // Sanitize empty strings to null for optional fields
    const sanitizedUpdates: Record<string, unknown> = {};
    
    if (updates.display_name !== undefined) sanitizedUpdates.display_name = updates.display_name;
    if (updates.bio !== undefined) sanitizedUpdates.bio = updates.bio || null;
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone || null;
    if (updates.avatar_url !== undefined) sanitizedUpdates.avatar_url = updates.avatar_url || null;
    if (updates.country_id !== undefined) sanitizedUpdates.country_id = updates.country_id || null;
    if (updates.city_id !== undefined) sanitizedUpdates.city_id = updates.city_id || null;

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', authUser.id)
      .select('*, user_roles(role)')
      .single();

    if (updateError) {
      console.error('[AUTH] Profile update error:', updateError.message);
      
      const errorResponse = NextResponse.json(
        { error: 'common.error', details: updateError.message },
        { status: 400 }
      );
      return setSecurityHeaders(errorResponse);
    }

    // Build and return updated user object
    const updatedProfileData = updatedProfile as Record<string, unknown>;
    const updatedUserRoles = updatedProfileData.user_roles as Record<string, unknown> | undefined;
    const user = buildUserObject(authUser, updatedProfile, updatedUserRoles?.role as string | undefined);

    console.log(`[AUTH] Profile updated for user: ${authUser.id}`);

    const response = NextResponse.json({
      profile: user,
      message: 'auth.profile_updated',
    });

    return setSecurityHeaders(response);

  } catch (error) {
    console.error('[AUTH] Update profile unexpected error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'common.error' },
      { status: 500 }
    );
    return setSecurityHeaders(errorResponse);
  }
}
