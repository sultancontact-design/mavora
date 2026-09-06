import { NextRequest, NextResponse } from 'next/server';
import { dbLogin, DEMO_PASSWORDS } from '@/lib/db-auth';

// DEBUG ENDPOINT - Remove in production!
// This helps diagnose why login is failing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[DEBUG LOGIN] Received:', { email, passwordLength: password?.length });
    
    // Test 1: Check if email/password are received
    if (!email || !password) {
      return NextResponse.json({
        error: 'Missing email or password',
        received: { email, hasPassword: !!password }
      });
    }
    
    // Test 2: Check if email is in DEMO_PASSWORDS
    const normalizedEmail = email.toLowerCase().trim();
    const demoPassword = DEMO_PASSWORDS[normalizedEmail] || DEMO_PASSWORDS[email];
    
    console.log('[DEBUG LOGIN] Demo password check:', {
      normalizedEmail,
      hasDemoPassword: !!demoPassword,
      passwordMatches: demoPassword === password
    });
    
    // Test 3: Try DB Login directly
    console.log('[DEBUG LOGIN] Calling dbLogin...');
    const result = await dbLogin(email, password);
    console.log('[DEBUG LOGIN] dbLogin result:', {
      success: result.success,
      hasUser: !!result.user,
      authMethod: result.authMethod,
      error: result.error
    });
    
    // Return detailed debug info
    return NextResponse.json({
      input: { email: normalizedEmail, passwordLength: password?.length },
      demoPasswordCheck: {
        isInDemoList: !!demoPassword,
        passwordMatches: demoPassword === password
      },
      dbLoginResult: result,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[DEBUG LOGIN] Error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also allow GET for simple testing
export async function GET() {
  return NextResponse.json({
    message: 'Debug login endpoint - POST to test login',
    usage: 'POST with { email, password } body',
    availableDemoAccounts: Object.keys(DEMO_PASSWORDS),
    timestamp: new Date().toISOString(),
    envCheck: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}
