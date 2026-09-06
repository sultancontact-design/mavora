# 🚀 Mavora v1.0 - مافورا الإصدار الأول

## 🎉 إطلاق النسخة الأولى من منصة مافورا للسوق المغربي

**تاريخ الإصدار:** يناير 2026  
**الإصدار:** 1.0.0  
**الحالة:** 🟢 جاهز للإنتاج

---

## 📋 نظرة عامة

مافورا (Mavora) هي منصة سوق إلكتروني متكاملة مصممة خصيصًا للمغرب، تدعم اللغة العربية والفرنسية مع عملة الدرهم المغربي (MAD). تجمع المنصة بين تجربة ويب متقدمة وتطبيق موبايل أصلي.

### ✨ الميزات الرئيسية

| الفئة | الميزات |
|-------|---------|
| **اللغة والدعم** | عربي (RTL) كلياً، فرنسي، أرقام عربية، تنسيق MAD |
| **المستخدمين** | تسجيل/دخول، 2FA، ملف شخصي، إعدادات |
| **الإعلانات** | إنشاء/تعديل/حذف، صور متعددة، فئات متنوعة |
| **البحث** | بحث عربي ذكي، تطبيع النص، بحث ضبابي، فلاتر متقدمة |
| **التواصل** | محادثات فورية، إشعارات واقعية، مرفقات |
| **الدفع** | PayPal، Payoneer، محفظة رقمية، قسائم |
| **الموبايل** | تطبيق React Native أصلي، PWA، إشعارات دفع |

---

## 🌐 تطبيق الويب (Next.js 14)

### البنية التقنية
- **Framework:** Next.js 14 مع App Router
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + 2FA
- **Realtime:** Supabase Realtime & WebSockets
- **i18n:** next-intl (AR/FR)

### الصفحات والميزات

#### الصفحات العامة
- `الرئيسية` - Hero section، إعلانات مميزة، شبكة الفئات
- `استعراض الإعلانات` - شبكة/قائمة، فلاتر، ترتيب، تمرير لا نهائي
- `تفاصيل الإعلان` - معرض صور، معلومات البائع، زر المحادثة
- `البحث` - بحث ذكي مع اقتراحات، بحث محفوظ

#### حساب المستخدم
- `تسجيل الدخول/الاشتراك` - نموذج متكامل مع تحقق
- `الملف الشخصي` - تعديل البيانات، الصورة الرمزية
- `المفضلة` - حفظ الإعلانات المفضلة
- `الرسائل` - نظام محادثات كامل

#### البائعين
- `لوحة التحكم` - إحصائيات المبيعات،/manage الإعلانات
- `إنشاء إعلان` - نموذج متعدد الخطوات مع رفع الصور
- `المحفظة` - الرصيد، المعاملات، السحب

#### الإدارة
- `لوحة المشرف` - إدارة المستخدمين، الإعلانات، التقارير
- `الإحصائيات` - رسوم بيانية تفاعلية
- `الاعتدال` - طابور المراجعة

---

## 📱 تطبيق الموبايل (React Native)

### البنية التقنية
- **Framework:** React Native 0.73
- **Navigation:** React Navigation 6
- **State Management:** Zustand
- **Storage:** AsyncStorage
- **Maps:** react-native-maps
- **Images:** react-native-image-picker
- **i18n:** i18n-js (AR/FR)

### الشاشات

| الشاشة | الوصف |
|--------|-------|
| `HomeScreen` | الرئيسية مع الترحيب، الفئات، الإعلانات المميزة |
| `ListingsScreen` | استعراض مع شبكة/قائمة، فلاتر، تحديث |
| `ListingDetailScreen` | تفاصيل كاملة مع معرض صور وبائع |
| `CreateListingScreen` | نموذج 6 خطوات لإنشاء إعلان |
| `ChatScreen` | محادثة فورية مع رسائل واقعية |
| `MessagesScreen` | قائمة المحادثات |
| `ProfileScreen` | الملف الشخصي والإعدادات |
| `SearchScreen` - بحث متقدم مع فلاتر |
| `FavoritesScreen` - الإعلانات المحفوظة |
| `WalletScreen` - المحفظة والمعاملات |
| `MapScreen` - خريطة الإعلانات |
| `NotificationsScreen` - الإشعارات |
| `SettingsScreen` - إعدادات التطبيق |
| `AuthScreen` - تسجيل الدخول/الاشتراك |
| `SellerDashboardScreen` - لوحة البائع |

