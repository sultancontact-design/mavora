# 🚀 Mavora - دليل النشر الكامل | Deployment Guide

## 📋 جدول المحتويات

1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [إعداد البيئة](#إعداد-البيئة)
3. [النشر على Vercel](#النشر-على-vercel)
4. [النشر على خادم مخصص](#النشر-على-خادم-مخصص)
5. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
6. [إعداد Payment Providers](#إعداد-payment-providers)
7. [إعداد Push Notifications](#إعداد-push-notifications)
8. [التحقق من النشر](#التحقق-من-النشر)
9. [الصيانة والمراقبة](#الصيانة-والمراقبة)
10. [استكشاف الأخطاء وإصلاحها](#استكشاف-الأخطاء-وإصلاحها)

---

## المتطلبات الأساسية

### للتشغيل المحلي (Development):
```bash
# Required:
- Node.js 18+ 
- npm أو pnpm أو yarn
- حساب Supabase مجاني

# Optional:
- Git
- Docker (للتشغيل المعزول)
```

### للإنتاج (Production):
```bash
# Required:
- Node.js 18+ runtime
- PostgreSQL database (Supabase أو مستقل)
- Redis (اختياري لكن موصى به)
- SSL Certificate (HTTPS)
- Domain name

# Recommended:
- CDN (Cloudflare, CloudFront)
- Object Storage (S3, Supabase Storage)
- Monitoring service (Sentry, DataDog)
```

---

## إعداد البيئة

### 1. استنساخ المشروع:
```bash
git clone https://github.com/your-org/mavora.git
cd mavora
```

### 2. تثبيت الاعتماديات:
```bash
npm install
# أو
pnpm install
# أو
yarn install
```

### 3. إعداد متغيرات البيئة:
```bash
# نسخ القالب
cp .env.example .env

# تعديل الملف
nano .env  # أو استخدام محرر آخر
```

### 4. إعداد قاعدة البيانات:
```bash
# تشغيل الترحيلات
npm run db:push

# أو باستخدام Prisma
npx prisma migrate deploy

# بذر البيانات الأولية
npm run db:seed
```

---

## النشر على Vercel (الأسهل)

### الخطوة 1: ربط المستودع:

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخولك (أو أنشئ حساب)
3. اضغط **"Add New"** → **"Project"**
4. اختر مستودع GitHub الخاص بك
4. اختر مشروع `mavora`

### الخطوة 2: إعدادات البناء:

```yaml
# vercel.json (موجود بالفعل في المشروع)
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### الخطوة 3: إضافة Environment Variables:

في Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (Secret) | `eyJ...` |
| `PAYPAL_CLIENT_ID` | PayPal Client ID | `AXxxxxxx` |
| `PAYPAL_CLIENT_SECRET` | PayPal Client Secret (Secret) | `ELxxxxxx` |
| `NODE_ENV` | Environment | `production` |

### الخطوة 4: النشر:

```bash
# نشر يدوي من CLI
npm i -g vercel
vercel --prod

# أو تلقائي عند كل push إلى main
```

---

## النشر على خادم مخصص (VPS/Dedicated)

### الخيار A: استخدام Docker (موصى به)

#### 1. إنشاء Dockerfile:
```dockerfile
# موجود بالفعل في المشروع
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/.standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. إنشاء docker-compose.yml:
```yaml
version: '3.8'

services:
  mavora:
    build: .
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
  
  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### 3. التشغيل:
```bash
# بناء وتشغيل
docker-compose up -d --build

# عرض السجلات
docker-compose logs -f mavora

# إيقاف
docker-compose down
```

### الخيار B: تشغيل مباشر مع PM2:

#### 1. تثبيت PM2:
```bash
npm install -g pm2
```

#### 2. إنشاء ملف ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'mavora',
    script: 'node',
    args: 'server.js',
    cwd: './',
    instances: 'max', // أو عدد محدد
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_log: './logs/error.log',
    out_log: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 4000,
    max_restarts: 10,
  }]
};
```

#### 3. التشغيل:
```bash
# بناء المشروع
npm run build

# تشغيل مع PM2
pm2 start ecosystem.config.js

# حفظ الإعدادات
pm2 save

# إعداد بدء تلقائي
pm2 startup
```

---

## إعداد قاعدة البيانات

### باستخدام Supabase (موصى به):

1. **إنشاء مشروع جديد**:
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ مشروع جديد
   - اختر منطقة قريبة من المغرب (eu-west-1 أو eu-south-1)

2. **إعداد Row Level Security (RLS)**:
   ```sql
   -- تفعيل RLS
   ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   -- ... لكل الجداول
   
   -- سياسات أساسية
   CREATE POLICY "Users can view all listings"
     ON listings FOR SELECT
     USING (true);
   
   CREATE POLICY "Users can update own listings"
     ON listings FOR UPDATE
     USING (auth.uid() = seller_id);
   ```

3. **تهيئة Storage**:
   - أنشئ bucket باسم `listings`
   - أضف سياسات الوصول المناسبة

### باستخدام PostgreSQL مباشرة:

```bash
# تثبيت PostgreSQL
sudo apt-get install postgresql postgresl-contrib

# إنشاء مستخدم وقاعدة بيانات
sudo -u postgres createuser mavora
sudo -u postgres createdb mavora -O mavora

# تعيين كلمة المرور
sudo -u postgres psql -c "ALTER USER mavora PASSWORD 'your-password';"

# تشغيل الترحيلات
DATABASE_URL="postgresql://mavora:password@localhost:5432/mavora" npx prisma migrate deploy
```

---

## إعداد Payment Providers

### PayPal Setup:

1. **إنشاء حساب**:
   - اذهب إلى [developer.paypal.com](https://developer.paypal.com)
   - سجل وأنشئ تطبيقًا جديدً

2. **الحصول على API Credentials**:
   ```bash
   # Sandbox (للاختبار)
   PAYPAL_ENVIRONMENT=sandbox
   PAYPAL_CLIENT_ID=ASandbox_xxxx
   PAYPAL_CLIENT_SECRET=ESandbox_xxxx
   
   # Production (للإنتاج)
   PAYPAL_ENVIRONMENT=live
   PAYPAL_CLIENT_ID=ALive_xxxx
   PAYPAL_CLIENT_SECRET=ELive_xxxx
   ```

3. **إعداد Webhook**:
   - أضف webhook URL: `https://mavora.ma/api/payments/paypal/webhook`
   - فعّل الأحداث: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### Payoneer Setup:

1. **تواصل مع Payoneer** للحصول على بيانات API
2. **إعدادات البيئة**:
   ```bash
   PAYONEER_API_KEY=your-key
   PAYONEER_API_SECRET=your-secret
   PAYONEER_PROGRAM_ID=program-id
   ```

---

## إعداد Push Notifications

### Web Push (Browser Notifications):

1. **توليد VAPID Keys**:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **إضافة المتغيرات**:
   ```bash
   VAPID_PUBLIC_KEY=BPxxxxx
   VAPID_PRIVATE_KEY=xxxxx
   VAPID_EMAIL=admin@mavora.ma
   ```

3. **Service Worker**:
   - ملف `/public/sw.js` جاهز بالفعل
   - يدعم Push Notifications

---

## التحقق من النشر

### Health Check:
```bash
curl https://mavora.ma/api/health
# Expected response: {"status":"ok","timestamp":"..."}

# أو محلياً
curl http://localhost:3000/api/health
```

### قائمة التحقق قبل الإطلاق:

- [ ] جميع متغيرات البيئة مضبوطة
- [ ] قاعدة البيانات متصلة وRLS مفعل
- [ ] SSL/HTTPS يعمل
- [ ] Payment providers في وضع sandbox ويعملان
- [ ] Email/SMS يعملان
- [ ] PWA مثبت ويحفظ offline
- [ ] Analytics متصل (اختياري)
- [ ] Error tracking متصل (اختياري)
- [ ] Backups مجدولة
- [ ] CORS مضبوط بشكل صحيح

---

## الصيانة والمراقبة

### Monitoring Stack (موصى به):

| Service | Use Case | Cost |
|---------|----------|------|
| **Sentry** | Error Tracking | Free tier available |
| **Vercel Analytics** | Performance | Included with Vercel |
| **UpTimeRobot** | Uptime Monitoring | Free |
| **Logtail** | Log Management | Free tier |

### أوامر الصيانة الشائعة:

```bash
# عرض سجلات PM2
pm2 logs mavora

# إعادة تشغيل الخدمة
pm2 restart mavora

# تحديث المشروع
git pull origin main
npm install
npm run build
pm2 restart mavora

# نسخ احتياطي لقاعدة البيانات
pg_dump mavora > backup_$(date +%Y%m%d).sql
```

---

## استكشاف الأخطاء وإصلاحها

### مشاكل شائعة وحلولها:

#### 1. خطأ "Database Connection Failed":
```bash
# تحقق من:
# 1. صحة URL في NEXT_PUBLIC_SUPABASE_URL
# 2. أن Service Role Key صحيح
# 3. أن RLS لا يمنع الوصول
```

#### 2. خطأ "Payment Provider Error":
```bash
# تحقق من:
# 1. أن API Keys صحيحة
# 2. أن Environment (sandbox/live) مضبوط
# 3. أن Webhook URL قابل للوصول من الخارج
```

#### 3. PWA لا يعمل:
```bash
# تحقق من:
# 1. أن الموقع يخدم عبر HTTPS
# 2. أن manifest.json و sw.js متاحان
# 3. أن الأيقونات موجودة
```

#### 4. Slow Performance:
```bash
# حلول:
# 1. فعّل Edge Caching
# 2. استخدم CDN للصور
# 3. فعّل Next.js Image Optimization
# 4. أضف Redis للتخزين المؤقت
```

---

## 📞 الدعم والمساعدة

### روابط مفيدة:
- **Documentation**: [docs.mavora.ma](https://docs.mavora.ma)
- **API Reference**: [api.mavora.ma/docs](https://api.mavora.ma/docs)
- **Status Page**: [status.mavora.ma](https://status.mavora.ma)
- **Email**: support@mavora.ma

### Community:
- **Discord**: [discord.gg/mavora](https://discord.gg/mavora)
- **Twitter**: [@MavoraMA](https://twitter.com/MavoraMA)

---

## 📄 License

هذا المشروع مرخص تحت [MIT License](./LICENSE).

---

**آخر تحديث**: 2026-01-09  
**الإصدار**: 1.0.0
