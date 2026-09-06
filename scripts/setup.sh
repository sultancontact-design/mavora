#!/bin/bash
# =============================================================================
# Mavora Setup Wizard
# Arabic Marketplace Platform - Quick Start Script for Developers
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="Mavora"
MIN_NODE_VERSION="18.0.0"
MIN_NPM_VERSION="9.0.0"

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "\n${CYAN}▶ $1${NC}"; }

show_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}          ${GREEN}$PROJECT_NAME - Setup Wizard${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}          ${YELLOW}Arabic Marketplace (Morocco)${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}          ${YELLOW}مافورا - سوق عربي للمغرب${NC}                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

version_gte() {
    # Returns 0 if $1 >= $2
    local v1=$1 v2=$2
    [ "$(printf '%s\n' "$v2" "$v1" | sort -V | head -n1)" = "$v2" ]
}

# Step 1: Check prerequisites
check_prerequisites() {
    log_step "التحقق من المتطلبات الأساسية / Checking Prerequisites"
    
    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        log_info "Node.js: $NODE_VERSION"
        if version_gte "$NODE_VERSION" "$MIN_NODE_VERSION"; then
            log_success "إصدار Node.js متوافق"
        else
            log_error "إصدار Node.js قديم ($NODE_VERSION). مطلوب $MIN_NODE_VERSION أو أحدث"
            exit 1
        fi
    else
        log_error "Node.js غير مثبت. يرجى تثبيته من https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if check_command npm; then
        NPM_VERSION=$(npm --version)
        log_info "npm: $NPM_VERSION"
        if version_gte "$NPM_VERSION" "$MIN_NPM_VERSION"; then
            log_success "إصدار npm متوافق"
        else
            log_warning "إصدار npm قديم ($NPM_VERSION). يُنصح بتحديثه"
        fi
    else
        log_error "npm غير مثبت"
        exit 1
    fi
    
    # Check git
    if check_command git; then
        GIT_VERSION=$(git --version)
        log_info "$GIT_VERSION"
        log_success "Git مثبت"
    else
        log_warning "Git غير مثبت - لن تتمكن من رفع الكود"
    fi
    
    # Optional: Check Docker
    if check_command docker; then
        DOCKER_VERSION=$(docker --version)
        log_info "$DOCKER_VERSION"
        log_success "Docker متاح (اختياري)"
    else
        log_info "Dغير مثبت (اختياري - للتطوير مع حاويات)"
    fi
    
    # Optional: Check code (VS Code)
    if check_command code; then
        log_success "VS Code مثبت"
    else
        log_info "VS Code غير مثبت (اختياري)"
    fi
}

# Step 2: Install dependencies
install_dependencies() {
    log_step "تثبيت الاعتماديات / Installing Dependencies"
    
    if [ -d "node_modules" ]; then
        log_warning "مجلد node_modules موجود بالفعل"
        read -p "هل تريد إعادة التثبيت؟ (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf node_modules
            npm install
        fi
    else
        npm install
    fi
    
    log_success "تم تثبيت الاعتماديات بنجاح"
}

# Step 3: Environment setup
setup_environment() {
    log_step "إعداد البيئة / Environment Setup"
    
    if [ -f ".env.local" ]; then
        log_warning "ملف .env.local موجود بالفعل"
        read -p "هل تريد إعادة إنشائه؟ (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    # Copy from example if exists
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        log_success "تم إنشاء .env.local من .env.example"
    else
        # Create minimal .env.local
        cat > .env.local << 'EOF'
# Mavora - Local Development Environment
# ======================================

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Mavora
NEXT_PUBLIC_APP_LOCALE=ar-MA
NEXT_PUBLIC_APP_CURRENCY=MAD

# Supabase (Required - Get from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres

# NextAuth / Auth
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Redis (Optional - For caching)
REDIS_URL=redis://localhost:6379

# Email (Optional - For development, emails are logged)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@mavora.ma

# PayPal Sandbox (Optional)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Payoneer (Optional)
PAYONEER_API_URL=https://api.sandbox.payoneer.com
PAYONEER_USERNAME=
PAYONEER_PASSWORD=

# Feature Flags
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PAYPAL=true
ENABLE_PAYONEER=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
EOF
        log_success "تم إنشاء .env.local افتراضي"
    fi
    
    log_warning "⚠️  لا تنسَ تعديل .env.local وإضافة مفاتيح API الحقيقية!"
}

