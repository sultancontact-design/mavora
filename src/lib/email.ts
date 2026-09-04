// ============================================================
// 📧 Email Service for Mavora
// Supports Supabase Auth emails and custom transactional emails
// ============================================================

import { getSupabaseServerClient } from './supabase';

// ============================================================
// Types
// ============================================================

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface PasswordResetEmailData {
  resetUrl: string;
  userEmail: string;
  expiryHours: number;
  appName: string;
  locale: 'ar' | 'en';
}

// ============================================================
// Email Templates
// ============================================================

export const emailTemplates = {
  /**
   * Password Reset Email Template (Arabic)
   */
  passwordResetAR(data: PasswordResetEmailData): EmailTemplate {
    return {
      subject: `🔑 إعادة تعيين كلمة المرور - ${data.appName}`,
      htmlBody: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>إعادة تعيين كلمة المرور</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E9F6E 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${data.appName}</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">إعادة تعيين كلمة المرور</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px;">مرحباً،</h2>
                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        استلمتنا طلباً لإعادة تعيين كلمة المرور لحسابك على <strong>${data.appName}</strong>.
                        إذا كنت أن من قدم هذا الطلب، اضغط على الزر أدناه لتعيين كلمة مرور جديدة.
                      </p>
                      
                      <!-- Reset Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${data.resetUrl}" 
                               style="display: inline-block; background-color: #0E9F6E; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                              إعادة تعيين كلمة المرور
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Expiry Warning -->
                      <div style="background-color: #FEF3C7; border-right: 4px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400E; font-size: 14px;">
                          ⏰ <strong>هذا الرابط صالح لمدة ${data.expiryHours} ساعات فقط.</strong><br>
                          بعد انتهاء هذه المدة، ستحتاج إلى طلب رابط جديد.
                        </p>
                      </div>

                      <!-- Security Note -->
                      <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان. 
                        كلمة المرور الحالية لن تتغير إلا إذا تقوم بالضغط على الرابط أعلاه وإنشاء كلمة جديدة.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                        تم إرسال هذا البريد إلى: <strong style="color: #1a1a1a;">${data.userEmail}</strong>
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} ${data.appName}. جميع الحقوق محفوظة.<br>
                        لا ترد على هذا البريد لأنه تم إرساله تلقائياً.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      textBody: `
إعادة تعيين كلمة المرور - ${data.appName}

مرحباً،

استلمتنا طلباً لإعادة تعيين كلمة المرور لحسابك. إذا كنت أن من قدم هذا الطلب، اتبع الرابط التالي:

${data.resetUrl}

هذا الرابط صالح لمدة ${data.expiryHours} ساعات فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.

© ${new Date().getFullYear()} ${data.appName}
      `,
    };
  },

  /**
   * Password Reset Email Template (English)
   */
  passwordResetEN(data: PasswordResetEmailData): EmailTemplate {
    return {
      subject: `🔑 Password Reset - ${data.appName}`,
      htmlBody: `
        <!DOCTYPE html>
        <html dir="ltr" lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E9F6E 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${data.appName}</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Password Reset</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px;">Hello,</h2>
                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your account on <strong>${data.appName}</strong>.
                        If you made this request, click the button below to set a new password.
                      </p>
                      
                      <!-- Reset Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${data.resetUrl}" 
                               style="display: inline-block; background-color: #0E9F6E; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Expiry Warning -->
                      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400E; font-size: 14px;">
                          ⏰ <strong>This link is valid for ${data.expiryHours} hours only.</strong><br>
                          After this time, you'll need to request a new link.
                        </p>
                      </div>

                      <!-- Security Notice -->
                      <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. 
                        Your current password will remain unchanged unless you click the link above and create a new one.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                        This email was sent to: <strong style="color: #1a1a1a;">${data.userEmail}</strong>
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} ${data.appName}. All rights reserved.<br>
                        Please do not reply to this email as it was sent automatically.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      textBody: `
Password Reset - ${data.appName}

Hello,

We received a request to reset your password for your account. If you made this request, follow the link below:

${data.resetUrl}

This link is valid for ${data.expiryHours} hours only.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ${data.appName}
      `,
    };
  },
};

// ============================================================
// Email Sending Functions
// ============================================================

/**
 * Send password reset email using Supabase Auth
 * This leverages Supabase's built-in password recovery
 */
export async function sendPasswordResetEmail(
  email: string,
  locale: 'ar' | 'en' = 'ar'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // Use Supabase Auth's built-in password recovery
    // This sends an email with a link to the reset page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/confirm`,
    });

    if (error) {
      console.error('[EMAIL] Supabase auth error:', error.message);
      
      // For security, don't reveal if email exists or not
      // Return success even if user not found (prevents enumeration)
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        console.log(`[EMAIL] Password reset requested for non-existent email: ${email}`);
        return { success: true }; // Still return success for security
      }
      
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Password reset email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Error sending password reset:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send custom email (for future use with Resend/SendGrid/etc.)
 */
export async function sendCustomEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, log the email (in production, integrate with email service)
    console.log('[EMAIL] Custom email would be sent:', {
      to: options.to,
      subject: options.subject,
      from: options.from || `noreply@${process.env.APP_DOMAIN || 'mavora.com'}`,
    });

    // TODO: Integrate with email service (Resend, SendGrid, AWS SES, etc.)
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: options.from || 'Mavora <noreply@mavora.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });

    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Error sending custom email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Get password reset template based on locale
 */
export function getPasswordResetTemplate(
  data: PasswordResetEmailData
): EmailTemplate {
  return data.locale === 'ar' 
    ? emailTemplates.passwordResetAR(data)
    : emailTemplates.passwordResetEN(data);
}
