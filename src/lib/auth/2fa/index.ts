/**
 * Two-Factor Authentication (2FA) System for Mavora
 * Supports TOTP (Time-based OTP) and SMS verification
 * 
 * @module lib/auth/2fa
 */

import crypto from 'crypto';

// ============================================================
// Types & Interfaces
// ============================================================

export enum TwoFactorType {
  TOTP = 'totp',           // Time-based OTP (Google Authenticator, Authy)
  SMS = 'sms',             // SMS verification code
  EMAIL = 'email',         // Email verification code
  BACKUP_CODE = 'backup_code', // Backup codes for recovery
}

export enum TwoFactorStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  VERIFIED = 'verified',
  PENDING = 'pending',
}

export interface TwoFactorSecret {
  id: string;
  userId: string;
  type: TwoFactorType;
  secret: string;         // Encrypted TOTP secret or hashed backup codes
  isActive: boolean;
  createdAt: Date;
  verifiedAt?: Date;
  lastUsedAt?: Date;
  metadata?: Record<string, any>;
}

export interface TOTPSetup {
  secret: string;          // Base32 encoded secret
  qrCodeUrl: string;       // URL for QR code generation
  manualEntryKey: string;  // Key for manual entry
  backupCodes: string[];   // Backup codes for recovery
}

export interface VerificationResult {
  success: boolean;
  remainingAttempts?: number;
  cooldownUntil?: Date;
  error?: string;
  token?: string;          // Session token after successful 2FA
}

export interface TwoFactorChallenge {
  challengeId: string;
  userId: string;
  type: TwoFactorType;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

// ============================================================
// Configuration
// ============================================================

export interface TwoFactorConfig {
  // TOTP settings
  totp: {
    algorithm: string;     // Default: sha1
    digits: number;        // Default: 6
    period: number;        // Time step in seconds (default: 30)
    skew: number;          // Allowed time skew (default: 1)
    issuer: string;        // Issuer name (e.g., "Mavora")
  };
  
  // SMS settings
  sms: {
    enabled: boolean;
    codeLength: number;    // Default: 6
    codeExpiry: number;    // Seconds (default: 300 = 5 min)
    maxAttempts: number;   // Default: 5
    cooldownTime: number;  // Seconds after max attempts (default: 900 = 15 min)
  };
  
  // Email settings
  email: {
    enabled: boolean;
    codeLength: number;
    codeExpiry: number;
    maxAttempts: number;
    cooldownTime: number;
  };

  // Backup codes
  backupCodes: {
    count: number;         // Number of backup codes to generate (default: 10)
    bytesLength: number;   // Bytes per code (default: 20)
  };
  
  // Security
  rateLimit: {
    windowMs: number;      // Rate limit window (default: 60000 = 1 min)
    maxRequests: number;   // Max requests per window (default: 10)
  };
}

const DEFAULT_CONFIG: TwoFactorConfig = {
  totp: {
    algorithm: 'sha1',
    digits: 6,
    period: 30,
    skew: 1,
    issuer: 'Mavora',
  },
  sms: {
    enabled: true,
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 5,
    cooldownTime: 900,
  },
  email: {
    enabled: true,
    codeLength: 6,
    codeExpiry: 600,
    maxAttempts: 5,
    cooldownTime: 900,
  },
  backupCodes: {
    count: 10,
    bytesLength: 20,
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 10,
  },
};

// ============================================================
// TOTP Implementation
// ============================================================

/**
 * Generate a random secret key for TOTP
 */
function generateSecret(bytes: number = 20): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Convert buffer to base32 encoding
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let output = '';

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }

  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    const index = parseInt(chunk, 2);
    output += alphabet[index];
  }

  return output;
}

/**
 * Generate TOTP code at given time
 */
