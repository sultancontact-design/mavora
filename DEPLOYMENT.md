# 🚀 Mavora - دليل النشر الإنتاجي
# Production Deployment Guide

## 📋 جدول المحتويات | Table of Contents

1. [المتطلبات المسبقة](#-المتطلبات-المسبقة)
2. [الإعداد على Vercel (موصى به)](#-الإعداد-على-vercel-موصى-به)
3. [الإعداد على خادم خاص (Docker)](#-الإعداد-على-خادم-خاص-docker)
4. [إعداد Supabase](#-إعداد-supabase)
5. [إعداد PayPal](#-إعداد-paypal)
6. [إعداد Payoneer](#-إعداد-payoneer)
7. [إعداد المصادقة الثنائية (2FA)](#-إعداد-المصادقة-الثنائية-2fa)
8. [التحقق من النشر](#-التحقق-من-النشر)
9. [استكشاف الأخطاء](#-استكشاف-الأخطاء)

---

## ✅ المتطلبات المسبقة

### قبل البدء، تأكد من توفر:
- [ ] حساب على [Vercel](https://vercel.com) أو خادم مع Docker
- [ ] مشروع على [Supabase](https://supabase.com) (الخطة المجانية كافية للبداية)
- [ ] حساب مطور PayPal (للدفع)
- [ ] حساب Payoneer (للتحويلات المالية في المغرب)
- [ ] نطاق خاص (مثلاً: `mavora.ma`)
- [ ] حساب Cloudflare (اختياري - للـ CDN و DNS)

---

## 🌐 الإعداد على Vercel (موصى به)

Vercel هو الخيار الأفضل لتطبيقات Next.js لأنه:
- بناء تلقائي عند كل push إلى GitHub
- SSL مجاني
- CDN عالمي
- Edge Functions سريعة

### الخطوة 1: ربط المستودع

```bash
# 1. ادفع الكود إلى GitHub
git init
git add .
git commit -m "Initial commit: Mavora Marketplace"
git remote add origin https://github.com/YOUR_USERNAME/mavora.git
git push -u origin main
```

### الخطوة 2: إعداد المشروع على Vercel

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. استورد مستودع GitHub الخاص بك
3. اعدادات البناء:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### الخطوة 3: إضافة متغيرات البيئة

في Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://mavora.ma
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
JWT_SECRET=generate-with-openssl-rand-base64-32
```

### الخطوة 4: إعداد النطاق

1. في Project Settings → Domains
2. أضف `mavora.ma`
3. في مزود النطاق (مثل GoDaddy, Namecheap):
   - أضف CNAME: `mavora.ma` → `cname.vercel-dns.com`
   - أو A Record: `@` → `76.76.21.21`

---

## 🐳 الإعداد على خادم خاص (Docker)

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-mavora2024}

volumes:
  redis_data:
```

### تشغيل على الخادم

```bash
# 1. انسخ ملف البيئة
cp .env.example .env
# عدل .env بقيمك الحقيقية

# 2. ابنِ وشغّل الحاويات
docker-compose up -d --build

# 3. تحقق من التشغيل
docker-compose logs -f app

# 4. إعداد Nginx (عكس الوكيل)
sudo nano /etc/nginx/sites-available/mavora
```

### إعداد Nginx

```nginx
server {
    listen 80;
    server_name mavora.ma www.mavora.ma;

    # إعادة التوجيه إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mavora.ma www.mavora.ma;

    # شهادة SSL (استخدم Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/mavora.ma/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mavora.ma/privkey.pem;

    # إعدادات أمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # دعم RTL واللغة العربية
        proxy_set_header Accept-Language ar;
    }

    # تخزين مؤقت للملفات الثابتة
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 365d;
        access_log off;
    }
}
```

```bash
# تفعيل الموقع وإعادة تشغيل Nginx
sudo ln -s /etc/nginx/sites-available/mavora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# الحصول على شهادة SSL مجانية
sudo certbot --nginx -d mavora.ma -d www.mavora.ma
```

---

## 🗄️ إعداد Supabase

### 1. إنشاء مشروع جديد

1. اذهب到 [supabase.com](https://supabase.com)
2. أنشئ مشروعاً جديداً
3 اختر المنطقة: `EU West Ireland` (الأقرب للمغرب)

### 2. تشغيل ترحيل قاعدة البيانات

```bash
# ثبّت CLI
npm install -g supabase

# سجّل الدخول
supabase login

# ربط بالمشروع
supabase link --project-ref your-project-id

# شغّل الترحيلات
supabase db push
```

### 3. إعدادات Row Level Security (RLS)

تأكد من تفعيل RLS على جميع الجداول الحساسة:

```sql
-- تفعيل RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسات أساسية
CREATE POLICY "Users can view all listings"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
```

### 4. إعداد التخزين (Storage)

في لوحة تحكم Supabase:
1. أنشئ bucket جديد: `listings-images`
2. اضبط Policies:
   - PUBLIC: SELECT (الجميع يمكنه رؤية الصور)
   - AUTHENTICATED: INSERT (المسجلون فقط يرفعون)

---

## 💳 إعداد PayPal

### 1. إنشاء تطبيق PayPal

1. اذهب إلى [developer.paypal.com](https://developer.paypal.com)
2. سجّل الدخول / أنشئ حساباً
3. اذهب إلى Applications → Create App
4. اختر:
   - **App Type**: Merchant
   - **Sandbox/Live**: ابدأ بـ Sandbox

### 2. الحصول على API Keys

```
Client ID: AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Client Secret: ELxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. إعداد Webhook

1. في PayPal Dashboard → Webhooks
2. أضف Webhook URL: `https://mavora.ma/api/payments/webhook/paypal`
3 فعّل الأحداث:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

### 4. اختبار في Sandbox

1. أنشئ حسابات اختبار في PayPal Sandbox
2. استخدم بطاقات اختبار:
   - **Visa**: `4032031033976830`
   - **Mastercard**: `5555555555554444`
   - **تاريخ الانتهاء**: أي تاريخ مستقبلي
   - **CVV**: `123`

---

## 💰 إعداد Payoneer

### 1. تسجيل كشريك

1. اذهب إلى [developer.payoneer.com](https://developer.payoneer.com)
2. قدّم طلب الشراكة
3. احصل على بيانات API:

```
Client ID: your-client-id
Client Secret: your-client-secret
Partner ID: your-partner-id
```

### 2. إعداد بيئة الاختبار

```bash
# للاختبار، استخدم:
PAYONEER_ENVIRONMENT=sandbox
PAYONEER_SANDBOX_URL=https://api.sandbox.payoneer.com
```

### 3. إعداد عمليات السحب للمغرب

Payoneer يدعم:
- ✅ التحويل البنكي للمغرب
- ✅ بطاقات Payoneer Mastercard
- ✅ السحب المحلي بالدرهم المغربي (MAD)

---

## 🔐 إعداد المصادقة الثنائية (2FA)

### خيار 1: Twilio (موصى به)

1. سجّل في [twilio.com](https://twilio.com)
2. اشترِ رقم هاتف (+212 للمغرب)
3. احصل على:
   - Account SID
   - Auth Token

### خيار 2: Infobip (أفضل للمغرب)

1. سجّل في [infobip.com](https://infobip.com)
2. Infobip لديه تغطية ممتازة للمغرب
3. أسعار أرخص للرسائل المحلية

### خيار 3: بريد إلكتروني (مجاني)

استخدم SMTP عادي (Gmail مثلاً):
- فعّل 2-Step Verification
- أنشئ App Password

---

## ✅ التحقق من النشر

### قائمة التحقق قبل الإطلاق

```bash
# 1. تشغيل الاختبارات
npm run test

# 2. فحص نوع البناء
npm run build
# تأكد من عدم وجود أخطاء

# 3. فحص Lighthouse Score
npx lighthouse https://mavora.ma --view --output html
# الهدف:
# - Performance > 90
# - Accessibility > 95
# - Best Practices > 90
# - SEO > 95

# 4. فحص PWA
npx pwa-builder https://mavora.ma
```

### نقاط النهاية للتحقق

```
GET /api/health          → حالة الخدمة
GET /api/ready           → جاهزية قاعدة البيانات
GET /api/version         → نسخة التطبيق
```

### فحوصات ما بعد النشر

- [ ] الصفحة الرئيسية تعمل
- [ ] تسجيل الدخول يعمل
- [ ] رفع الصور يعمل
- [ ] البحث بالعربية يعمل
- [ ] RTL يعمل بشكل صحيح
- [ ] PWA قابل للتثبيت
- [ ] Push Notifications تعمل
- [ ] صفحة Offline تظهر
- [ ] SSL نشط
- [ ] التحميل سريع (< 3 ثوانٍ)

---

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| `EADDRINUSE: address already in use` | `lsof -i :3000 && kill -9 <PID>` |
| `Database connection failed` | تحقق من SUPABASE_URL و keys |
| `PayPal auth failed` | تأكد من Client ID/Secret و Mode |
| `RTL not working` | تأكد من `<html dir="rtl" lang="ar">` |
| `Images not loading` | تحقق من STORAGE_PROVIDER و S3/Supabase config |
| `Build fails on Vercel` | تحقق من Node.js version في package.json |

### سجلات التصحيح

```bash
# عرض السجلات مباشرة
vercel logs mavora

# على Docker
docker-compose logs -f app

# فحص موارد النظام
docker stats
```

### أدوات مفيدة

```bash
# فحص أداء API
curl -w "\nTime: %{time_total}s\n" https://mavora.ma/api/health

# فحص Headers
curl -I https://mavora.ma

# فحص SSL
openssl s_client -connect mavora.ma:443 -servername mavora.ma
```

---

## 📞 الدعم والمساعدة

### روابط مفيدة

- **وثائق Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **وثائق Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **PayPal Developer**: [developer.paypal.com](https://developer.paypal.com)
- **دعم Vercel**: [vercel.com/support](https://vercel.com/support)

### المجتمع

- **Discord**: [Mavora Community](#)
- **البريد**: support@mavora.ma
- **GitHub Issues**: [github.com/username/mavora/issues](#)

---

## 📄 ترخيص

© 2024 Mavora. جميع الحقوق محفوظة.

**Made with ❤️ for Morocco 🇲🇦**
