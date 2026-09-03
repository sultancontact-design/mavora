import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return NextResponse.json({ user: null, profile: null });
    }

    const authUser = data.session.user;

    // Fetch the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile) {
      return NextResponse.json({ user: null, profile: null });
    }

    const user: User = {
      id: authUser.id,
      email: authUser.email ?? '',
      display_name: profile.display_name ?? authUser.user_metadata?.display_name ?? '',
      phone: profile.phone ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      bio: profile.bio ?? undefined,
      country_id: profile.country_id ?? undefined,
      city_id: profile.city_id ?? undefined,
      is_verified: profile.is_verified ?? false,
      is_suspended: profile.is_suspended ?? false,
      role: 'user' as const,
      created_at: profile.created_at ?? authUser.created_at,
    };

    return NextResponse.json({ user, profile });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null, profile: null });
  }
}
