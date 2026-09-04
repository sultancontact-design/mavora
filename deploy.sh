#!/bin/bash
# 🚀 سكريبت النشر السريع على Cloudflare Pages
# الاستخدام: ./deploy.sh

set -e

echo "🚀 جارِ نشر نظام إدارة المنشورات على Cloudflare Pages..."
echo "================================================"

# التحقق من وجود API Token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo ""
    echo "⚠️  لاستكمال النشر، تحتاج إلى:"
    echo ""
    echo "1. أنشئ حساب على https://dash.cloudflare.com"
    echo "2. اذهب إلى: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
    echo "3. أنشئ API Token مع صلاحيات 'Cloudflare Pages:Edit'"
    echo "4. شغّل الأمر التالي:"
    echo ""
    echo "   export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo "   ./deploy.sh"
    echo ""
    echo "💡 أو استخدم هذه الطريقة البديلة:"
    echo ""
    
    # طريقة بديلة: ربط GitHub
    echo "📦 الطريقة الأسهل (بدون CLI):"
    echo "1. ارفع الكود على GitHub"
    echo "2. اذهب إلى Cloudflare Dashboard > Pages"
    echo "3. اختر 'Connect to Git'"
    echo "4. اختر مستودعك"
    echo "5. إعدادات البناء:"
    echo "   - Build command: bun run build"
    echo "   - Build output: .next/standalone"
    echo "   - Node.js version: 20"
    echo ""
    
    exit 1
fi

# بناء المشروع
echo "📦 جارِ بناء المشروع..."
bun run build

# النشر
echo "☁️  جارِ النشر على Cloudflare Pages..."
npx wrangler pages deploy .next/standalone --project-name=posts-management-system

echo ""
echo "✅ تم النشر بنجاح!"
echo "🔗 رابط المشروع: https://posts-management-system.pages.dev"
