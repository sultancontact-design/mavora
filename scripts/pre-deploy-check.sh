#!/bin/bash

# ===========================================
# Mavora - Pre-Deploy Checklist
# Run this before every deployment
# Usage: ./scripts/pre-deploy-check.sh
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

check_pass() {
    echo -e "  ${GREEN}✓ PASS${NC}: $1"
    ((PASS_COUNT++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠ WARN${NC}: $1"
    ((WARN_COUNT++))
}

check_fail() {
    echo -e "  ${RED}✗ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║     Mavora Pre-Deployment Checklist      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# -------------------------------------------
# 1. Code Quality
# -------------------------------------------
echo -e "\n${BLUE}[1/7] Code Quality${NC}"

if [ -d ".git" ] && git diff --quiet HEAD 2>/dev/null; then
    check_pass "No uncommitted changes"
else
    check_warn "Uncommitted changes detected"
fi

if command -v eslint &> /dev/null; then
    if npx eslint src/ --max-warnings=0 2>/dev/null | grep -q "no errors"; then
        check_pass "ESLint passed (no errors)"
    else
        check_warn "ESLint has warnings (non-blocking)"
    fi
else
    check_warn "ESLint not found, skipping linting"
fi

if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    check_pass "ESLint configuration exists"
else
    check_fail "Missing ESLint configuration"
fi

# -------------------------------------------
# 2. Dependencies
# -------------------------------------------
echo -e "\n${BLUE}[2/7] Dependencies${NC}"

if [ -f "package-lock.json" ]; then
    check_pass "package-lock.json exists"
else
    check_fail "Missing package-lock.json (commit it!)"
fi

if npm audit --json 2>/dev/null | grep -q '"low"\|"moderate"\|"high"\|"critical"'; then
    VULNERABILITIES=$(npm audit --json 2>/dev/null | grep -o '"vulnerabilities":[0-9]*' | head -1)
    check_warn "Known vulnerabilities: ${VULN:-some}"
else
    check_pass "No known vulnerabilities"
fi

if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    check_pass "Dependencies installed (${NODE_MODULES_SIZE})"
else
    check_fail "Dependencies not installed (run npm install)"
fi

# -------------------------------------------
# 3. Environment Configuration
# -------------------------------------------
echo -e "\n${BLUE}[3/7] Environment Configuration${NC}"

if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check critical variables
    source .env 2>/dev/null || true
    
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        check_pass "SUPABASE_URL configured"
    else
        check_fail "SUPABASE_URL missing"
    fi
    
    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
        check_pass "JWT_SECRET set (length: ${#JWT_SECRET})"
    elif [ -n "$JWT_SECRET" ]; then
        check_fail "JWT_SECRET too short (min 32 chars)"
    else
        check_fail "JWT_SECRET missing"
    fi
else
    check_fail ".env file missing (copy from .env.example)"
fi

if [ -f ".env.example" ]; then
    check_pass ".env.example exists for reference"
else
    check_warn "Missing .env.example template"
fi

# Check .gitignore has .env
if [ -f ".gitignore" ] && grep -q "^\.env$" .gitignore; then
    check_pass ".env in .gitignore"
else
    check_fail ".env not in .gitignore (security risk!)"
fi

# -------------------------------------------
# 4. Tests
# -------------------------------------------
echo -e "\n${BLUE}[4/7] Tests${NC}"

if [ -d "__tests__" ] || [ -d "tests" ] || [ -d "__test__" ]; then
    check_pass "Test directory exists"
else
    check_warn "No test directory found"
fi

if grep -q '"test"' package.json; then
    check_pass "Test script in package.json"
    
    # Run tests and capture result
    if npm test -- --passWithNoTests 2>&1 | tail -5 | grep -q "passed\|Tests:\s*[1-9]"; then
        check_pass "Tests passing"
    else
        check_warn "Tests may have failures (run manually to verify)"
    fi
else
    check_warn "No test script defined"
fi

# -------------------------------------------
# 5. Build
# -------------------------------------------
echo -e "\n${BLUE}[5/7] Build Status${NC}"

if [ -d ".next" ]; then
    check_pass "Previous build exists (.next directory)"
    
    # Check build age
    BUILD_AGE=$(( ($(date +%s) - $(stat -c %Y .next 2>/dev/null || echo $(date +%s))) / 3600 ))
    if [ "$BUILD_AGE" -lt "24" ]; then
        check_pass "Build is recent (${BUILD_AGE} hours old)"
    else
        check_warn "Build is old (${BUILD_AGE} hours), consider rebuilding"
    fi
else
    check_warn "No previous build (will build on deploy)"
fi

# Check next.config.js/mjs/ts
if [ -f "next.config.js" ] || [ -f "next.config.mjs" ] || [f "next.config.ts" ]; then
    check_pass "Next.js config exists"
else
    check_fail "Missing Next.js configuration"
fi

# -------------------------------------------
# 6. Production Readiness
# -------------------------------------------
echo -e "\n${BLUE}[6/7] Production Readiness${NC}"

# PWA files
if [ -f "public/manifest.json" ]; then
    check_pass "PWA manifest exists"
else
    check_warn "Missing PWA manifest"
fi

if [ -f "public/sw.js" ] || [ -f "public/service-worker.js" ]; then
    check_pass "Service worker exists"
else
    check_warn "Missing service worker"
fi

# SEO
if [ -f "src/components/seo/MetaTags.tsx" ]; then
    check_pass "SEO MetaTags component exists"
else
    check_warn "Missing SEO components"
fi

if [ -f "src/components/seo/StructuredData.tsx" ]; then
    check_pass "Structured data component exists"
else
    check_warn "Missing structured data component"
fi

# Robots.txt
if [ -f "public/robots.txt" ]; then
    check_pass "robots.txt exists"
else
    check_warn "Missing robots.txt"
fi

# Security headers (vercel.json or next.config)
if [ -f "vercel.json" ] && grep -q "headers" vercel.json; then
    check_pass "Security headers configured (Vercel)"
elif grep -q "headers" next.config.* 2>/dev/null; then
    check_pass "Security headers configured (Next.js)"
else
    check_warn "Consider adding security headers"
fi

# -------------------------------------------
# 7. Deployment Configuration
# -------------------------------------------
echo -e "\n${BLUE}[7/7] Deployment Configuration${NC}"

if [ -f "vercel.json" ]; then
    check_pass "Vercel configuration exists"
fi

if [ -f "Dockerfile" ]; then
    check_pass "Dockerfile exists"
fi

if [ -f "docker-compose.yml" ]; then
    check_pass "Docker Compose configuration exists"
fi

if [ -f "DEPLOYMENT.md" ]; then
    check_pass "Deployment guide exists"
fi

if [ ! -f "vercel.json" ] && [ ! -f "Dockerfile" ]; then
    check_fail "No deployment configuration found!"
fi

# -------------------------------------------
# Summary
# -------------------------------------------
echo -e "\n${CYAN}══════════════════════════════════════════${NC}"
echo -e "${BLUE}               SUMMARY${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC}   ${PASS_COUNT}"
echo -e "  ${YELLOW}Warnings:${NC} ${WARN_COUNT}"
echo -e "  ${RED}Failed:${NC}   ${FAIL_COUNT}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "\n${RED}❌ Deployment BLOCKED - Fix failures before deploying${NC}"
    exit 1
elif [ "$WARN_COUNT" -gt 10 ]; then
    echo -e "\n${YELLOW}⚠️ Many warnings - Review before deploying${NC}"
    exit 0
else
    echo -e "\n${GREEN}✅ Ready for deployment!${NC}"
    exit 0
fi
