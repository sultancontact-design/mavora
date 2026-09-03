# 🚀 MAVORA - خيارات النشر

## ✅ الخيار 1: Vercel (الأسرع لـ Next.js)

```bash
# 1. ثبت Vercel CLI
npm i -g vercel

# 2. سجل الدخول
vercel login

# 3. انشر
vercel --prod
```

**أو من خلال:**
1. اذهب إلى https://vercel.com
2. استورد مستودع GitHub: `sultancontact-design/MAVORA-`
3. أضف متغيرات البيئة:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://kyanecjjautqmuowbtvy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc`
4. اضغط Deploy

---

## ☁️ الخيار 2: Cloudflare Pages (يتطلب إعدادات إضافية)

### الطريقة الصحيحة:

```bash
# 1. تثبت @cloudflare/next-on-pages
bun add -d @cloudflare/next-on-pages

# 2. أضف لـ next.config.ts:
experimental: {
  runtime: 'nodejs',
}

# 3. أنشئ worker.ts:
import { createNextServer } from '@cloudflare/next-on-pages';

const handler = createNextServer({
  // إعداداتك هنا
});

export default handler;

# 4. أنشر
npx wrangler deploy
```

---

## 🏠 الخيار 3: الخادم الخاص (VPS/Dedicated)

```bash
# 1. ابنِ للإنتاج
bun run build

# 2. شغّل
NODE_ENV=production bun .next/standalone/server.js

# 3. استخدم Nginx كـ reverse proxy
```

---

## 🔑 متغيرات البيئة المطلوبة

```env
# Supabase (مطلوبة)
NEXT_PUBLIC_SUPABASE_URL=https://kyanecjjautqmuowbtvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_GFdJgkCM6M193R_fwEdLRg_jU4cqoWc
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📊 حالة المشروع الحالية

### المراحل المكتملة:
- ✅ **Phase 0**: التدقيق والتخطيط (100%)
- ✅ **Phase 1**: الأساس - Auth, DB, Layout, i18n (100%)
- ✅ **Phase 2**: الإعلانات - CRUD, Media, Search, Filters (100%)
- ✅ **Phase 3**: المجتمع - Messages, Reports, Reviews, Notifications (100%)
- ✅ **Phase 4**: البائعون - Organizations, Profiles, Subscriptions (95%)
- ✅ **Phase 5**: الربح - Wallet, Tokens, Payments, Invoices (95%)
- ✅ **Phase 6**: Super Admin - Dashboard, Stats, Audit (90%)

### الإحصائيات:
- **29+ جدول** في قاعدة البيانات
- **45+ API endpoint**
- **3 لغات** مدعومة (AR, FR, EN)
- **مكونات UI**: 50+
- **اختبارات**: أساسية موجودة

---

## 🎯 الخطوات التالية

1. **النشر الفوري**: استخدم Vercel (خيار 1) - يستغرق 5 دقائق
2. **اختبارات E2E**: إضافة Playwright
3. **SEO**: sitemap, robots.txt, Open Graph
4. **Performance**: تحسين الصور والتحميل
5. **2FA للمشرفين**: أمان إضافي

---

**آخر تحديث**: 2026-09-03  
**بواسطة**: Super Z (AI Principal Engineer)
