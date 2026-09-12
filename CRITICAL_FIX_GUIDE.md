# 🚨 إصلاح حرج لموقع Mavora - دليل التنفيذ الفوري

## ملخص المشكلة

| المشكلة | الحالة | الأثر |
|---------|--------|-------|
| متغيرات البيئة مفقودة في Vercel | 🔴 حرج | الموقع لا يتصل بـ Supabase |
| RLS يحظر الوصول لجميع الجداول | 🔴 حرج | لا تظهر أي بيانات |
| المجموع: **صفر بيانات** | 💥 | الموقع فارغ تماماً |

---

## ✅ TASK 1: إعداد متغيرات البيئة في Vercel (5 دقائق)

### الخطوات:

1. **افتح Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **اختر مشروع Mavora:**
   - اسم المشروع: `my-project-nu-nine-64` 
   - أو URL: `https://my-project-nu-nine-64.vercel.app`

3. **اذهب إلى الإعدادات:**
   ```
   Settings → Environment Variables
   ```

4. **أضف هذه المتغيرات (انسخ والصق):**

   | الاسم | القيمة | البيئة |
   |-------|--------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://kyanecjjautqmuowbtvy.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTgzNjIsImV4cCI6MjEwMzg3NDM2Mn0.1A7BCO0f2BQp8QS8YiCKBfqkS-8v4cgCmTIxP5hHZEY` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3cidHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0` | Production, Preview, Development |
   | `JWT_SECRET` | `mavora-super-secret-jwt-key-2024-production-minimum-32-chars!` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://my-project-nu-nine-64.vercel.app` | Production, Preview, Development |

5. **احفظ المتغيرات:**
   - اضغط على **Save** بعد كل متغير
   - تأكد من تحديد جميع البيئات (Production + Preview + Development)

---

## ✅ TASK 2: إصلاح سياسات RLS في Supabase (5 دقائق)

### المشكلة:
```
🔒 جميع الجداول الـ 10 محظورة بواسطة RLS
   → لا يمكن للمستخدمين المجهولين قراءة أي بيانات
   → النتيجة: موقع فارغ تماماً
```

### الحل:

1. **افتح Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy/sql
   ```

2. **انسخ والصق هذا السكريبت الكامل:**

```sql
-- ===========================================
-- MAVORA - CRITICAL RLS FIX SCRIPT
-- ===========================================

-- 1. LISTINGS TABLE (Most Critical)
DROP POLICY IF EXISTS "Allow public select" ON listings;
CREATE POLICY "Allow public select" ON listings FOR SELECT USING (status = 'active');

-- 2. CATEGORIES TABLE (Critical for UI)
DROP POLICY IF EXISTS "Allow public select" ON categories;
CREATE POLICY "Allow public select" ON categories FOR SELECT USING (true);

-- 3. PROFILES TABLE (For seller info)
DROP POLICY IF EXISTS "Allow public select" ON profiles;
CREATE POLICY "Allow public select" ON profiles FOR SELECT USING (true);

-- 4. CITIES TABLE (For location dropdown)
DROP POLICY IF EXISTS "Allow public select" ON cities;
CREATE POLICY "Allow public select" ON cities FOR SELECT USING (true);

-- 5. REVIEWS TABLE (For listing reviews)
DROP POLICY IF EXISTS "Allow public select" ON reviews;
CREATE POLICY "Allow public select" ON reviews FOR SELECT USING (true);
```

3. **اضغط Run** (أو Ctrl+Enter)

4. **تحقق من النتائج:**
   ```sql
   -- يجب أن تعرض هذه الاستعلامات بيانات:
   SELECT count(*) FROM listings;
   SELECT count(*) FROM categories;
   SELECT count(*) FROM profiles;
   SELECT count(*) FROM cities;
   ```

---

## ✅ TASK 3: إعادة النشر في Vercel (2 دقيقة)

### الخيار أ: من Vercel Dashboard (الأسهل)

1. **اذهب إلى Deployments:**
   ```
   https://vercel.com/sultancontact-design/mavora/deployments
   ```

2. **اختر آخر نشر** واضغط على ⋯ (ثلاث نقاط)

3. **اختر "Redeploy"**

4. **فعّل خيار:** ☑️ Use existing Build Cache: ❌ No (بناء نظيف)

5. **اضغط Redeploy**

### الخيار ب: من GitHub (تلقائي)

إذا كان لديك Integration مع GitHub:
- ادفع أي تغيير صغير إلى الفرع `main`
- سيعيد Vercel النشر تلقائياً

---

## ✅ TASK 4: اختبار الموقع (5 دقائق)

### بعد اكتمال النشر، اختبر هذه الروابط:

| الصفحة | URL | المتوقع |
|--------|-----|---------|
| الرئيسية | `https://my-project-nu-nine-64.vercel.app` | إعلانات فعلية + إحصائيات |
| الإعلانات | `/listings` | قائمة بالإعلانات |
| تفاصيل إعلان | `/listings/1` (أي ID) | تفاصيل كاملة |
| التسجيل | `/auth/signup` | نموذج يعمل |
| لوحة التحكم | `/admin-login` | نموذج دخول |
| API Stats | `/api/public/stats` | JSON بإحصائيات |

### اختبار API مباشر:

```bash
# Test if API returns data
curl -s https://my-project-nu-nine-64.vercel.app/api/public/stats | jq .

# Test listings endpoint
curl -s "https://my-project-nu-nine-64.vercel.app/api/listings?limit=5" | jq '.[0]'

# Test categories
curl -s https://my-project-nu-nine-64.vercel.app/api/categories | jq '.[0]'
```

---

## 📊 نتائج التحقق الحالية

### قاعدة البيانات:
| الججدول | موجود | الوصول العام |
|---------|--------|--------------|
| listings | ✅ | 🔒 محظور (يحتاج إصلاح RLS) |
| profiles | ✅ | 🔒 محظور |
| categories | ✅ | 🔒 محظور |
| messages | ✅ | 🔒 محظور (صحيح - خاص) |
| transactions | ✅ | 🔒 محظور (صحيح - خاص) |
| conversations | ✅ | 🔒 محظور (صحيح - خاص) |
| favorites | ✅ | 🔒 محظور (صحيح - خاص) |
| reviews | ✅ | 🔒 محظور |
| notifications | ✅ | 🔒 محظور (صحيح - خاص) |
| cities | ✅ | 🔒 محظور |

### الملفات المُعدة:
- ✅ `.env.local` - جاهز للتطوير المحلي
- ✅ `scripts/fix-rls-policies.sql` - سكريبت إصلاح RLS
- ✅ `scripts/verify-supabase.js` - أداة التحقق
- ✅ `scripts/set-vercel-env.js` - أداة إعداد Env (تحتاج token صالح)

---

## ⚡ الخطوات المصغرة (Quick Fix)

إذا كنت تريد أسرع حل:

1. **Vercel Dashboard** → Settings → Environment Variables → أضف الـ 5 متغيرات
2. **Supabase SQL Editor** → انسخ سكريبت RLS → Run
3. **Vercel** → Redeploy
4. **اختبر الموقع**

**الوقت التقريبي:** 10-15 دقيقة

---

## 🆘 المساعدة

إذا واجهت أي مشكلة:
- **Vercel Docs:** https://vercel.com/docs/environment-variables
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase Dashboard:** https://supabase.com/dashboard/project/kyanecjjautqmuowbtvy

---

**آخر تحديث:** 2026-09-13  
**الحالة:** ⏳ بانتظار تنفيذ المستخدم
