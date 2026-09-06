#!/bin/bash

# ===========================================
# Mavora - Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: staging | production
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="mavora"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mavora Deployment Script${NC}"
echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}  Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}========================================${NC}"

# -------------------------------------------
# Pre-deployment checks
# -------------------------------------------
pre_deploy_checks() {
    echo -e "\n${YELLOW}[1/6] Running pre-deployment checks...${NC}"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}Error: .env file not found!${NC}"
        echo -e "${YELLOW}Please copy .env.example to .env and fill in your values.${NC}"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "18" ]; then
        echo -e "${RED}Error: Node.js 18+ required. Current version: $(node -v)${NC}"
        exit 1
    fi
    
    # Check npm dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"
}

# -------------------------------------------
# Run tests
# -------------------------------------------
run_tests() {
    echo -e "\n${YELLOW}[2/6] Running test suite...${NC}"
    
    if npm test -- --coverage; then
        echo -e "${GREEN}✓ All tests passed${NC}"
    else
        echo -e "${RED}✗ Tests failed! Aborting deployment.${NC}"
        exit 1
    fi
}

# -------------------------------------------
# Build application
# -------------------------------------------
build_app() {
    echo -e "\n${YELLOW}[3/6] Building application...${NC}"
    
    # Set build-specific environment
    export NEXT_TELEMETRY_DISABLED=1
    
    if npm run build; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed!${NC}"
        exit 1
    fi
}

# -------------------------------------------
# Deploy based on environment
# -------------------------------------------
deploy() {
    echo -e "\n${YELLOW}[4/6] Deploying to ${ENVIRONMENT}...${NC}"
    
    case "$ENVIRONMENT" in
        staging)
            # Deploy to Vercel preview
            echo -e "${BLUE}Deploying to Vercel (preview)...${NC}"
            vercel --env staging --yes
            ;;
        production)
            # Deploy to Vercel production
            echo -e "${BLUE}Deploying to Vercel (production)...${NC}"
            vercel --prod --yes
            
            # Or use Docker for self-hosted
            # docker-compose up -d --build
            ;;
        docker)
            # Docker deployment
            echo -e "${BLUE}Building and starting containers...${NC}"
            docker-compose up -d --build
            docker-compose ps
            ;;
        *)
            echo -e "${RED}Unknown environment: ${ENVIRONMENT}${NC}"
            echo -e "${YELLOW}Use: staging | production | docker${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✓ Deployment initiated${NC}"
}

# -------------------------------------------
# Post-deployment verification
# -------------------------------------------
verify_deployment() {
    echo -e "\n${YELLOW}[5/6] Verifying deployment...${NC}"
    
    # Wait for application to start
    sleep 10
    
    # Get the URL based on environment
    case "$ENVIRONMENT" in
        staging)
            URL=$(vercel ls mavora 2>/dev/null | grep -E 'https://.*vercel.app' | head -1 || echo "")
            ;;
        production)
            URL="${APP_URL:-https://mavora.ma}"
            ;;
        docker)
            URL="http://localhost:3000"
            ;;
    esac
    
    if [ -n "$URL" ]; then
        echo -e "${BLUE}Testing: ${URL}${NC}"
        
        # Health check
        if curl -sf "${URL}/api/health" > /dev/null; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠ Health check not responding (may still be starting)${NC}"
        fi
        
        # Basic page load
        HTTP_STATUS=$(curl -sI "${URL}" | head -1 | cut -d' ' -f2)
        if [ "$HTTP_STATUS" = "200" ]; then
            echo -e "${GREEN}✓ Main page responding (200 OK)${NC}"
        else
            echo -e "${YELLOW}⚠ Main page status: ${HTTP_STATUS}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Could not determine deployment URL${NC}"
    fi
}

# -------------------------------------------
# Cleanup and summary
# -------------------------------------------
cleanup_and_summary() {
    echo -e "\n${YELLOW}[6/6] Deployment summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Environment: ${ENVIRONMENT}"
    echo -e "Timestamp: ${TIMESTAMP}"
    echo -e "Node.js: $(node -v)"
    echo -e "npm: $(npm -v)"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Deployment completed successfully! 🎉${NC}"
    echo -e "\nNext steps:"
    echo -e "  1. Visit your application URL"
    echo -e "  2. Test user registration/login"
    echo -e "  3. Test listing creation"
    echo -e "  4. Verify payment flow in sandbox mode"
    echo -e ""
}

# -------------------------------------------
# Main execution
# -------------------------------------------
main() {
    pre_deploy_checks
    run_tests
    build_app
    deploy
    verify_deployment
    cleanup_and_summary
}

# Run main function
main "$@"
