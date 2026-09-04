# 🛒 Mavora - سوقك الإلكتروني الموثوق

<div align="center">

![Mavora Logo](https://via.placeholder.com/120x120/0E9F6E/ffffff?text=M)

**منصة إعلانات مبوبة متقدة للمغرب وشمال إفريقيا**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescript.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECFF8?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**العربية** | [Français](#) | [English](#)

</div>

---

## 📋 جدول المحتويات

- [🌟 نظرة عامة](#-نظرة-عامة)
- [✨ الميزات](#-الميزات)
- [🛠️ التقنيات المستخدمة](#-التنيات-المستخدمة)
- [🚀 البدء السريع](#-البدء-السريع)
- [📁 هيكل المشروع](#-هيكل-المشروع)
- [⚙️ الإعدادات](#-الإعدادات)
- [🧪 الاختبارات](#-الاختبارات)
- [📦 النشر](#-النشر)
- [🤝 المساهمة](#-المساهمة)
- [📄 الرخصة](#-الرخصة)

---

## 🌟 نظرة عامة

**مافورا (Mavora)** هي منصة إعلانات مبوعة متطورة مصممة خصيصاً لسوق المغرب وشمال إفريقيا. تجمع المنصة بين سهولة الاستخدام والميزات المتقدمة لتوفير تجربة تسوق إلكتروني آمنة وموثوقة.

### 🎯 الرؤية

أن نكون المنصة الرائدة للتجارة الإلكترونية في المنطقة، مع التركيز على:
- **الثقة**: نظام تحقق شامل للمستخدمين والبائعين
- **الأمان**: حماية متقدمة للبيانات والمعاملات
- **سهولة الاستخدام**: واجهة عربية سلسة ومتجاوبة
- **الأداء**: سرعة فائقة وتجربة مستخدم محسنة

---

## ✨ الميزات

### 👤 نظام المستخدمين
- ✅ تسجيل/تسجيل الدخول (بريد إلكتروني/هاتف)
- ✅ ملف شخصي متقدم مع صورة/avatar
- ✅ نظام تحقق (Email, Phone, Identity)
- ✅ إعادة تعيين كلمة المرور الآمنة
- ✅ المصادقة ثنائية (2FA) - قيد التطوير
- ✅ أدوار متعددة (مستخدم، بائع، مشرف، مسؤول)

### 🏪 نظام الإعلانات
- ✅ إنشاء/تعديل/حذف الإعلانات
- ✅ تصنيفات متعددة المستويات
- ✅ بحث متقدم مع فلترة ذكية
- ✅ رفع صور متعددة مع تحسين تلقائي
- ✅ حالة الإعلان (نشط، معلق، مباع، منتهي)
- ✅ تمييز الإعلانات والإعلانات المميزة

### 💬 نظام الرسائل
- ✅ محادثات فورية بين المشترين والبائعين
- ✅ إشعارات في الوقت الفعلي
- ✅ رفع الصور في الرسائل
- ✅ الإبلاغ عن المحادثات المشبوهة

### ❤️ المفضلات والإشعارات
- ✅ حفظ الإعلانات في المفضلات
- ✅ إشعارات للسعر المنخفض/متاح
- ✅ بحث محفوظ مع تنبيهات

### 💰 نظام الدفع والمحفظة
- ✅ رصيد محفظة إلكترونية
- ✅ سجل المعاملات التفصيلي
- ✅ باقات الرموز (Token Packages)
- ✅ نظام اشتراكات - قيد التطوير

### 🛡️ الأمان والأداء
- ✅ حماية XSS و SQL Injection
- ✅ Rate Limiting متقدم
- ✅ تحميل كسول (Lazy Loading) للمكونات
- ✅ تحسين الصور (WebP/AVIF)
- ✅ مراقبة Core Web Vitals
- ✅ Skeleton Loading States

### 🌐 التدويل (i18n)
- ✅ العربية (الافتراضي) - RTL
- ✅ الفرنسية
- ✅ الإنجليزية
- ✅ تبديل اللغة بسلاسة

### 📱 PWA
- ✅ تثبيت على الشاشة الرئيسية
- ✅ عمل بدون اتصال (قيد التطوير)
- ✅ إشعارات الدفع - قيد التطوير

---

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
| التقنية | الاستخدام |
|---------|----------|
| **Next.js 16** | إطار العمل الأساسي (App Router) |
| **TypeScript 5** | لغة برمجة نوعية |
| **React 19** | مكتبة واجهة المستخدم |
| **Tailwind CSS 4** | إطار التنسيقات |
| **shadcn/ui** | مكونات UI جاهزة |
| **Zustand** | إدارة الحالة |
| **React Hook Form** | إدارة النماذج |
| **Zod** | التحقق من البيانات |
| **Lucide React** | الأيقونات |

### الخلفية (Backend)
| التقنية | الاستخدام |
|---------|----------|
| **Supabase** | قاعدة البيانات والمصادقة |
| **PostgreSQL** | قاعدة البيانات العلائقية |
| **Prisma ORM** | التعامل مع قاعدة البيانات |
| **Next.js API Routes** | نقاط نهاية API |

### البنية التحتية
| التقنية | الاستخدام |
|---------|----------|
| **Vercel** | استضافة ونشر |
| **Sharp** | معالجة الصور |
| **Vitest** | اختبارات الوحدة والتكامل |
| **ESLint** | فحص الكود |
| **Prettier** | تنسيق الكود |

---

## 🚀 البدء السريع

### المتطلبات المسبقة

- **Node.js** >= 18.x
- **npm** >= 9.x أو **pnpm** >= 8.x
- **حساب Supabase** (مجاني)

### التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/sultancontact-design/mavora.git
cd mavora

# تثبيت الاعتماديات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف .env بإعدادات Supabase الخاصة بك
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# تشغيل خادم التطوير
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

### الأوامر المتاحة

```bash
# تشغيل خادم التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build

# تشغيل بناء الإنتاج
npm run start

# تشغيل الاختبارات
npm test

# فحص جودة الكود
npm run lint

# تنسيق الكود
npm run format
```

---

## 📁 هيكل المشروع

```
mavora/
├── src/
│   ├── app/                    # صفحات Next.js App Router
│   │   ├── api/               # نقاط نهاية API
│   │   │   ├── auth/          # المصادقة (login, signup, reset-password)
│   │   │   ├── listings/      # الإعلانات
│   │   │   ├── categories/    # التصنيفات
│   │   │   ├── messages/      # الرسائل
│   │   │   ├── users/         # المستخدمين
│   │   │   └── upload/        # رفع الملفات
│   │   ├── auth/              # صفحات المصادقة
│   │   ├── listings/          # صفحات الإعلانات
│   │   ├── admin/             # لوحة التحكم
│   │   └── ...
│   │
│   ├── components/            # مكونات React
│   │   ├── ui/                # مكونات UI الأساسية (shadcn)
│   │   ├── layout/            # Header, Footer, Sidebar
│   │   ├── listing/           # مكونات الإعلانات
│   │   ├── auth/              # مكونات المصادقة
│   │   ├── common/            # مكونات مشتركة
│   │   │   ├── Skeleton.tsx       # حالات التحميل
│   │   │   ├── OptimizedImage.tsx # صور محسنة
│   │   │   ├── LazyComponents.tsx # تحميل كسول
│   │   │   └── PerformanceMonitor.tsx
│   │   └── ...
│   │
│   ├── lib/                   # مكتبات وأدوات مساعدة
│   │   ├── supabase.ts        # عميل Supabase
│   │   ├── auth.ts            # وظائف المصادقة
│   │   ├── email.ts           # خدمة البريد
│   │   ├── password-reset.ts  # إعادة تعيين كلمة المرور
│   │   ├── storage/           # نظام التخزين
│   │   │   ├── adapter.ts     # واجهة التخزين
│   │   │   ├── manager.ts     # مدير التخزين
│   │   │   └── image-processor.ts
│   │   ├── performance/       # أدوات الأداء
│   │   └── validations/       # مخططات التحقق (Zod)
│   │
│   ├── hooks/                 # React Hooks مخصصة
│   │   ├── useTranslation.ts  # الترجمة
│   │   └── useAuth.ts         # حالة المصادقة
│   │
│   ├── i18n/                  # ملفات الترجمة
│   │   ├── ar.json            # العربية
│   │   ├── en.json            # الإنجليزية
│   │   └── fr.json            # الفرنسية
│   │
│   └── types/                 # أنواع TypeScript
│
├── prisma/
│   └── schema.prisma          # مخطط قاعدة البيانات
│
├── __tests__/                 # الاختبارات
│   ├── integration/           # اختبارات التكامل
│   ├── e2e/                   # اختبارات E2E
│   └── *.test.ts              # اختبارات الوحدة
│
├── public/                    # الملفات الثابتة
├── docs/                      # التوثيق
├── next.config.ts             # إعدادات Next.js
├── tailwind.config.ts         # إعدادات Tailwind
├── tsconfig.json              # إعدادات TypeScript
├── package.json               # اعتماديات المشروع
└── README.md                  # هذا الملف
```

---

## ⚙️ الإعدادات

### متغيرات البيئة

انسخ `.env.example` إلى `.env` وعدّل القيم:

```env
# Supabase (من لوحة تحكم Supabase → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# التطبيق
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Mavora

# اختياري: إعدادات البريد (للمستقبل)
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=noreply@mavora.com
```

### إعداد Supabase

1. أنشئ مشروعاً جديداً على [Supabase](https://supabase.com)
2. انسخ URL و API Key إلى `.env`
3. شغّل `npm run db:push` لتطبيق مخطط قاعدة البيانات
4 فعّل Email Auth في إعدادات Authentication

---

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل اختبارات محددة
npx vitest run auth.test.ts

# تشغيل في وضع المراقبة (watch mode)
npm test -- --watch

# تغطية الكود
npm test -- --coverage
```

### أنواع الاختبارات

| النوع | المسار | الوصف |
|------|--------|-------|
| **Unit Tests** | `__tests__/*.test.ts` | اختبارات الوحدات |
| **Integration Tests** | `__tests__/integration/*.test.ts` | اختبارات التكامل |
| **E2E Tests** | `__tests__/e2e/*.test.ts` | اختبارات نهاية لنهاية |

### تغطية الاختبارات الحالية

```
✅ نظام المصادقة (Login, Signup, Password Reset)
✅ الإعلانات (CRUD, Search, Filters)
✅ الأمان (XSS, SQL Injection, Rate Limiting)
✅ الأداء (Debounce, Throttle, Memoization)
✅ الصور (Optimization, Lazy Loading)
```

---

## 📦 النشر

### Vercel (موصى به)

1. ادفع الكود إلى GitHub
2. [استيراد المشروع على Vercel](https://vercel.com/new)
3. أضف متغيرات البيئة:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. انقر **Deploy**

### Docker (قيد التطوير)

```dockerfile
# قريباً...
```

### يدوي (VPS)

```bash
# بناء المشروع
npm run build

# تشغيل مع PM2
pm2 start npm --name "mavora" -- start
```

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع هذه الخطوات:

1. Fork المشروع
2. إنشاء فرع (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
2. افتح Pull Request

### معايير الكود

- اتبع [Conventional Commits](https://www.conventionalcommits.org/)
- استخدم TypeScript للأصناف والدوال
- أضف اختبارات للملفات الجديدة
- تأكد من مرور جميع الاختبارات

---

## 📊 تقدم المشروع

### المراحل المكتملة

| Phase | الوصف | الحالة |
|-------|-------|--------|
| 1-7 | الأساسيات (Auth, Listings, Messages, Wallet) | ✅ |
| 8 | نظام رفع الصور والتخزين | ✅ |
| 9 | إعادة تعيين كلمة المرور | ✅ |
| 10 | تحسينات الأداء والتحميل | ✅ |
| 11 | الاختبار الشامل والإصدار | ✅ |

### قائمة الرغبات (Roadmap)

- [ ] نظام دفع متكامل (Stripe/Paypal)
- [ ] تطبيق موبايل (React Native/Flutter)
- [ ] نظام تقييمات ومراجعات متقدم
- [ ] دردشة مباشرة (WebSocket)
- [ ] خريطة تفاعلية للإعلانات
- [ ] نظام إعلانات مدفوعة
- [ ] API للمطورين الخارجيين
- [ ] دعم لغات إضافية

---

## 📄 الرخصة

هذا المشروع مرخص تحت رخصة [MIT](LICENSE). راجع ملف `LICENSE` للتفاصيل.

---

## 🙏 الشكر والتقدير

- [Next.js](https://nextjs.org/) - إطار React الإنتاجي
- [Supabase](https://supabase.com/) - منصة Backend كخدمة
- [Tailwind CSS](https://tailwindcss.com/) - إطار CSS أولوية الأدوات
- [shadcn/ui](https://ui.shadcn.com/) - مكونات UI جميلة
- [Lucide](https://lucide.dev/) - أيقونات رائعة

---

## 📞 الدعم

- **البريد الإلكتروني**: support@mavora.ma
- **GitHub Issues**: [فتح issue جديد](https://github.com/sultancontact-design/mavora/issues)
- **الوثائق**: [docs.mavora.ma](https://docs.mavora.ma) (قريباً)

---

<div align="center">

**صُنع بـ ❤️ للمغرب وشمال إفريقيا**

[⬆️ العودة للأعلى](#--mavora---سوقك-الإلكتروني-الموثوق)

</div>
