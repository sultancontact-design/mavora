/**
 * API Route: Two-Factor Authentication (2FA)
 * Endpoints for 2FA setup and verification
 * 
 * POST /api/auth/2fa/setup - Setup TOTP
 * POST /api/auth/2fa/verify - Verify code
 * POST /api/auth/2fa/send-code - Send SMS/Email code
 * POST /api/auth/2fa/disable - Disable 2FA
 * GET /api/auth/2fa/status - Check 2FA status
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorManager, TwoFactorType } from '@/lib/auth/2fa';
import { getSupabaseServerClient } from '@/lib/supabase';

// ============================================================
// Setup TOTP
// ============================================================

export async function SETUP_POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'totp' } = body;

    if (type === 'totp') {
      // Setup TOTP
      const setup = twoFactorManager.setupTOTP(
        session.user.id,
        session.user.email || ''
      );

      // In production, store the secret temporarily (not yet verified)
      // await db.insert(twoFactorTempSecrets).values({...})

      return NextResponse.json({
        success: true,
        data: {
          secret: setup.secret,
          qrCodeUrl: setup.qrCodeUrl,
          manualEntryKey: setup.manualEntryKey,
          backupCodes: setup.backupCodes,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported 2FA type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[2FA API] Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

// ============================================================
// Verify Code
// ============================================================

export async function VERIFY_POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, code, secret, challengeId } = body;

    let result;

    switch (type) {
      case 'totp':
        if (!secret || !code) {
          return NextResponse.json(
            { error: 'Missing secret or code' },
            { status: 400 }
          );
        }
        result = await twoFactorManager.verifyAndEnableTOTP(
          session.user.id,
          secret,
          code
        );
        break;

      case 'sms':
      case 'email':
        if (!challengeId || !code) {
          return NextResponse.json(
            { error: 'Missing challengeId or code' },
            { status: 400 }
          );
        }
        result = twoFactorManager.verifyCode(challengeId, code);
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported 2FA type' },
          { status: 400 }
        );
    }

    if (result.success) {
      // Generate new session with 2FA verified flag
      // In production, issue new JWT with 2FA claim
      
      return NextResponse.json({
        success: true,
        data: {
          verified: true,
          token: result.token,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          remainingAttempts: result.remainingAttempts,
          cooldownUntil: result.cooldownUntil,
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[2FA API] Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// Send SMS/Email Code
// ============================================================

export async function SEND_CODE_POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, destination } = body; // destination = phone number or email

    let result;

    if (type === 'sms') {
      if (!destination) {
        // Use user's phone number from profile
        // For now, require explicit phone number
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        );
      }
      result = await twoFactorManager.sendSMSCode(session.user.id, destination);
    } else if (type === 'email') {
      const email = destination || session.user.email;
      if (!email) {
        return NextResponse.json(
          { error: 'Email address is required' },
          { status: 400 }
        );
      }
      result = await twoFactorManager.sendEmailCode(session.user.id, email);
    } else {
      return NextResponse.json(
        { error: 'Type must be "sms" or "email"' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          challengeId: result.challengeId,
          // Don't return the actual code!
          message: type === 'sms' 
            ? 'SMS code sent successfully' 
            : 'Email code sent successfully',
        },
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[2FA API] Send code error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// ============================================================
// Disable 2FA
// ============================================================

export async function DISABLE_POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, verificationCode } = body;

    if (!type || !verificationCode) {
      return NextResponse.json(
        { error: 'Type and verification code are required' },
        { status: 400 }
      );
    }

    const twoFactorType = type.toUpperCase() as TwoFactorType;
    const result = await twoFactorManager.disableTwoFactor(
      session.user.id,
      twoFactorType,
      verificationCode
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '2FA disabled successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[2FA API] Disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

// ============================================================
// Check 2FA Status
// ============================================================

export async function STATUS_GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isEnabled = await twoFactorManager.isTwoFactorEnabled(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        userId: session.user.id,
      },
    });

  } catch (error) {
    console.error('[2FA API] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to check 2FA status' },
      { status: 500 }
    );
  }
}

// Main route handler
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'setup':
      return SETUP_POST(request);
    case 'verify':
      return VERIFY_POST(request);
    case 'send-code':
      return SEND_CODE_POST(request);
    case 'disable':
      return DISABLE_POST(request);
    default:
      return NextResponse.json(
        { error: 'Invalid action. Use: setup, verify, send-code, disable' },
        { status: 400 }
      );
  }
}

export async function GET() {
  return STATUS_GET(new Request('', { method: 'GET' }));
}
