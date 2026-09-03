import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, display_name } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name },
      },
    });

    if (error) {
      const status = error.status ?? 400;
      let message = error.message;

      // Map Supabase errors to user-friendly messages
      if (error.message.includes('already registered')) {
        message = 'auth.email_taken';
      } else if (
        error.message.includes('Password') ||
        error.message.includes('password') ||
        error.message.includes('weak')
      ) {
        message = 'auth.weak_password';
      }

      return NextResponse.json({ error: message }, { status });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create or update the profile in the profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      display_name,
      email: data.user.email,
      is_verified: data.user.email_confirmed_at ? true : false,
      is_suspended: false,
    });

    if (profileError) {
      // Log but don't fail — the trigger might have already created the profile
      console.warn('Profile upsert warning:', profileError.message);
    }

    // Fetch the created profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      display_name: profile?.display_name ?? display_name,
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
      session: data.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
