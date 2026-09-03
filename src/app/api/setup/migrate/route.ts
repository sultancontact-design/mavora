import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_API_BASE = 'https://api.supabase.com';
const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token } = body;

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      );
    }

    if (!PROJECT_REF) {
      return NextResponse.json(
        { error: 'SUPABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Validate token by fetching profile
    const profileRes = await fetch(`${SUPABASE_API_BASE}/v1/profile`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: 'Invalid access token. Get one from: Supabase Dashboard → Account → Access Tokens → Generate New Token' },
        { status: 401 }
      );
    }

    const profile = await profileRes.json();

    // Check user has access to this project
    const projectsRes = await fetch(`${SUPABASE_API_BASE}/v1/projects/${PROJECT_REF}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!projectsRes.ok) {
      return NextResponse.json(
        { error: 'You do not have access to this Supabase project' },
        { status: 403 }
      );
    }

    // Read migration SQL
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
    let sql: string;
    try {
      sql = readFileSync(sqlPath, 'utf-8');
    } catch {
      return NextResponse.json(
        { error: 'Migration file not found' },
        { status: 500 }
      );
    }

    // Execute migration via Supabase Management API
    const migrateRes = await fetch(
      `${SUPABASE_API_BASE}/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!migrateRes.ok) {
      const errData = await migrateRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Migration execution failed',
          details: errData.message || errData.error || 'Unknown error',
          status: migrateRes.status,
        },
        { status: 500 }
      );
    }

    const result = await migrateRes.json();

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
      executed_by: profile.email || profile.username || 'unknown',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Migration failed', details: message },
      { status: 500 }
    );
  }
}
