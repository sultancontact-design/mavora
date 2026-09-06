/**
 * @description Email Templates System for Mavora
 * نظام قوالب البريد الإلكتروني لمافورا
 */

// -------------------------------------------
// Types
// -------------------------------------------

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailContext {
  userName: string;
  userEmail: string;
  appName: string;
  appUrl: string;
  logoUrl: string;
  supportEmail: string;
  year: number;
}

// -------------------------------------------
// Base Template
// -------------------------------------------

function getBaseTemplate(content: string, ctx: EmailContext): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ctx.appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .logo { height: 40px; }
    h2 { color: #333; font-size: 20px; margin-bottom: 15px; }
    p { color: #555; line-height: 1.6; margin: 10px 0; }
    a { color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 ${ctx.appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${ctx.year} ${ctx.appName} - جميع الحقوق محفوظة</p>
      <p>تم استلام هذا البريد لأنك مسجل في ${ctx.appName}</p>
      <p><a href="${ctx.appUrl}>زيارة الموقع</a> | <a href="mailto:${ctx.supportEmail">الدعم الفني</a></p>
    </div>
  </div>
</body>
</html>`;
}

// -------------------------------------------
// Welcome Email
// -------------------------------------------

export function getWelcomeEmail(ctx: EmailContext): EmailTemplate {
  const content = `
    <h2>مرحباً ${ctx.userName}! 👋</h2>
    <p>يسعدنا انضمامك إلى مجتمع <strong>${ctx.appName}</strong>، منصة التسوق الأولى في المغرب.</p>
    
    <div class="card">
      <h3>🚀 ما يمكنك فعله الآن:</h3>
      <ul style="text-align: right; direction: rtl;">
        <li>تصفح آلاف الإعلانات في مختلف الفئات</li>
        <li>نشر إعلاناتك للوصول لآلاف المشترين</li>
        <li>التواصل مباشرة مع البائعين والمشترين</li>
        <li>الاستفادة من نظام الدفع الآمن</li>
      </ul>
    </div>
    
    <p>ابدأ رحلتك الآن بالضغط على الزر أدناه:</p>
    <a href="${ctx.appUrl}" class="button">استكشف ${ctx.appName}</a>
    
    <p>إذا كانت لديك أي أسئلة، لا تتردد في التواصل معنا على <a href="mailto:${ctx.supportEmail}">${ctx.supportEmail}</a></p>
    
    <p>مرحباً بك في عائلة ${ctx.appName}! 🎉</p>
  `;

  return {
    subject: `مرحباً بك في ${ctx.appName}! 🎉`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}!\n\nيسعدنا انضمامك إلى ${ctx.appName}.\n\nابدأ الآن: ${ctx.appUrl}`,
  };
}

// -------------------------------------------
// Password Reset Email
// -------------------------------------------

export function getPasswordResetEmail(ctx: EmailContext, resetToken: string, expiryHours: number = 1): EmailTemplate {
  const resetUrl = `${ctx.appUrl}/auth/reset-password/confirm?token=${resetToken}`;
  
  const content = `
    <h2>إعادة تعيين كلمة المرور 🔐</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>استلمت طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>${ctx.appName}</strong>.</p>
    
    <div class="card" style="background-color: #fff3cd; border: 1px solid #ffc107;">
      <p><strong>⚠️ ملاحظة مهمة:</strong> هذا الرابط صالح لمدة ${expiryHours} ساعة فقط.</p>
    </div>
    
    <p>لإعادة تعيين كلمة المرور، اضغط على الزر أدناه:</p>
    <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
    
    <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد. حسابك آمن ولن يتم تغيير كلمة المرور إلا بالنقر على الرابط أعلاه.</p>
    
    <p>تحياتنا،<br>فريق ${ctx.appName}</p>
  `;

  return {
    subject: 'إعادة تعيين كلمة المرور - ${ctx.appName}',
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName},\n\nلإعادة تعيين كلمة المرور: ${resetUrl}\n\nهذا الرابط صالح لـ ${expiryHours} ساعة.`,
  };
}

// -------------------------------------------
// New Message Notification
// -------------------------------------------

export function getNewMessageEmail(
  ctx: EmailContext,
  senderName: string,
  listingTitle: string,
  listingId: string,
  messagePreview: string
): EmailTemplate {
  const messageUrl = `${ctx.appUrl}/messages`;
  const listingUrl = `${ctx.appUrl}/listings/${listingId}`;
  
  const content = `
    <h2>💬 لديك رسالة جديدة!</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>لقد تلقيت رسالة جديدة من <strong>${senderName}</strong>:</p>
    
    <div class="card">
      <p><strong>بخصوص الإعلان:</strong></p>
      <p><a href="${listingUrl}" style="color: #667eea;">${listingTitle}</a></p>
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;" />
      <p><em>"${messagePreview}"</em></p>
    </div>
    
    <a href="${messageUrl}" class="button">عرض الرسالة</a>
    
    <p>رد على الرسالة لإكمال المحادثة!</p>
  `;

  return {
    subject: `رسالة جديدة من ${senderName} - ${ctx.appName}`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}،\n\nرسالة جديدة من ${senderName} بخصوص: ${listingTitle}\n\n"${messagePreview}"\n\n${messageUrl}`,
  };
}

// -------------------------------------------
// Order Confirmation Email
// -------------------------------------------

export function getOrderConfirmationEmail(
  ctx: EmailContext,
  orderId: string,
  listingTitle: string,
  amount: number,
  currency: string = 'MAD'
): EmailTemplate {
  const orderUrl = `${ctx.appUrl}/profile?tab=orders`;
  
  const content = `
    <h2>✅ تأكيد الطلب!</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>تم تأكيد طلبك بنجاح! شكراً لتسوقك مع <strong>${ctx.appName}</strong>.</p>
    
    <div class="card">
      <h3>تفاصيل الطلب</h3>
      <table style="width: 100%; text-align: right;">
        <tr>
          <td style="padding: 8px 0;"><strong>رقم الطلب:</strong></td>
          <td style="padding: 8px 0;">${orderId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>المنتج:</strong></td>
          <td style="padding: 8px 0;">${listingTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>المبلغ:</strong></td>
          <td style="padding: 8px 0;"><strong style="font-size: 18px; color: #667eea;">${amount.toLocaleString('ar-MA')} ${currency}</strong></td>
        </tr>
      </table>
    </div>
    
    <p>يمكنك تتبع حالة طلبك من خلال:</p>
    <a href="${orderUrl}" class="button">تتبع الطلب</a>
    
    <p>شكراً لتثقتك بـ ${ctx.appName}! 🛒</p>
  `;

  return {
    subject: `تأكيد الطلب #${orderId} - ${ctx.appName}`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}!\n\nتم تأكيد طلبك:\nالرقم: ${orderId}\nالمنتج: ${listingTitle}\nالمبلغ: ${amount} ${currency}\n\n${orderUrl}`,
  };
}

// -------------------------------------------
// Payment Received Email (for sellers)
// -------------------------------------------

export function getPaymentReceivedEmail(
  ctx: EmailContext,
  buyerName: string,
  listingTitle: string,
  amount: number,
  currency: string = 'MAD'
): EmailTemplate {
  const walletUrl = `${ctx.appUrl}/wallet`;
  
  const content = `
    <h2>💰 استلمت دفعة جديدة!</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>مبارك! لقد استلمت دفعة جديدة من <strong>${buyerName}</strong>.</p>
    
    <div class="card" style="background-color: #d4edda; border: 1px solid #28a745;">
      <h3 style="color: #155724; margin-top: 0;">تفاصيل الدفعة</h3>
      <table style="width: 100%; text-align: right;">
        <tr>
          <td style="padding: 8px 0;"><strong>المشتري:</strong></td>
          <td style="padding: 8px 0;">${buyerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>المنتج:</strong></td>
          <td style="padding: 8px 0;">${listingTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>المبلغ المستلم:</strong></td>
          <td style="padding: 8px 0;"><strong style="font-size: 20px; color: #28a745;">${amount.toLocaleString('ar-MA')} ${currency}</strong></td>
        </tr>
      </table>
    </div>
    
    <p>تمت إضافة المبلغ إلى رصيدك في المحفظة.</p>
    <a href="${walletUrl}" class="button">عرض المحفظة</a>
  `;

  return {
    subject: `دفعة جديدة - ${amount} ${currency} - ${ctx.appName}`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}!\n\nاستلمت دفعة من ${buyerName}:\nالمنتج: ${listingTitle}\nالمبلغ: ${amount} ${currency}\n\n${walletUrl}`,
  };
}

// -------------------------------------------
// 2FA Code Email
// -------------------------------------------

export function get2FACodeEmail(ctx: EmailContext, code: string, method: string = 'بريد إلكتروني'): EmailTemplate {
  const content = `
    <h2>🔐 رمز التحقق الثنائي</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>طلبت رمز التحقق عبر ${method}. إليك رمزك:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #667eea; background: #f0f0ff; padding: 20px 40px; border-radius: 10px; display: inline-block; direction: ltr;">
        ${code}
      </span>
    </div>
    
    <div class="card" style="background-color: #fff3cd; border: 1px solid #ffc107;">
      <p><strong>⚠️ لاشارك هذا الرقم مع أحد!</strong></p>
      <p>هذا الرمز صالح لمدة 10 دقائق فقط.</p>
    </div>
    
    <p>إذا لم تكن أن من طلب هذا الرمز، يرجى تغيير كلمة المرور فوراً والاتصال بالدعم.</p>
  `;

  return {
    subject: `رمز التحقق - ${ctx.appName}`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName},\n\nرمز التحقق: ${code}\n\nصالح لمدة 10 دقائق.\n\nإذا لم تطلبه، اتصل بالدعم فوراً.`,
  };
}

// -------------------------------------------
// Listing Approved Email
// -------------------------------------------

export function getListingApprovedEmail(
  ctx: EmailContext,
  listingTitle: string,
  listingId: string
): EmailTemplate {
  const listingUrl = `${ctx.appUrl}/listings/${listingId}`;
  
  const content = `
    <h2>✅ تمت الموافقة على إعلانك!</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>تهانينا! تمت الموافقة على إعلانك وظهر الآن للجميع.</p>
    
    <div class="card">
      <h3>${listingTitle}</h3>
      <p>إعلانك الآن نشط ويمكن للمشترين مشاهدته والتواصل معك.</p>
    </div>
    
    <a href="${listingUrl}" class="button">عرض الإعلان</a>
    
    <p>نتمنى لك بيعاً موفقاً! 🎉</p>
  `;

  return {
    subject: 'تمت الموافقة على إعلانك! ✅',
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}!\n\nتمت الموافقة على إعلانك: ${listingTitle}\n\n${listingUrl}`,
  };
}

// -------------------------------------------
// Weekly Digest Email
// -------------------------------------------

export function getWeeklyDigestEmail(
  ctx: EmailContext,
  newListingsCount: number,
  newMessagesCount: number,
  topListings: Array<{ title: string; id: string; price: number }>
): EmailTemplate {
  const listingsHtml = topListings.map(listing => `
    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
      <a href="${ctx.appUrl}/listings/${listing.id}" style="color: #333; text-decoration: none;">
        ${listing.title} - <strong>${listing.price.toLocaleString('ar-MA')} MAD</strong>
      </a>
    </div>
  `).join('');
  
  const content = `
    <h2>📊 ملخص أسبوعي من ${ctx.appName}</h2>
    <p>مرحباً ${ctx.userName}،</p>
    <p>إليك ملخص نشاطك هذا الأسبوع:</p>
    
    <div class="card">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 10px;">🆕 إعلانات جديدة</td>
          <td style="padding: 10px; font-weight: bold; font-size: 18px;">${newListingsCount}</td>
        </tr>
        <tr>
          <td style="padding: 10px;">💬 رسائل جديدة</td>
          <td style="padding: 10px; font-weight: bold; font-size: 18px;">${newMessagesCount}</td>
        </tr>
      </table>
    </div>
    
    <h3>⭐ أكثر الإعلانات شهرة هذا الأسبوع:</h3>
    ${listingsHtml}
    
    <a href="${ctx.appUrl}" class="button">استكشف المزيد</a>
  `;

  return {
    subject: `ملخصك الأسبوعي - ${ctx.appName}`,
    html: getBaseTemplate(content, ctx),
    text: `مرحباً ${ctx.userName}!\n\nملخص الأسبوع:\n- ${newListingsCount} إعلان جديد\n- ${newMessagesCount} رسالة جديدة\n\n${ctx.appName}`,
  };
}

// -------------------------------------------
// Export all templates
// -------------------------------------------

export default {
  welcome: getWelcomeEmail,
  passwordReset: getPasswordResetEmail,
  newMessage: getNewMessageEmail,
  orderConfirmation: getOrderConfirmationEmail,
  paymentReceived: getPaymentReceivedEmail,
  twoFactorAuth: get2FACodeEmail,
  listingApproved: getListingApprovedEmail,
  weeklyDigest: getWeeklyDigestEmail,
};
