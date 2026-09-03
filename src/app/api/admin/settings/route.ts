import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      console.error('Admin settings GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, value_type, description } = body;

    if (!key || !value_type) {
      return NextResponse.json({ error: 'key and value_type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .insert({
        key,
        value: String(value ?? ''),
        value_type,
        description: description ?? null,
        updated_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Admin settings POST error:', error);
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Admin settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
