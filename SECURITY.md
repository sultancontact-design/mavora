# سياسة الأمان - Security Policy

## 🛡️ الإبلاغ عن ثغرات أمنية / Reporting Vulnerabilities

نحن نأخذ أمان مشروع **مافورا (Mavora)** بجدية تامة. نقدر جهود الباحثين الأمنيين في الكشف عن الثغرات.

### كيفية الإبلاغ / How to Report

**لا تفتح issue عامة!** بدلاً من ذلك، أرسل لنا بريداً إلكترونياً:

📧 **البريد الإلكتروني:** `security@mavora.ma`

🔑 **مفتاح PGP:**
```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[إضافة مفتاح PGP العام هنا]
-----END PGP PUBLIC KEY BLOCK-----
```

### ما يجب تضمينه / What to Include

يرجى تضمين المعلومات التالية في تقريرك:

1. **وصف الثغرة** - نوع المشكلة وكيفية استغلالها
2. **خطوات إعادة الإنتاج** - تعليمات مفصلة لتكرار المشكلة
3. **تأثير الثغرة** - ما يمكن للمهاجم فعله
4. **اقتراح الإصلاح** - إن وجد (اختياري)
5. **لقطات الشاشة** - إن أمكن

### نطاق المشروع / Scope

يغطي هذا البرنامج:
- ✅ كود المصدر في هذا المستودع
- ✅ واجهات API الرسمية (`api.mavora.ma`)
- ✅ تطبيقات الويب والهاتف الرسمية
- ❌ خدمات الطرف الثالث (PayPal, Payoneer, etc.)
- ❌ هجمات DDoS أو Social Engineering

## ⏰ الاستجابة المتوقعة / Expected Response

| المرحلة | الوقت |
|---------|-------|
| تأكيد الاستلام | خلال 48 ساعة |
| التحقيق الأولي | خلال 7 أيام |
| تحديث الحالة | كل 7 أيام |
| الإصلاح | حسب الخطورة |

## 🎁 المكافآت / Bug Bounty

نقدم مكافآت للثغرات الحرجة:

| الخطورة | المكافأة |
|---------|----------|
| 🔴 حرجة (Critical) | 5,000 MAD+ |
| 🟠 عالية (High) | 2,000 MAD |
| 🟡 متوسطة (Medium) | 500 MAD |
| 🟢 منخفضة (Low) | شكر + ذكر في قائمة الشكر |

## 🔒 تصنيف الخطورة / Severity Classification

### 🔴 Critical / حرجة
- الوصول غير المصرح به إلى بيانات المستخدمين
- تنفيذ كود عن بُعد (RCE)
- حقن SQL يؤدي لاختراق كامل

### 🟠 High / عالية
- XSS مخزنة (Stored XSS)
- CSRF على عمليات حساسة
- تسرب معلومات حساسة

### 🟡 Medium / متوسطة
- XSS انعكاسية (Reflected XSS)
- ثغرات CSRF محدودة
- مشاكل في التحكم بالوصول

### 🟢 Low / منخفضة
- معلومات كاشفة جداً (Information Disclosure)
- رؤوس HTTP مفقودة
- مشاكل في Content Security Policy

## 📋 قائمة الشكر / Hall of Fame

سيتم ذكر الباحثين الذين يساهمون في اكتشاف الثغرات:

<!-- 
### 2024
- [@username] - اكتشاف ثغرة [نوع الثغرة]
-->

## 🔧 ممارسات الأمان الآمن / Secure Practices

### للمطورين / For Developers

```bash
# تثبيت التبعيات بأمان
npm audit
npm audit fix

# فحص التبعيات
npm outdated

# تشغيل اختبارات الأمان
npm run test:security
```

### للنشر / For Deployment

1. ✅ استخدام HTTPS دائماً
2. ✅ تعيين جميع متغيرات البيئة
3. ✅ تفعيل CORS الصارم
4. ✅ تحديث الحزم بانتظام
5. ✅ مراجعة سجلات الوصول

## 📞 اتصل بنا / Contact Us

- **الأمان:** `security@mavora.ma`
- **عام:** `hello@mavora.ma`
- **GitHub:** [Issues](https://github.com/mavora-ma/mavora/issues)

---

## English Version

### Supported Versions

Currently we release security updates for the following versions:

| Version | Support Type |
|---------|--------------|
| 1.x.x | 🔒 Security fixes only |

### Reporting a Vulnerability

**DO NOT** open a public issue. Email us at: `security@mavora.ma`

We'll acknowledge your report within 48 hours and provide regular updates.

---

© 2024 Mavora. Last updated: January 2024
