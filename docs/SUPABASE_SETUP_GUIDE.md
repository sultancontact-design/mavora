# 🗄️ دليل إعداد Supabase - MAVORA

**الضرورة:** 🔴 حرجة - المشروع لا يعمل بدون هذا الإعداد  
**الوقت المقدر:** 30-45 دقيقة  
**الصعوبة:** متوسطة

---

## 📋 المتطلبات المسبقة

- حساب على [Supabase](https://supabase.com) (مجاني)
- الوصول إلى مشروع Vercel
- معرفة أساسية بقواعد البيانات

---

## 🔧 الخطوة 1: إنشاء مشروع Supabase

### 1.1 تسجيل الدخول
1. اذهب إلى [https://supabase.com](https://supabase.com)
2. سجل الدخول بحساب GitHub/Google

### 1.2 إنشاء مشروع جديد
1. اضغط على **"New Project"**
2. اختر منظمتك (أو أنشئ واحدة)
3. أدخل المعلومات:
   - **Name:** `mavora-production` (أو أي اسم تفضله)
   - **Database Password:** أنشئ كلمة قوية واحفظها!
   - **Region:** اختر الأقرب لعملائك (`eu-west-1` أو `us-east-1`)
   - **Plan:** Free (كافي للبداية)

4. اضغط **"Create new project"**
5. انتظر 2-3 دقائق حتى يجهز المشروع

---

## 🔑 الخطوة 2: الحصول على مفاتيح API

### 2.1 نسخ المفاتيح
1. من لوحة تحكم Supabase، اذهب إلى **Settings → API**
2. انسخ القيم التالية:

```
Project URL (NEXT_PUBLIC_SUPABASE_URL):
https://xxxxxxxxxxxxx.supabase.co

anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

service_role (SUPABASE_SERVICE_ROLE_KEY):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **تحذير:** لا تشارك `service_role_key` أبداً! هذا المفتاح يتجاوز جميع قواعد الأمان.

---

## 💻 الخطوة 3: تشغيل Migration

### 3.1 الطريقة الأسهل (موصى بها)

1. من لوحة التحكم، اذهب إلى **SQL Editor**
2. اضغط على **"New query"**
3. افتح ملف `/home/z/my-project/prisma/migrations/20260103000000_init/migration.sql`
4. انسخ كل المحتوى والصقه في المحرر
5. اضغط **"Run" (Ctrl+Enter)**

### 3.2 الطريقة البديلة (CLI)

```bash
# تثبيت Supabase CLI (اختياري)
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط بالمشروع
supabase link --project-ref YOUR_PROJECT_ID

# تشغيل الـ migration
supabase db push
```

### 3.3 التحقق من النجاح

بعد التشغيل، يجب أن ترى:
- ✅ 40+ جدول في **Table Editor**
- ✅ جداول مثل: `users`, `profiles`, `listings`, `categories`, `cities`, إلخ

---

## 🌐 الخطوة 4: إعداد Vercel Environment Variables

### 4.1 إضافة المتغيرات

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروع **mavora**
3. اذهب إلى **Settings → Environment Variables**
4. أضف المتغيرات الثلاثة:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production فقط |

### 4.2 إعادة النشر

بعد إضافة المتغيرات:
1. اذهب إلى **Deployments**
2. اختر آخر نشر
3. اضغط على **"Redeploy"** (مع خيار إعادة بناء الكاش)

---

## ✅ الخطوة 5: التحقق من الاتصال

### 5.1 فحص Health API

بعد إعادة النشر، افتح:
```
https://your-domain.vercel.app/api/health
```

المتوقع:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "storage": true,
    "auth": true
  },
  "timestamp": "2026-09-03T12:00:00.000Z",
  "uptime": 123.456
}
```

إذا كانت `database: false`:
- تأكد من صحة URL و API Key
- تأكد من تشغيل Migration

### 5.2 اختبار الموقع

1. افتح الصفحة الرئيسية
2. حاول:
   - ✅ عرض التصنيفات (يجب تظهر من DB)
   - ✅ تسجيل حساب جديد
   - ✅ نشر إعلان تجريبي

---

## 🔒 الخطوة 6: إعدادات الأمان (مهمة!)

### 6.1 تفعيل Row Level Security (RLS)

من لوحة التحكم، فعّل RLS للجداول الحساسة:

```sql
-- فعّل RLS للجداول الخاصة
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
```

### 6.2 سياسات RLS الأساسية

```sql
-- يمكن للجميع قراءة الإعلانات النشطة
CREATE POLICY "Public listings are viewable by everyone"
  ON listings FOR SELECT
  USING (status = 'active');

-- المستخدمون يمكنهم تعديل بروفاتهم فقط
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء إعلاناتهم فقط
CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
```

### 6.3 إعدادات المصادقة (Auth)

1. اذهب إلى **Authentication → Providers**
2. فعّل **Email** provider
3. (اخياري) فعّل Google/GitHub OAuth

---

## 📊 الخطوة 7: بيانات أولية (Seed Data)

### 7.1 إضافة تصنيفات ومدن

من **SQL Editor**، شغّل:

```sql
-- إضافة تصنيفات أساسية
INSERT INTO categories (id, name, name_ar, name_fr, slug, icon, sort_order, is_active, created_at) VALUES
('vehicles', 'Vehicles', 'سيارات', 'Véhicules', 'vehicles', '🚗', 1, true, NOW()),
('real-estate', 'Real Estate', 'عقارات', 'Immobilier', 'real-estate', '🏠', 2, true, NOW()),
('electronics', 'Electronics', 'إلكترونيات', 'Électronique', 'electronics', '📱', 3, true, NOW()),
('jobs', 'Jobs', 'وظائف', 'Emplois', 'jobs', '💼', 4, true, NOW()),
('services', 'Services', 'خدمات', 'Services', 'services', '🔧', 5, true, NOW()),
('fashion', 'Fashion', 'أزياء', 'Mode', 'fashion', '👗', 6, true, NOW()),
('sports', 'Sports', 'رياضة', 'Sports', 'sports', '⚽', 7, true, NOW()),
('home-garden', 'Home & Garden', 'المنزل والحديقة', 'Maison & Jardin', 'home-garden', '🌸', 8, true, NOW()),
('education', 'Education', 'تعليم', 'Éducation', 'education', '📚', 9, true, NOW()),
('animals', 'Animals', 'حيوانات', 'Animaux', 'animals', '🐾', 10, true, NOW()),
('kids', 'Kids & Baby', 'أطفال ورضع', 'Enfants & Bébés', 'kids', '👶', 11, true, NOW()),
('entertainment', 'Entertainment', 'ترفيه', 'Divertissement', 'entertainment', '🎮', 12, true, NOW());

-- إضافة دول
INSERT INTO countries (id, name, name_ar, name_fr, code, flag_emoji, is_active, created_at) VALUES
('morocco', 'Morocco', 'المغرب', 'Maroc', 'MA', '🇲🇦', true, NOW()),
('algeria', 'Algeria', 'الجزائر', 'Algérie', 'DZ', '🇩🇿', true, NOW()),
('tunisia', 'Tunisia', 'تونس', 'Tunisie', 'TN', '🇹🇳', true, NOW()),
('egypt', 'Egypt', 'مصر', 'Égypte', 'EG', '🇪🇬', true, NOW());

-- إضافة مدن مغربية
INSERT INTO cities (id, country_id, name, name_ar, name_fr, slug, region, is_major, is_active, population, created_at)
SELECT 
  gen_random_uuid()::text,
  'morocco',
  name,
  name_ar,
  name_fr,
  lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g')),
  region,
  true,
  true,
  floor(random() * 1000000 + 100000),
  NOW()
FROM (VALUES
  ('Casablanca', 'الدار البيضاء', 'Casablanca', 'Grand Casablanca'),
  ('Rabat', 'الرباط', 'Rabat', 'Rabat-Salé-Kénitra'),
  ('Marrakech', 'مراكش', 'Marrakech', 'Marrakech-Safi'),
  ('Fes', 'فاس', 'Fès', 'Fès-Meknès'),
  ('Tangier', 'طنجة', 'Tanger', 'Tanger-Tétouan-Al Hoceïma'),
  ('Agadir', 'أكادير', 'Agadir', 'Souss-Massa'),
  ('Meknes', 'مكناس', 'Meknès', 'Fès-Meknès'),
  ('Oujda', 'وجدة', 'Oujda', 'Oriental')
) AS t(name, name_ar, name_fr, region);

-- إضافة عملات
INSERT INTO currencies (code, name, name_ar, name_fr, symbol, symbol_position, decimal_places, is_default, exchange_rate_to_usd, is_active, created_at) VALUES
('MAD', 'Moroccan Dirham', 'درهم مغربي', 'Dirham marocain', 'MAD', 'before', 2, true, 0.10, true, NOW()),
('USD', 'US Dollar', 'دولار أمريكي', 'Dollar américain', '$', 'before', 2, false, 1.00, true, NOW()),
('EUR', 'Euro', 'يورو', 'Euro', '€', 'before', 2, false, 1.08, true, NOW());
```

---

## 🚨 استكشاف الأخطاء وإصلاحها

### المشكلة: `"status": "degraded"` أو `"unhealthy"`

**الأسباب المحتملة:**
1. ❌ متغيرات بيئة غير صحيحة
2. ❌ Migration لم يُشغَّل
3. ❌ قاعدة البيانات معطلة

**الحل:**
1. تحقق من صحة المتغيرات في Vercel
2. أعد تشغيل Migration
3. تحقق من logs في Vercel → Logs

### المشكلة: `AuthApiError: invalid api key`

**الحل:**
- تأكد من نسخ `anon` key وليس `service_role` لـ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### المشكلة: الإعلانات لا تظهر

**الحل:**
1. تحقق من وجود بيانات في جدول `listings`
2. تأكد من `status = 'active'`
3. تحقق من RLS policies

---

## 📝 قائمة تحقق نهائية

- [ ] إنشاء مشروع Supabase جديد
- [ ] نسخ URL و API Keys
- [ ] تشغيل SQL Migration بنجاح
- [ ] إضافة Environment Variables في Vercel
- [ ] إعادة نشر المشروع
- [ ] فحص `/api/health` → `"status": "healthy"`
- [ ] تسجيل حساب تجريبي
- [ ] نشر إعلان تجريبي
- [ ] تفعيل RLS على الجداول الحساسة
- [ ] إضافة بيانات أولية (تصنيفات، مدن، عملات)

---

## 🆘 المساعدة

إذا واجهت مشاكل:

1. **Logs:** Vercel → Deployments → [آخر نشر] → Logs
2. **Supabase Logs:** Supabase Dashboard → Logs
3. **Documentation:** [Supabase Docs](https://supabase.com/docs)
4. **GitHub Issues:** [MAVORA Repository](https://github.com/sultancontact-design/mavora/issues)

---

**✅ بعد إتمام هذه الخطوات، ستكون MAVORA جاهزة للاستخدام الفعلي!**

---

*آخر تحديث: 2026-09-03*  
*بواسطة: Super Z AI Assistant*
