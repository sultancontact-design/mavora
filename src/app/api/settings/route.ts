import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

const PUBLIC_KEYS = [
  'site_name',
  'site_description',
  'default_currency',
  'max_images_per_listing',
  'max_image_size_mb',
  'support_email',
  'allow_registration',
  'maintenance_mode',
];

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value, value_type')
      .in('key', PUBLIC_KEYS);

    if (error) {
      console.error('Public settings GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key as string] = row.value as string;
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Public settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