### الميزات الخاصة بالموبايل
- ✅ دعم RTL كامل للعربية
- ✅ تنسيق العملة المغربية (١٢٣ د.م.)
- ✅ الأرقام العربية (٠١٢٣٤٥٦٧٨٩)
- ✅ التحقق من أرقام المغرب (+212)
- ✅ إشعارات الدفع الفورية
- ✅ الكاميرا ومعرض الصور
- ✅ الموقع GPS
- ✅ السحب للتحديث
- ✅ التمرير اللانهائي

---

## 🧪 الاختبارات

### اختبارات الوحدة (270+ اختبار)
```
__tests__/
├── auth.test.ts           # المصادقة والأدوار
├── listings.test.ts       # إدارة الإعلانات
├── search.test.ts         # محرك البحث العربي
├── utils.test.ts          # الأدوات المساعدة
├── app.test.ts            # اختبارات التطبيق
└── integration/           # اختبارات التكامل
    ├── auth.test.ts
    ├── listings.test.ts
    ├── wallet-payments.test.ts
    ├── notifications.test.ts
    └── conversations.test.ts
```

### اختبارات E2E (275+ اختبار)
```
e2e/
├── auth-flow.spec.ts        # تدفق المصادقة (~50 اختبار)
├── listings-flow.spec.ts    # إدارة الإعلانات (~45 اختبار)
├── messaging-flow.spec.ts   # الرسائل والمحادثات (~35 اختبار)
├── payment-flow.spec.ts     # المدفوعات والمحفظة (~30 اختبار)
├── search-spec.ts           # البحث المتقدم (~40 اختبار)
├── mobile-responsive.spec.ts # التجاوب والموبايل (~35 اختبار)
└── accessibility.spec.ts    # إمكانية الوصول (~40 اختبار)
```

---

## 📊 إحصائيات المشروع

```
المراحل التطويرية:  ████████████████ 15/15 ✅
اختبارات الوحدة:    █████████████████ 270+ ✅
اختبارات E2E:        █████████████████ 275+ ✅
GitHub:              ✅ محدث (21+ commits)
Vercel:              ✅ ينشر تلقائياً
البناء:             ✅ ناجح
الملفات الإجمالية:  ~210+ ملف
أسطر الكود:        ~45,000+ سطر
```

---

## 🏗️ هيكل المشروع

```
mavora/
├── src/                    # مصدر تطبيق الويب
│   ├── app/               # صفحات Next.js App Router
│   ├── components/        # مكونات React
│   ├── lib/               # المكتبات والخدمات
│   ├── hooks/             # Custom Hooks
│   ├── stores/            # Zustand Stores
│   └── i18n/              # ترجمات AR/FR
│
├── mobile/                # تطبيق React Native
│   ├── src/
│   │   ├── screens/       # شاشات التطبيق (15+)
│   │   ├── navigation/    # التنقل
│   │   ├── services/      # الخدمات (Supabase, Notifications)
│   │   ├── context/       # Context Providers
│   │   ├── utils/         # أدوات التنسيق
│   │   ├── constants/     # الثوابت والإعدادات
│   │   ├── types/         # TypeScript Types
│   │   └── i18n/          # ترجمات AR/FR
│   ├── App.tsx
│   └── package.json
│
├── e2e/                   # اختبارات E2E (Playwright)
│   ├── helpers/           # مساعدات الاختبار
│   ├── fixtures/          # بيانات الاختبار
│   └── *.spec.ts          # ملفات الاختبار
│
├── __tests__/             # اختبارات الوحدة (Vitest)
├── prisma/                # مخطط قاعدة البيانات
├── public/                # assets ثابتة
└── docs/                  # التوثيق
```

---

## 🚀 التشغيل المحلي

### المتطلبات المسبقة
- Node.js >= 18
- npm أو pnpm أو yarn
- حساب Supabase (أو local Docker)

