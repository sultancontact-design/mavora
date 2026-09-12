# 🔴 حل مشكلة Vercel - المفاتيح الصحيحة

## المشكلة:
مفتاح `sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc` **ليس** ANON_KEY الصحيح!

---

## ✅ الحل: احصل على ANON_KEY الحقيقي

### الخطوة 1: سجل دخولك في Supabase
```
https://supabase.com/dashboard/sign-in
```

### الخطوة 2: اذهب لإعدادات API
```
https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/settings/api
```

### الخطوة 3: انسخ المفاتيح من هناك

ستجد صفحة كهذه:

```
┌─────────────────────────────────────────────────────────────┐
│  Project API keys                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 Project URL                                             │
│  https://kyanecjjautqmuowbtvy.supabase.co                   │
│  [Copy]                                                     │
│                                                             │
│  🔑 anon (public)                                           │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...███████████████   │
│  [Copy]  ← انسخ هذا! هذا هو ANON_KEY الصحيح                │
│                                                             │
│  🔐 service role (secret)                                   │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...███████████████   │
│  [Copy]  ← انسخ هذا أيضاً!                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 القيم الصحيحة لـ Vercel:

بعد نسخ المفاتيح من الصفحة أعلاه، أضفها في Vercel:

| اسم المتغير | القيمة |
|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kyanecjjautqmuowbtvy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **الصق هنا الـ anon key الذي نسخته** (يبدأ بـ `eyJhbGciOiJIUzI1NiIs...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **الصق هنا الـ service role** (يبدأ بـ `eyJhbGciOiJIUzI1NiIs...`) |
| `JWT_SECRET` | `mavora-super-secret-jwt-key-2024-production-minimum-32-chars!` |
| `NEXT_PUBLIC_APP_URL` | `https://my-project-nu-nine-64.vercel.app` |

---

## ⚠️ ملاحظة مهمة:

- **anon key** يبدأ دائماً بـ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service role** يبدأ بنفس الشيء لكنه أطول
- **sb_publishable_** هو مفتاح مختلف (للـ Stripe/الدفع وليس لـ Supabase API)

---

## 🎯 الخطوات السريعة:

1. **افتح:** https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/settings/api
2. **انسخ** الـ "anon (public)" key
3. **اذهب لـ Vercel** → Settings → Environment Variables
4. **الصق** الـ anon key في `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **اضغط Save** (لن يحمر الإطار الآن ✅)
6. **Redeploy**

---

**الفرق بين المفاتيح:**

| المفتاح | يبدو بـ | الاستخدام |
|---------|---------|-----------|
| `sb_publishable_` | `sb_publishable_...` | ❌ للدفع فقط |
| `anon` | `eyJhbGciOiJIUzI1NiIs...` | ✅ **هذا ما تحتاجه** |
| `service_role` | `eyJhbGciOiJIUzI1NiIs...` | ✅ للعمليات_admin |

---

**بعد إضافة المفتاح الصحيح، سيعمل كل شيء!** 🚀
