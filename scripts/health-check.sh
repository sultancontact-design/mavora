#!/bin/bash

# ===========================================
# Mavora - Health Check Script
# Usage: ./scripts/health-check.sh [url]
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default URL
URL=${1:-"http://localhost:3000"}
TIMEOUT=10

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mavora Health Check${NC}"
echo -e "${BLUE}  Target: ${URL}${NC}"
echo -e "${BLUE}========================================${NC}"

# -------------------------------------------
# 1. API Health Endpoint
# -------------------------------------------
echo -e "\n${YELLOW}[1/5] API Health Endpoint${NC}"

HEALTH_RESPONSE=$(curl -sf --max-time ${TIMEOUT} "${URL}/api/health" 2>/dev/null || echo '{"status":"error"}')

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ API is healthy${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ API health check failed${NC}"
    EXIT_CODE=1
fi

# -------------------------------------------
# 2. Readiness Check
# -------------------------------------------
echo -e "\n${YELLOW}[2/5] Readiness Check${NC}"

READY_RESPONSE=$(curl -sf --max-time ${TIMEOUT} "${URL}/api/ready" 2>/dev/null || echo '{"ready":false}')

if echo "$READY_RESPONSE" | grep -q '"ready":true'; then
    echo -e "${GREEN}✓ Application is ready${NC}"
    # Extract and display database status
    DB_STATUS=$(echo $READY_RESPONSE | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    echo "   Database: ${DB_STATUS:-unknown}"
else
    echo -e "${YELLOW}⚠ Application may not be fully ready${NC}"
fi

# -------------------------------------------
# 3. Main Page Load
# -------------------------------------------
echo -e "\n${YELLOW}[3/5] Main Page Load${NC}"

HTTP_STATUS=$(curl -sI --max-time ${TIMEOUT} "${URL}" 2>/dev/null | head -1 | cut -d' ' -f2)

case "$HTTP_STATUS" in
    200)
        echo -e "${GREEN}✓ Main page loaded (200 OK)${NC}"
        ;;
    301|302|307|308)
        echo -e "${YELLOW}⚠ Redirect (${HTTP_STATUS}) - might be HTTPS redirect${NC}"
        ;;
    *)
        echo -e "${RED}✗ Main page error (Status: ${HTTP_STATUS:-timeout})${NC}"
        EXIT_CODE=1
        ;;
esac

# -------------------------------------------
# 4. Response Time
# -------------------------------------------
echo -e "\n${YELLOW}[4/5] Response Time${NC}"

START_TIME=$(date +%s%N)
curl -sf --max-time ${TIMEOUT} "${URL}" > /dev/null 2>&1 || true
END_TIME=$(date +%s%N)

ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$ELAPSED_MS" -lt "1000" ]; then
    echo -e "${GREEN}✓ Response time: ${ELAPSED_MS}ms (Excellent!)${NC}"
elif [ "$ELAPSED_MS" -lt "3000" ]; then
    echo -e "${YELLOW}⚠ Response time: ${ELAPSED_MS}ms (Acceptable)${NC}"
else
    echo -e "${RED}✗ Response time: ${ELAPSED_MS}ms (Too slow!)${NC}"
    EXIT_CODE=1
fi

# -------------------------------------------
# 5. Key Endpoints Check
# -------------------------------------------
echo -e "\n${YELLOW}[5/5] Key Endpoints${NC}"

ENDPOINTS=(
    "/api/health"
    "/api/version"
    "/manifest.json"
    "/sw.js"
)

for ENDPOINT in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -sI --max-time ${TIMEOUT} "${URL}${ENDPOINT}" 2>/dev/null | head -1 | cut -d' ' -f2)
    
    case "$STATUS" in
        200|304)
            echo -e "${GREEN}✓ ${ENDPOINT} (${STATUS})${NC}"
            ;;
        404)
            # Some endpoints like sw.js might not exist in dev mode
            echo -e "${YELLOW}○ ${ENDPOINT} (${STATUS})${NC}"
            ;;
        *)
            echo -e "${RED}✗ ${ENDPOINT} (${STATUS:-timeout})${NC}"
            ;;
    esac
done

# -------------------------------------------
# Summary
# -------------------------------------------
echo -e "\n${BLUE}========================================${NC}"
if [ -z "$EXIT_CODE" ]; then
    echo -e "${GREEN}All health checks passed! ✅${NC}"
    exit 0
else
    echo -e "${RED}Some checks failed! ❌${NC}"
    exit 1
fi
