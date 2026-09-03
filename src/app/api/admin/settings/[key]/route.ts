import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin setting GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { value, description } = body;

    const updates: Record<string, unknown> = {
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };
    if (value !== undefined) updates.value = String(value);
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('platform_settings')
      .update(updates)
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('Admin setting PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin setting PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = getSupabaseServerClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('platform_settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Admin setting DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete setting' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin setting DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
