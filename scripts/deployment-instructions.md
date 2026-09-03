# 🚀 تعليمات نشر التحديثات

## المشكلة
GitHub يمنع النشر بسبب وجود سر (Cloudflare API Token) في commit سابق في ملف `.env`.

## الحلول

### الخيار 1: السماح بالسر (الأسهل)
1. اذهب إلى: https://github.com/sultancontact-design/mavora/security/secret-scanning
2. ابحث عن الـ Secret المحظور
3. اختر "Allow secret" للمتابعة

### الخيار 2: إزالة .env من Git
```bash
# إضافة .env إلى .gitignore
echo ".env" >> .gitignore

# حذفه من التتبع (بدون حذف الملف الفعلي)
git rm --cached .env

# إعادة الإcommit والنشر
git add .gitignore
git commit -m "chore: remove .env from tracking"
git push origin main
```

## التغييرات التي تحتاج للنشر

### 1. ✅ إصلاح API الإعلانات (`src/app/api/listings/route.ts`)
- **المشكلة**: أسماء أعمدة خاطئة (`name_ar`, `name_en` بدلاً من `nameAr`, `nameFr`)
- **الحل**: تصحيح أسماء الأعمدة لتطابق قاعدة البيانات

### 2. ✅ إضافة سكربت الصور (`scripts/add-listing-media.ts`)
- **الوظيفة**: إضافة 187 صورة placeholder للإعلانات
- **الحالة**: تم التنفيذ بنجاح على قاعدة البيانات

## النتيجة المتوقعة بعد النشر
- ✅ عرض 100 إعلان مع الصور والفئات
- ✅ نظام تسجيل يعمل بشكل كامل
- ✅ نظام تسجيل دخول يعمل (admin + user)
- ✅ بيانات مغربية واقعية

## بيانات الدخول للاختبار
- **Admin**: admin@mavora.ma / Mavora@2024!Admin
- **User**: testuser@mavora.ma / TestUser2024!Secure