# Step 4: Setup database (optional)
setup_database() {
    log_step "إعداد قاعدة البيانات / Database Setup"
    
    read -p "هل تريد تشغيل تراجيع قاعدة البيانات؟ (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "تخطي إعداد قاعدة البيانات"
        return
    fi
    
    # Run Prisma migrations
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma migrate dev --name init 2>/dev/null || \
        log_warning "فشل تشغيل التراجعات - تأكد من إعدادات DATABASE_URL"
    else
        log_warning "ملف Prisma schema غير موجود"
    fi
    
    # Seed database option
    read -p "هل تريد إضافة بيانات تجريبية؟ (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/seed-data.js --users 10 --listings 50 2>/dev/null || \
        log_warning "فشل إضافة البيانات التجريبية"
    fi
}

# Step 5: Verify installation
verify_installation() {
    log_step "التحقق من التثبيت / Verifying Installation"
    
    local all_good=true
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        log_success "node_modules موجود"
    else
        log_error "node_modules مفقود!"
        all_good=false
    fi
    
    # Check if .env.local exists
    if [ -f ".env.local" ]; then
        log_success ".env.local موجود"
        
        # Warn if still using placeholder values
        if grep -q "your-supabase-url" .env.local 2>/dev/null; then
            log_warning "لا تزال هناك قيم افتراضية في .env.local"
        fi
    else
        log_warning ".env.local مفقود - قد لا يعمل التطبيق بشكل كامل"
    fi
    
    # Try building
    log_info "محاولة البناء..."
    if npm run build 2>&1 | tail -20; then
        log_success "البناء ناجح!"
    else
        log_error "فشل البناء!"
        all_good=false
    fi
    
    # Try tests
    log_info "تشغيل الاختبارات..."
    if npm test -- --run __tests__/utils.test.ts __tests__/listings.test.ts 2>&1 | tail -5; then
        log_success "الاختبارات تمر!"
    else
        log_warning "بعض الاختبارات فشلت"
    fi
    
    return $([ "$all_good" = true ] && echo 0 || echo 1)
}

# Step 6: Show next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}          ${CYAN}🎉 تم الإعداد بنجاح! / Setup Complete!${NC}           ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}الخطوات التالية / Next Steps:${NC}"
    echo ""
    echo "  1️⃣  عدّل ملف ${YELLOW}.env.local${NC} وأضف مفاتيح API:"
    echo "     - Supabase URL & Keys (مطلوب)"
    echo "     - PayPal/Payoneer (اختياري)"
    echo ""
    echo "  2️⃣  شغّل خادم التطوير:"
    echo "     ${GREEN}npm run dev${NC}"
    echo ""
    echo "  3️⃣  افتح المتصفح على:"
    echo "     ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo -e "${CYAN}الأوامر المفيدة / Useful Commands:${NC}"
    echo ""
    echo "  ${GREEN}npm run dev${NC}         - تشغيل خادم التطوير"
    echo "  ${GREEN}npm run build${NC}       - بناء للإنتاج"
    echo "  ${GREEN}npm test${NC}            - تشغيل الاختبارات"
    echo "  ${GREEN}npm run lint${NC}        - فحص جودة الكود"
    echo "  ${GREEN}npm run format${NC}       - تنسيق الكود"
    echo ""
    echo -e "${CYAN}المساعدة / Help:${NC}"
    echo "  📖 README.md           - التوثيق الرئيسي"
    echo "  📖 CONTRIBUTING.md     - دليل المساهمة"
    echo "  📖 docs/API.md         - توثيق API"
    echo "  💬 GitHub Issues       - الإبلاغ عن مشاكل"
    echo ""
}

# Main function
main() {
    show_banner
    
    echo -e "${YELLOW}مرحباً! هذا السكربت سيساعدك في إعداد مشروع Mavorا للتطوير المحلي.${NC}"
    echo -e "${YELLOW}Welcome! This script will help you set up Mavora for local development.${NC}"
    echo ""
    
    read -p "هل تريد المتابعة؟ / Continue? (Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_info "تم الإلغاء / Cancelled"
        exit 0
    fi
    
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    
    if verify_installation; then
        show_next_steps
        exit 0
    else
        echo ""
        log_error "حدثت بعض المشاكل أثناء التثبيت"
        log_info "يرجى مراجعة الأخطاء أعلاه والمحاولة مرة أخرى"
        log_info "أو راجع README.md للحصول على تعليمات يدوية"
        exit 1
    fi
}

# Run main with all arguments
main "$@"
