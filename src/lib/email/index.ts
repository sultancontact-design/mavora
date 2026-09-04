/**
 * @description Email Service for Mavora
 * خدمة إرسال البريد الإلكتروني لمافورا
 * 
 * Supports: SMTP, Resend, SendGrid, or any Nodemailer transport
 */

import nodemailer from 'nodemailer';
import type { EmailContext } from './templates';
import {
  getWelcomeEmail,
  getPasswordResetEmail,
  getNewMessageEmail,
  getOrderConfirmationEmail,
  getPaymentReceivedEmail,
  get2FACodeEmail,
  getListingApprovedEmail,
  getWeeklyDigestEmail,
} from './templates';

// -------------------------------------------
// Types
// -------------------------------------------

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export type EmailType = 
  | 'welcome' 
  | 'password-reset' 
  | 'new-message' 
  | 'order-confirmation'
  | 'payment-received'
  | '2fa-code'
  | 'listing-approved'
  | 'weekly-digest';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

// -------------------------------------------
// Configuration
// -------------------------------------------

function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || `مافورا <noreply@mavora.ma>`,
  };
}

function getDefaultContext(): EmailContext {
  return {
    userName: 'مستخدم',
    userEmail: '',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Mavora',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mavora.ma',
    logoUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mavora.ma'}/icons/icon-192x192.png`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@mavora.ma',
    year: new Date().getFullYear(),
  };
}

// -------------------------------------------
// Transporter (lazy initialization)
// -------------------------------------------

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getEmailConfig();
    
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      // TLS settings
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }
  
  return transporter;
}

// -------------------------------------------
// Main Send Function
// -------------------------------------------

async function sendEmail(
  type: EmailType,
  options: EmailOptions,
  templateData: Record<string, any> = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const ctx = { ...getDefaultContext(), ...templateData };
    const config = getEmailConfig();
    
    // Get email content based on type
    let emailContent;
    switch (type) {
      case 'welcome':
        emailContent = getWelcomeEmail(ctx);
        break;
      case 'password-reset':
        emailContent = getPasswordResetEmail(ctx, templateData.resetToken, templateData.expiryHours);
        break;
      case 'new-message':
        emailContent = getNewMessageEmail(
          ctx,
          templateData.senderName,
          templateData.listingTitle,
          templateData.listingId,
          templateData.messagePreview
        );
        break;
      case 'order-confirmation':
        emailContent = getOrderConfirmationEmail(
          ctx,
          templateData.orderId,
          templateData.listingTitle,
          templateData.amount,
          templateData.currency
        );
        break;
      case 'payment-received':
        emailContent = getPaymentReceivedEmail(
          ctx,
          templateData.buyerName,
          templateData.listingTitle,
          templateData.amount,
          templateData.currency
        );
        break;
      case '2fa-code':
        emailContent = get2FACodeEmail(ctx, templateData.code, templateData.method);
        break;
      case 'listing-approved':
        emailContent = getListingApprovedEmail(ctx, templateData.listingTitle, templateData.listingId);
        break;
      case 'weekly-digest':
        emailContent = getWeeklyDigestEmail(
          ctx,
          templateData.newListingsCount,
          templateData.newMessagesCount,
          templateData.topListings
        );
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
    
    // Send email
    const info = await getTransporter().sendMail({
      from: config.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      replyTo: options.replyTo,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
    
    console.log(`✅ Email sent: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// -------------------------------------------
// Convenience Functions
// -------------------------------------------

export async function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail('welcome', { to: email }, { userName, userEmail: email });
}

export async function sendPasswordResetEmail(email: string, token: string, userName: string) {
  return sendEmail('password-reset', { to: email }, { 
    userName, 
    userEmail: email, 
    resetToken: token,
    expiryHours: 1,
  });
}

export async function sendNewMessageEmail(
  email: string,
  userName: string,
  senderName: string,
  listingTitle: string,
  listingId: string,
  messagePreview: string
) {
  return sendEmail('new-message', { to: email }, {
    userName,
    userEmail: email,
    senderName,
    listingTitle,
    listingId,
    messagePreview,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  userName: string,
  orderId: string,
  listingTitle: string,
  amount: number,
  currency: string = 'MAD'
) {
  return sendEmail('order-confirmation', { to: email }, {
    userName,
    userEmail: email,
    orderId,
    listingTitle,
    amount,
    currency,
  });
}

export async function send2FACodeEmail(email: string, code: string, method: string = 'بريد إلكتروني') {
  return sendEmail('2fa-code', { to: email }, { code, method });
}

export async function sendListingApprovedEmail(
  email: string,
  userName: string,
  listingTitle: string,
  listingId: string
) {
  return sendEmail('listing-approved', { to: email }, {
    userName,
    userEmail: email,
    listingTitle,
    listingId,
  });
}

// -------------------------------------------
// Verify Transport Connection
// -------------------------------------------

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log('✅ Email transport verified');
    return true;
  } catch (error) {
    console.error('❌ Email transport verification failed:', error);
    return false;
  }
}

// -------------------------------------------
// Export
// -------------------------------------------

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewMessageEmail,
  sendOrderConfirmationEmail,
  send2FACodeEmail,
  sendListingApprovedEmail,
  verifyEmailConnection,
};
