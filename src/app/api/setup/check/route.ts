import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (error) {
      // Table doesn't exist or other DB error
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({ configured: true });
  } catch {
    return NextResponse.json({ configured: false });
  }
}
