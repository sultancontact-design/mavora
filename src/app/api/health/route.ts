import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  const checks = {
    database: false,
    storage: false,
    auth: false,
  };

  try {
    // Database check
    const supabase = getSupabaseServerClient();
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    checks.database = !dbError;

    // Storage check
    const { error: storageError } = await supabase.storage.listBuckets();
    checks.storage = !storageError;

    // Auth check
    const { error: authError } = await supabase.auth.getSession();
    checks.auth = !authError;
  } catch {
    // Checks stay false
  }

  const failedChecks = Object.values(checks).filter((v) => !v).length;
  const status =
    failedChecks === 0
      ? 'healthy'
      : failedChecks < 3
        ? 'degraded'
        : 'unhealthy';

  return NextResponse.json({
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
