# 🤝 دليل المساهمة في مافورا | Contributing to Mavora

شكراً لاهتمامك بالمساهمة في مشروع **مافورا**! نقدر كل مساعدة ونسعى لجعل عملية المساهمة سهلة وممتعة.

Thank you for considering contributing to **Mavora**! We appreciate any help and strive to make contributing easy and enjoyable.

---

## 📋 جدول المحتويات | Table of Contents

- [كيف يمكنني المساعدة؟](#كيف-يمكنني-المساعدة)
- [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
- [معايير الكود](#معايير-الكود)
- [عملية Submit Pull Request](#عملية-submit-pull-request)
- [تقرير الأخطاء](#تقرير-الأخطاء)
- [اقتراح الميزات](#اقتراح-الميزات)
- [دليل نمط الكود](#دليل-نمط-الكود)

---

## 🎯 كيف يمكنني المساعدة؟ | How Can I Contribute?

### 🐛 الإبلاغ عن Bugs

إذا وجدت خطأً في الكود:

1. تأكد من أن المشكل لم يُبلغ عنه سابقاً في [Issues](../../issues)
2. افتح issue جديد مع:
   - وصف واضح للمشكلة
   - خطوات إعادة إنتاج المشكلة
   - لقطة شاشة (إن أمكن)
   - معلومات النظام (المتصفح، نظام التشغيل)

### 💡 اقتراح ميزات جديدة

1. تحقق من أن الميزة لم تُطلب سابقاً
   2. افتح Feature Request مع:
      - وصف الميزة والغرض منها
      - حالات الاستخدام
      - تصميم مقترح (اختياري)

### 🔧 كود Code Contributions

هذه هي الطرق التي يمكنك المساهمة بها عبر الكود:

| النوع | الوصف | الصعوبة |
|-------|-------|---------|
| `documentation` | تحسين التوثيق | 🟢 سهل |
| `bug fix` | إصلاح أخطاء | 🟢 سهل |
| `good first issue` | قضايا مناسبة للمبتدئين | 🟢 سهل |
| `feature` | ميزات جديدة | 🟡 متوسط |
| `enhancement` | تحسينات موجودة | 🟡 متوسط |
| `refactor` | إعادة هيكلة الكود | 🔴 صعب |

---

## 🛠️ إعداد بيئة التطوير | Development Setup

### المتطلبات | Prerequisites

```bash
# Required
Node.js >= 18.x
npm >= 9.x
Git

# Optional (for full features)
Docker & Docker Compose
Redis (local or Docker)
```

### خطوات الإعداد | Setup Steps

```bash
# 1. Fork المستودع وانسخه
git clone https://github.com/YOUR_USERNAME/mavora.git
cd mavora

# 2. تثبيت الاعتماديات
npm install

# 3. نسخ ملف البيئة
cp .env.example .env
# عدل .env حسب حاجتك (للتطوير، القيم الافتراضية تكفي)

# 4. تشغيل خادم التطوير
npm run dev

# 5. افتح المتصفح على http://localhost:3000
```

### الأوامر المتاحة | Available Commands

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل خادم التطوير |
| `npm run build` | بناء للإنتاج |
| `npm run start` | تشغيل نسخة الإنتاج |
| `npm run lint` | فحص جودة الكود |
| `npm test` | تشغيل الاختبارات |
| `npm test -- --watch` | اختبارات بوضع المراقبة |
| `npm test -- --coverage` | اختبارات مع التغطية |

---

## 📏 معايير الكود | Code Standards

### TypeScript

```typescript
// ✅ Good: استخدام Types صريحة
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ Bad: استخدام any
const user: any = getData();
```

### React Components

```tsx
// ✅ Good: مكون وظيفي مع Types
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### التسمية | Naming Conventions

| النوع | الأسلوب | مثال |
|-------|---------|------|
| Components | PascalCase | `UserProfile.tsx` |
| Utilities | camelCase | `formatPrice.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `IUser`, `OrderStatus` |
| API Routes | kebab-case | `/api/listings/create` |

### التعليقات | Comments

```typescript
/**
 * يحسب سعر المنتج بعد الخصم
 * Calculates product price after discount
 * 
 * @param price - السعر الأصلي
 * @param discount - نسبة الخصم (0-100)
 * @returns السعر بعد الخصم
 */
function calculateDiscount(price: number, discount: number): number {
  // تطبيق الحد الأقصى للخصم
  const cappedDiscount = Math.min(discount, MAX_DISCOUNT);
  return price * (1 - cappedDiscount / 100);
}
```

---

## 🔄 عملية Submit Pull Request

### 1. إنشاء فرع | Create Branch

```bash
# من فرع main، أنشئ فرعك
git checkout main
git pull origin main

# اسم الفرع يجب أن يصف التغيير
git checkout -b feature/user-profile-page
# أو
git checkout -b fix/login-bug
```

### قواعد تسمية الفروع | Branch Naming

| النوع | البادئة | مثال |
|-------|---------|------|
| ميزة جديدة | `feature/` | `feature/dark-mode` |
| إصلاح | `fix/` | `fix/header-scroll-bug` |
| توثيق | `docs/` | `docs/api-guide` |
| refactor | `refactor/` | `refactor/auth-system` |
| اختبارات | `test/` | `test/payment-flow` |

### 2. كتابة الكود والتغييرات

```bash
# تأكد من أن الكود يتبع المعايير
npm run lint

# شغّل الاختبارات
npm test

# تأكد من البناء يعمل
npm run build
```

### 3. Commit Changes

استخدم [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### الأمثلة:

```bash
# ميزة جديدة
git commit -m "feat(auth): add two-factor authentication"

# إصلاح
git commit -m "fix(listings): resolve image upload crash"

# توثيق
git commit -m "docs(readme): update installation instructions"

# اختبارات
git commit -m "test(payments): add PayPal sandbox tests"
```

#### الأنواع المدعومة:

| Type | الوصف |
|------|-------|
| `feat` | ميزة جديدة |
| `fix` | إصلاح خطأ |
| `docs` | تغيير في التوثيق |
| `style` | تنسيق الكود (لا يؤثر على المنطق) |
| `refactor` | إعادة هيكلة |
| `perf` | تحسين الأداء |
| `test` | إضافة/تحديث اختبارات |
| `chore` | صيانة عامة |

### 4. Push وفتح PR

```bash
# رفع الفرع
git push origin feature/your-feature-name

# ثم افتح PR على GitHub
```

### قالب Pull Request

```markdown
## 📝 Description
وصف موجز للتغييرات...

## 🎯 Type of Change
- [ ] Bug fix (إصلاح خطأ غير ي السلوك الصحيح)
- [ ] New feature (ميزة جديدة لا تكسر ميزات موجودة)
- [ ] Breaking change (تغيير يكسر التوافق)

## ✅ Checklist
- [ ] الكود يتبع معايير المشروع
- [ ] مررت الاختبارات (`npm test`)
- [ ] البناء يعمل (`npm run build`)
- [ ] أضفت/حدثت التوثيق
- [ ] أضفت اختبارات جديدة (إنطبق)

## 📸 Screenshots (إنطبق)
أضف لقطات شاشة للتغييرات المرئية...
```

---

## 🐛 تقرير الأخطاء | Bug Reports

### قبل الإبلاغ

- [ ] بحثت في Issues الموجودة
- [ ] تأكدت من استخدام أحدث إصدار
- [ ] جربت إعادة إنتاج المشكلة

### قالب الإبلاغ

```markdown
## 🐛 وصف الخطأ | Bug Description
وصف واضح وموجز...

## 🔄 خطوات إعادة الإنتاج | Steps to Reproduce
1. اذهب إلى '...'
2. اضغط on '....'
3. مرر إلى '...'
4. راى الخطأ

## 📸 المتوقع vs الفعلي | Expected vs Actual
- **المتوقع**: ما الذي كان يجب أن يحدث؟
- **الفعلي**: ماذا حدث فعلاً؟

## 🖥️ البيئة | Environment
- **المتصفح**: [e.g., Chrome 120, Safari 17]
- **نظام التشغيل**: [e.g., macOS 14, Windows 11]
- **الجهاز**: [e.g., iPhone 12, Desktop]
- **الإصدار**: [e.g., v1.2.3]

## 📎 مرفقات إضافية | Additional Context
- لقطات شاشة
- سجل الأخطاء (Console logs)
- أي معلومات إضافية...
```

---

## 💡 اقتراح الميزات | Feature Requests

### ق_template الاقتراح

```markdown
## 🚀 وصف الميزة | Feature Description
وصف واضح للميزة المقترحة...

## 🎯 المشكلة/Cause | Problem Statement
ما المشكلة التي تحلها هذه الميزة؟

## 💡 الحل المقترح | Proposed Solution
كيف تقترح تنفيذها؟

## 📊 البدائل Alternatives
هل هناك حلول أخرى فكرت فيها?

## 📐 تصميم مقترح | Mockups (optional)
أضف رسومات أو وصف بصري...
```

---

## 🎨 دليل نمط الكود | Style Guide

### CSS/Tailwind

```tsx
// ✅ Good: استخدام classes موحدة
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  
// ❌ Bad: inline styles مفرطة
<div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
```

### هيكل المكونات

```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Types/Interfaces
interface Props { ... }

// 3. Constants
const MAX_ITEMS = 10;

// 4. Component
export function ComponentName({ ... }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return (
    <div>
      ...
    </div>
  );
}
```

### التعامل مع API Errors

```typescript
// ✅ Good: معالجة أخطاء واضحة
async function fetchListings() {
  try {
    const data = await listingsApi.getAll();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

## 🌍 الدعم اللوي | i18n Support

المشروع يدعم العربية بشكل أساسي. عند إضافة نص جديد:

```tsx
// ✅ Good: استخدام ثوابت للنصوص
const TEXTS = {
  title: 'عنوان الصفحة',
  description: 'وصف الصفحة',
  button: 'اضغط هنا',
};

// أو استخدام مكتبة i18n إذا كانت متوفرة
```

---

## 📞 الحصول على مساعدة | Getting Help

- 💬 **Slack/Discord**: انضم لمجتمعنا
- 📧 **Email**: dev@mavora.ma
- 🐛 **GitHub Issues**: ل reporting bugs
- 💡 **GitHub Discussions**: لأسئلة ومناقشات

---

## 📜 ترخيص | License

بالمساهمة، توافق على أن مساهماتك ستخضع لترخيص [MIT](./LICENSE).

---

<div align="center">

**شكراً لمساهمتك! 🎉**

**Thanks for contributing! 🎉**

[⬆️ العودة للأعلى](#--دليل-المساهمة-في-مافورا--contributing-to-mavora)

</div>
