# 📱 Mavora Mobile - تطبيق مافورا للموبايل

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-000000?logo=apple&logo=android)
![License](https://img.shields.io/badge/License-MIT-green)

**تطبيق موبايل أصلي لمنصة مافورا للسوق المغربي**

[الويب](https://mavora.vercel.app) · [الوثائق](../docs/) · [تقرير الأخطاء](https://github.com/mavora/mavora/issues)

</div>

---

## 🌟 نظرة عامة

تطبيق Mavora Mobile هو نسخة أصلية من منصة مافورا للسوق الإلكتروني المغربي، مبني بـ React Native لدعم كلاً من iOS و Android.

### ✨ الميزات الرئيسية

- 🌐 **دعم عربي كامل** - واجهة RTL مع نص عربي وأرقام عربية
- 💰 **عملة مغربية** - تنسيق الدرهم المغربي (د.م.) مع أرقام عربية
- 📱 **تجربة أصلية** - أداء عالي وتفاعل سلس
- 🔔 **إشعارات فورية** - دعم Push Notifications
- 📍 **موقع GPS** - عرض الإعلانات على الخريطة
- 📸 **كاميرا ومعرض** - رفع صور متعددة بسهولة
- 💬 **محادثات فورية** - تواصل مباشر مع البائعين
- 🌙 **وضع داكن** - واجهة متكيفة مع إعدادات الجهاز

---

## 📸 لقطات الشاشة

### الشاشة الرئيسية
- ترحيب حسب الوقت (صباح/مساء/مساءً)
- شريط بحث سريع
- شبكة فئات قابلة للتمرير
- إعلانات مميزة (Carousel)
- أحدث الإعلانات

### استعراض الإعلانات
- تبديل شبكة/قائمة
- شريط بحث وفلاتر
- تحديث بالسحب
- تمرير لا نهائي
- زر إنشاء إعلان عائم

### تفاصيل الإعلان
- معرض صور كامل
- معلومات السعر والموقع
- بطاقة بائع مع التقييم
- أزرار محادثة واتصال
- إضافة للمفضلة

### المحادثات
- فقاعات رسائل أنيقة
- إشعار القراءة (✓✓)
- رفع المرفقات
- تحديثات فورية
- مؤشر الكتابة

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **React Native 0.73** | إطار العمل الأساسي |
| **TypeScript 5.3** | نوعية آمنة للكود |
| **React Navigation 6** | التنقل وال路由 |
| **Zustand** | إدارة الحالة |
| **Supabase** | قاعدة البيانات والمصادقة |
| **AsyncStorage** | التخزين المحلي |
| **react-native-maps** | الخرائط |
| **react-native-image-picker** | اختيار الصور |
| **i18n-js** | الترجمة (AR/FR) |
| **react-native-reanimated** | الرسوم المتحركة |

---

## 📋 المتطلبات

### البرامج المطلوبة
- **Node.js** >= 18 LTS
- **npm** >= 9 أو **yarn** >= 1.22 أو **pnpm** >= 8
- **Watchman** (macOS) أو **inotify-tools` (Linux)
- **Xcode** 15+ (لتطوير iOS)
- **Android Studio** مع SDK 33+ (لتطوير Android)

### الأجهزة المدعومة
- **iOS:** iOS 14.0+ (iPhone 8+)
- **Android:** API 23+ (Android 6.0+)

---

## 🚀 البدء السريع

### 1. استنساخ المشروع

```bash
git clone https://github.com/mavora/mavora.git
cd mavora/mobile
```

### 2. تثبيت الاعتمادات

```bash
# استخدام npm
npm install

# أو使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3. إعداد المتغيرات البيئية

```bash
cp .env.example .env
```

عدّل `.env` بإعدادات Supabase الخاصة بك:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 4. تشغيل التطبيق

#### iOS (Simulator/Device)

```bash
# تثبيت pods
cd ios && pod install && cd ..

# تشغيل على المحاكي
npx react-native run-ios

# أو تشغ على جهاز حقيقي
npx react-native run-ios --device
```

#### Android (Emulator/Device)

```bash
# تشغيل على المحاكي
npx react-native run-android

# أو تشغيل على جهاز حقيقي (فعّل USB Debugging)
npx react-native run-android
```

### 5. Metro Bundler

يبدأ تلقائياً عند تشغيل التطبيق. إذا احدثته يدوياً:

```bash
npx react-native start
```

---

## 📁 هيكل المشروع

```
mobile/
├── App.tsx                    # نقطة الدخول الرئيسية
├── index.js                   # Entry point JS
├── package.json               # الاعتمادات والسكربتات
├── tsconfig.json              # إعدادات TypeScript
├── babel.config.js            # إعدادات Babel
├── metro.config.js            # إعدادات Metro Bundler
├── react-native.config.js     # إعدادات React Native
│
└── src/
    ├── navigation/           # التنقل
    │   └── RootNavigator.tsx  # التنقل الرئيسي (Stack + Tabs)
    │
    ├── screens/              # شاشات التطبيق
    │   ├── HomeScreen.tsx      # الرئيسية
    │   ├── ListingsScreen.tsx  # استعراض الإعلانات
    │   ├── ListingDetailScreen.tsx  # تفاصيل الإعلان
    │   ├── CreateListingScreen.tsx  # إنشاء إعلان
    │   ├── ChatScreen.tsx       # المحادثة
    │   ├── MessagesScreen.tsx    # قائمة الرسائل
    │   ├── ProfileScreen.tsx     # الملف الشخصي
    │   ├── SearchScreen.tsx      # البحث
    │   ├── FavoritesScreen.tsx    # المفضلة
    │   ├── WalletScreen.tsx       # المحفظة
    │   ├── MapScreen.tsx           # الخريطة
    │   ├── NotificationsScreen.tsx  # الإشعارات
    │   ├── SettingsScreen.tsx       # الإعدادات
    │   ├── AuthScreen.tsx           # المصادقة
    │   └── SellerDashboardScreen.tsx # لوحة البائع
    │
    ├── services/             # الخدمات
    │   ├── SupabaseClient.ts   # تكامل Supabase
    │   └── NotificationService.ts  # الإشعارات
    │
    ├── context/              # Context Providers
    │   ├── AuthContext.tsx     # حالة المصادقة
    │   └── ThemeContext.tsx    # حالة السمة
    │
    ├── utils/                # أدوات مساعدة
    │   └── formatting.ts      # تنسيق (عملة، تاريخ، أرقام)
    │
    ├── constants/            # الثوابت
    │   └── config.ts          # إعدادات التطبيق
    │
    ├── types/                # TypeScript Types
    │   └── index.ts           # جميع الأنواع
    │
    └── i18n/                 # الترجمة
        ├── index.ts           # إعدادات i18n
        ├── ar.json            # العربية
        └── fr.json            # الفرنسية
```

---

## 🌍 الدعم اللغوي

### العربية (الافتراضية)
- اتجاه RTL كامل
- خط Cairo/Tajawal
- أرقام عربية (٠١٢٣٤٥٦٧٨٩)
- تنسيق التاريخ الهجري/ميلادي

### الفرنسية
- اتجاه LTR
- خط نظام افتراضي
- أرقام لاتينية
- تنسيق فرنسي

### تبديل اللغة
يمكن تبديل اللغة من:
- إعدادات التطبيق > اللغة
- أو برمجياً: `setLanguage('fr' | 'ar')`

---

## 💰 تنسيق العملة

التطبيق يستخدم تنسيق مغربي أصيل:

```typescript
import { formatPrice } from './src/utils/formatting';

// النتيجة: "١٬٢٣٤ د.م."
formatPrice(1234);

// مع العملة الافتراضية MAD
formatPrice(500); // "٥٠٠ د.م."
```

### الأرقام العربية
```typescript
import { toArabicNumerals } from './src/utils/formatting';

toArabicNumerals('1234'); // '١٢٣٤'
toArabicNumerals(2026);  // '٢٠٢٦'
```

---

## 📱 بناء للإنتاج

### iOS (IPA)

```bash
# تحديث رقم الإصدار في package.json
npm version patch

# بناء للإنتاج (iOS)
cd ios
ARCHIVE_PATH=~/Desktop/Mavora.xcarchive xcodebuild \
  -workspace Mavora.xcworkspace \
  -scheme Mavora \
  -configuration Release \
  -sdk iphoneos \
  -archivePath "$ARCHIVE_PATH" \
  archive

# تصدير IPA
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist exportOptions.plist \
  -exportPath ~/Desktop/Mavora-IPA
```

### Android (AAB/APK)

```bash
# بناء AAB (لـ Google Play)
cd android && ./gradlew bundleRelease

# أو بناء APK (للتوزيع المباشر)
cd android && ./gradlew assembleRelease

# المخرجات:
# android/app/build/outputs/bundle/release/app-release.aab
# android/app/build/outputs/apk/release/app-release.apk
```

### توقيع Android

أنشئ `~/.android/mavora-key.keystore`:

```bash
keytool -genkeypair -v \
  -keystore ~/.android/mavora-key.keystore \
  -alias mavora \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass your-password \
  -keypass your-password
```

أضف إلى `android/gradle.properties`:

```properties
MAVORA_KEYSTORE_PASSWORD=your-password
MAVORA_KEY_ALIAS=mavora
MAVORA_KEY_PASSWORD=your-password
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# جميع الاختبارات
npm test

# اختبار معين
npm test -- --testNamePattern="HomeScreen"

# مع coverage
npm test -- --coverage

# watch mode
npm test -- --watch
```

### كتابة اختبارات جديدة

```tsx
// __tests__/HomeScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    const tree = render(<HomeScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('shows greeting in Arabic', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/مرحباً|أهلاً|مساء/i)).toBeTruthy();
  });
});
```

---

## 🔧 إعدادات متقدمة

### تكامل Supabase

التطبيق يتصل بـ Supabase للحصول على:

| الخدمة | الاستخدام |
|---------|-----------|
| **Auth** | تسجيل الدخول، JWT، 2FA |
| **Database** | الإعلانات، الرسائل، المستخدمين |
| **Realtime** | المحادثات الفورية، الإشعارات |
| **Storage** | صور الإعلانات والملفات الشخصية |
| **Edge Functions** | العمليات الحسابية من جانب الخادم |

### إعدادات Push Notifications

#### iOS (APNs)
1. أنشئ شهادة APNs في Apple Developer
2. Upload إلى Supabase Dashboard
3. أضف entitlements في Xcode

#### Android (FCM)
1. أنشئ مشروع Firebase
2. أضف google-services.json
3. Configure FCM في Supabase

### إعدادات الخرائط

#### Google Maps (Android)
أضف إلى `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

#### Apple Maps (iOS)
مفعّل افتراضياً مع Xcode.

---

## 🐛 حل المشكلات الشائعة

### مشاكل البناء

**Problem:** `Unable to resolve module`
```bash
# مسح cache وإعادة البناء
npm start -- --reset-cache
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

**Problem:** `No bundle URL present`
```bash
# تأكد من تشغيل Metro
npx react-native start
```

### مشاكل iOS

**Problem:** `Pods not found`
```bash
cd ios && pod install && cd ..
```

**Problem:** Signing errors
1. افتح `ios/Mavora.xcworkspace` في Xcode
2. انتقل إلى Signing & Capabilities
3. اختر فريق التطوير الخاص بك

### مشاكل Android

**Problem:** `SDK location not found`
1. افتح Android Studio
2. انتقل إلى SDK Manager
3. ثبّت SDK 33
4. حدد `ANDROID_HOME` في environment variables

**Problem:** `Gradle build failed`
```bash
# مسح build cache
cd android && ./gradlew clean && cd ..
```

---

## 📊 أداء التطبيق

### تحسينات مطبقة
- ✅ FlatList للقواصل الطويلة
- ✅ Memoization للمكونات الثقيلة
- ✅ Image caching مع fast-image
- ✅ Lazy loading للشاشات
- ✅ Code splitting بالتنقل

### مقاييس الأداء المستهدفة
| المقياس | الهدف |
|---------|-------|
| Time to Interactive | < 3s |
| Frame Rate | 60 FPS |
| Bundle Size (iOS) | < 20MB |
| Bundle Size (Android) | < 25MB |
| Memory Usage | < 150MB |

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة [CONTRIBUTING.md](../CONTRIBUTING.md) أولاً.

### عملية المساهمة

1. Fork المشروع
2. أنشئ فرعًا (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m '✨ add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

### conventions الكود
- استخدم TypeScript لجميع الملفات الجديدة
- اتبع ESLint rules المحددة
- أكتب اختبارات للميزات الجديدة
- استخدم i18n keys للنصوص (لا نص صلب)
- تأكد من عمل RTL بشكل صحيح

---

## 📄 الترخيص

هذا المشروع مرخص تحت ترخيص MIT - انظر ملف [LICENSE](../LICENSE).

---

## 🙏 الشكر والتقدير

- [React Native](https://reactnative.dev/) - إطار العمل
- [Supabase](https://supabase.com) - Backend BaaS
- [React Navigation](https://reactnavigation.org/) - الحل
- [Zustand](https://zustand-demo.pmnd.rs/) - إدارة الحالة

---

<div align="center">

**🇲🇦 مافورا - سوقك الرقمي الموثوق**

Made with ❤️ in Morocco

</div>