### تشغيل تطبيق الويب

```bash
# استنساخ المشروع
git clone https://github.com/mavora/mavora.git
cd mavora

# تثبيت الاعتمادات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env
# عدّل .env بمفاتيح Supabase الخاصة بك

# تشغيل وضع التطوير
npm run dev
# افتح http://localhost:3000
```

### تشغيل تطبيق الموبايل

```bash
# الانتقال لمجلد الموبايل
cd mobile

# تثبيت اعتمادات React Native
npm install

# بالنسبة iOS
cd ios && pod install && cd ..
npx react-native run-ios

# بالنسبة Android
npx react-native run-android
```

### تشغيل الاختبارات

```bash
# اختبارات الوحدة
npm test

# اختبارات E2E
npx playwright install
npx playwright test
```

---

## 🔒 الأمان

- ✅ مصادقة Supabase مع JWT
- ✅ دعم 2FA (TOTP)
- ✅ Row Level Security (RLS) على جميع الجداول
- ✅ CSRF Protection
- ✅ Rate Limiting على API
- ✅ Validation مدخل على Server & Client
- ✅ Sanitization للمدخلات
- ✅ CORS Configuration
- ✅ HTTPS Only في الإنتاج

---

## 🌍 الدعم اللغوي

| اللغة | الاتجاه | الحالة |
|-------|---------|--------|
| العربية (المغربية) | RTL | ✅ كامل |
| الفرنسية | LTR | ✅ كامل |

### التنسيق الخاص
- العملة: درهم مغربي (د.م.) مع أرقام عربية
- التاريخ: format عربي (مثلاً: ١٥ يناير ٢٠٢٦)
- الأرقام: أرقام عربية (٠١٢٣٤٥٦٧٨٩)
- الموقع: مدن مغربية بالعربية والفرنسية

---

## 📱 PWA (Progressive Web App)

يدعم Mavora تقنية PWA للتشغيل مثل التطبيق الأصلي:

- ✅ Service Worker للتخزين المؤقت
- ✅ Web App Manifest
- ✅ أيقونات متعددة الأحجام
- ✅ دعم Offline الأساسي
- ✅ Install Prompt
- ✅ Splash Screen

---

## 🔗 الروابط المهمة

- **الويب:** https://mavora.vercel.app (أو نطاقك الخاص)
- **المستودع:** https://github.com/mavora/mavora
- **الوثائق:** ./docs/
- **API:** ./API_DOCUMENTATION.md

---

## 📝 خارطة الطريق (Roadmap)

### v1.1 (Q1 2026)
- [ ] تطبيق React Native على App Store / Google Play
- [ ] دفع Apple Pay / Google Pay
- [ ] نظام التقييمات والمراجعات المتقدم
- [ ] دردشة جماعية للمفاوضات

### v1.2 (Q2 2026)
- [ ] نظام المزادات العلنية
- [ ] الشحن والتوصيل المتكامل
- [ ] لوحة تحكم متقدمة للبائعين
- [ ] تقارير Analytics مفصلة

### v2.0 (Q3 2026)
- [ ] AI للتوصيات الشخصية
- [ ] نظام نقاط الولاء
- [ ] توسع لدول عربية أخرى
- [ ] API للجهات الخارجية

---

## 👥 المساهمون

- **الفريق الأساسي:** فريق تطوير Mavora
- **التصميم:** تصميم عربي أصلي RTL
- **الاختبار:** تغطية 95%+ بالاختبارات

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر تحت ترخيص MIT - انظر ملف [LICENSE](./LICENSE)

---

## 🙏 الشكر والتقدير

- **Supabase** - Backend as a Service
- **Vercel** - Hosting و Deployment
- **Next.js** - Framework رائع
- **React Native** - تطوير الموبايل
- **مجتمع المصادر المفتوحة** - جميع المكتبات المستخدمة

---

**🎊 شكراً لاستخدام مافورا! معاً نبني مستقبل التجارة الإلكترونية في المغرب!**

<p align="center">
  <b>مافورا - سوقك الرقمي الموثوق</b><br>
  <sub>Mavora - Your Trusted Digital Marketplace</sub>
</p>
