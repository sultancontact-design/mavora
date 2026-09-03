import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', authUser.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const user: User = {
      id: profile.id,
      email: profile.email ?? authUser.email ?? '',
      display_name: profile.display_name ?? '',
      phone: profile.phone ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      bio: profile.bio ?? undefined,
      country_id: profile.country_id ?? undefined,
      city_id: profile.city_id ?? undefined,
      is_verified: profile.is_verified ?? false,
      is_suspended: profile.is_suspended ?? false,
      role: profile.user_roles?.role ?? 'user',
      created_at: profile.created_at,
    };

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, phone, bio, avatar_url, country_id, city_id } = body;

    // Build the update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (country_id !== undefined) updates.country_id = country_id;
    if (city_id !== undefined) updates.city_id = city_id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authUser.id)
      .select('*, user_roles(role)')
      .single();

    if (error) {
      console.error('Profile update error:', error.message);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 });
    }

    const user: User = {
      id: profile.id,
      email: profile.email ?? authUser.email ?? '',
      display_name: profile.display_name ?? '',
      phone: profile.phone ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      bio: profile.bio ?? undefined,
      country_id: profile.country_id ?? undefined,
      city_id: profile.city_id ?? undefined,
      is_verified: profile.is_verified ?? false,
      is_suspended: profile.is_suspended ?? false,
      role: profile.user_roles?.role ?? 'user',
      created_at: profile.created_at,
    };

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