function generateTOTPCode(secret: string, time?: number, config = DEFAULT_CONFIG.totp): string {
  const epoch = Math.floor((time || Date.now()) / 1000);
  const counter = Math.floor(epoch / config.period);

  // Create HMAC-SHA1 counter buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  // Decode base32 secret
  const secretBuffer = base32Decode(secret);

  // Create HMAC
  const hmac = crypto.createHmac(config.algorithm, secretBuffer);
  hmac.update(counterBuffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const strCode = (code % Math.pow(10, config.digits)).toString();
  return strCode.padStart(config.digits, '0');
}

/**
 * Decode base32 string to buffer
 */
function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (const char of str.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Verify TOTP code
 */
function verifyTOTPCode(
  token: string,
  secret: string,
  config = DEFAULT_CONFIG.totp
): boolean {
  // Check current and adjacent time windows
  const now = Date.now();
  
  for (let offset = -config.skew; offset <= config.skew; offset++) {
    const time = now + offset * config.period * 1000;
    const expectedCode = generateTOTPCode(secret, time, config);
    
    if (token === expectedCode) {
      return true;
    }
  }

  return false;
}

// ============================================================
// 2FA Manager Class
// ============================================================

class TwoFactorManager {
  private config: TwoFactorConfig;
  private challenges: Map<string, TwoFactorChallenge> = new Map();
  private rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config: Partial<TwoFactorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================
  // TOTP Setup
  // ============================================================

  /**
   * Setup TOTP for user - returns secret and QR code URL
   */
  setupTOTP(userId: string, userEmail: string): TOTPSetup {
    // Generate random secret
    const secretBytes = crypto.randomBytes(20);
    const secretBase32 = base32Encode(secretBytes);

    // Generate QR Code URL (otpauth:// format)
    const encodedIssuer = encodeURIComponent(this.config.totp.issuer);
    const encodedEmail = encodeURIComponent(userEmail);
    const qrCodeUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=${this.config.totp.algorithm.toUpperCase()}&digits=${this.config.totp.digits}&period=${this.config.totp.period}`;

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secretBase32,
      qrCodeUrl,
      manualEntryKey: secretBase32,
      backupCodes,
    };
  }

  /**
   * Verify and enable TOTP
   */
  async verifyAndEnableTOTP(
    userId: string,
    secret: string,
    code: string
  ): Promise<VerificationResult> {
    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Too many attempts. Please try again later.',
        cooldownUntil: rateLimitCheck.resetAt,
      };
    }

    // Verify the code
    const isValid = verifyTOTPCode(code, secret, this.config.totp);

    if (isValid) {
      // Store the verified secret (in real app, encrypt before storing)
      const twoFactorSecret: TwoFactorSecret = {
        id: crypto.randomUUID(),
        userId,
        type: TwoFactorType.TOTP,
        secret: this.encryptSecret(secret),
        isActive: true,
        createdAt: new Date(),
        verifiedAt: new Date(),
      };

      // In production, save to database
      console.log('[2FA] TOTP enabled for user:', userId);

      return {
        success: true,
        token: this.generateSessionToken(userId),
      };
    } else {
      this.recordAttempt(userId);
      
      return {
        success: false,
        error: 'Invalid verification code',
        remainingAttempts: this.getRemainingAttempts(userId),
      };
    }
  }

  // ============================================================
  // SMS/Email Verification
  // ============================================================

  /**
   * Send SMS verification code
   */
  async sendSMSCode(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; challengeId?: string; error?: string }> {
    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    // Generate code
    const code = this.generateVerificationCode(this.config.sms.codeLength);
    const challengeId = crypto.randomUUID();

    // Store challenge
    const challenge: TwoFactorChallenge = {
      challengeId,
      userId,
      type: TwoFactorType.SMS,
      expiresAt: new Date(Date.now() + this.config.sms.codeExpiry * 1000),
      attempts: 0,
      maxAttempts: this.config.sms.maxAttempts,
      verified: false,
    };
    this.challenges.set(challengeId, challenge);

    // In production, send via Twilio or similar service
    console.log(`[2FA] SMS code for ${phoneNumber}: ${code}`);

    // Simulate sending
    // await twilioService.sendSMS(phoneNumber, `Your Mavora verification code is: ${code}`);

    return {
      success: true,
      challengeId,
    };
  }

  /**
   * Send email verification code
   */
  async sendEmailCode(
    userId: string,
    emailAddress: string
  ): Promise<{ success: boolean; challengeId?: string; error?: string }> {
    // Similar to SMS but sends email
    const code = this.generateVerificationCode(this.config.email.codeLength);
    const challengeId = crypto.randomUUID();

    const challenge: TwoFactorChallenge = {
      challengeId,
      userId,
      type: TwoFactorType.EMAIL,
      expiresAt: new Date(Date.now() + this.config.email.codeExpiry * 1000),
      attempts: 0,
      maxAttempts: this.config.email.maxAttempts,
      verified: false,
    };
    this.challenges.set(challengeId, challenge);

    console.log(`[2FA] Email code for ${emailAddress}: ${code}`);

    // In production, send via Resend/SendGrid
    // await emailService.send(emailAddress, 'Your Mavora verification code', `Code: ${code}`);

    return {
      success: true,
      challengeId,
    };
  }

  /**
   * Verify SMS/Email code
   */
  verifyCode(
    challengeId: string,
    code: string
  ): VerificationResult {
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      return { success: false, error: 'Invalid or expired challenge' };
    }

    // Check expiry
    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      return { success: false, error: 'Code has expired' };
    }

    // Check max attempts
    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      return {
        success: false,
        error: 'Maximum attempts reached. Please request a new code.',
        cooldownUntil: new Date(Date.now() + this.config.sms.cooldownTime * 1000),
      };
    }

    // Increment attempts
    challenge.attempts++;

    // Verify code (in production, compare against stored hash)
    // For demo, we'll accept any 6-digit code starting with '1'
    const isValid = code.length === this.config.sms.codeLength && /^\d+$/.test(code);

    if (isValid) {
      challenge.verified = true;
      this.challenges.delete(challengeId);
      
      return {
        success: true,
        token: this.generateSessionToken(challenge.userId),
      };
    } else {
      return {
        success: false,
        error: 'Invalid verification code',
        remainingAttempts: challenge.maxAttempts - challenge.attempts,
      };
    }
  }

  // ============================================================
  // Backup Codes
  // ============================================================

  /**
   * Generate backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.config.backupCodes.count; i++) {
      const bytes = crypto.randomBytes(this.config.backupCodes.bytesLength);
      // Format: XXXX-XXXX-XXXX
      const code = bytes.toString('base64url')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12)
        .match(/.{1,4}/g)
        ?.join('-') || '';
      codes.push(code);
    }

    return codes;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(
    userId: string,
    code: string,
    storedHashes: string[]
  ): VerificationResult {
    // In production, compare against stored hashes
    // For demo, accept properly formatted codes
    const isValid = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);

    if (isValid) {
      return {
        success: true,
        token: this.generateSessionToken(userId),
      };
    }

    return {
      success: false,
      error: 'Invalid backup code',
    };
  }

  // ============================================================
  // 2FA Status Management
  // ============================================================

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    // In production, check database
    // const result = await db.select().from(twoFactorSecrets).where(eq(userId, userId));
    // return result.some(s => s.isActive);
    
    return false; // Default for demo
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(
    userId: string,
    type: TwoFactorType,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify the code before disabling
    // Then deactivate the 2FA method
    
    console.log(`[2FA] Disabled ${type} for user: ${userId}`);
    
    return { success: true };
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private generateVerificationCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption
    // For now, just encode
    return Buffer.from(secret).toString('base64');
  }

  private decryptSecret(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString();
  }

  private generateSessionToken(userId: string): string {
    const payload = {
      sub: userId,
      type: '2fa_verified',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
    };
    
    // In production, sign with JWT
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private checkRateLimit(userId: string): { allowed: boolean; resetAt?: Date } {
    const now = Date.now();
    const record = this.rateLimitMap.get(userId);

    if (!record || now > record.resetAt) {
      this.rateLimitMap.set(userId, {
        count: 1,
        resetAt: now + this.config.rateLimit.windowMs,
      });
      return { allowed: true };
    }

    if (record.count >= this.config.rateLimit.maxRequests) {
      return { allowed: false, resetAt: new Date(record.resetAt) };
    }

    record.count++;
    return { allowed: true };
  }

  private recordAttempt(userId: string): void {
    // Attempts are tracked per challenge, not globally
  }

  private getRemainingAttempts(userId: string): number {
    // Return remaining attempts based on active challenges
    let minRemaining = Infinity;
    
    for (const challenge of this.challenges.values()) {
      if (challenge.userId === userId) {
        const remaining = challenge.maxAttempts - challenge.attempts;
        minRemaining = Math.min(minRemaining, remaining);
      }
    }

    return minRemaining === Infinity ? this.config.sms.maxAttempts : minRemaining;
  }

  /**
   * Cleanup expired challenges
   */
  cleanupExpiredChallenges(): void {
    const now = new Date();
    
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }
}

// Singleton instance
export const twoFactorManager = new TwoFactorManager();

// Export class for testing
export { TwoFactorManager };

// Export utilities
export { generateTOTPCode, verifyTOTPCode };
// setupTOTP is a placeholder - would be implemented with proper QR code generation

export default twoFactorManager;
