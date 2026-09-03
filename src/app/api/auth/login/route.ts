import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const status = error.status ?? 401;
      let message = error.message;

      if (
        error.message.includes('Invalid') ||
        error.message.includes('invalid') ||
        error.message.includes('credentials')
      ) {
        message = 'auth.invalid_credentials';
      } else if (
        error.message.includes('Email not confirmed')
      ) {
        message = 'auth.email_not_confirmed';
      }

      return NextResponse.json({ error: message }, { status });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 401 }
      );
    }

    // Fetch the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      display_name: profile?.display_name ?? data.user.user_metadata?.display_name ?? '',
      phone: profile?.phone ?? undefined,
      avatar_url: profile?.avatar_url ?? undefined,
      bio: profile?.bio ?? undefined,
      country_id: profile?.country_id ?? undefined,
      city_id: profile?.city_id ?? undefined,
      is_verified: profile?.is_verified ?? false,
      is_suspended: profile?.is_suspended ?? false,
      role: profile?.user_roles?.role ?? 'user',
      created_at: profile?.created_at ?? data.user.created_at,
    };

    return NextResponse.json({
      user,
      profile,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
