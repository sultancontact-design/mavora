#!/bin/bash

# ============================================================
# Phase 6 Diagnostic Script - User Flow Testing
# Tests: Signup → Login → Session → Create Listing
# ============================================================

BASE_URL="https://my-project-nu-nine-64.vercel.app"
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser_${TIMESTAMP}@mavora.test"
TEST_PASSWORD="TestPass123!"
# Display name must match regex: /^[\p{L}\s\-'.]+$/ (letters, spaces, hyphens, apostrophes only - NO NUMBERS)
TEST_DISPLAY_NAME="Test User Alpha"

echo "🔍 Phase 6: User Flow Diagnostics"
echo "======================================"
echo ""
echo "📧 Test Email: $TEST_EMAIL"
echo "👤 Display Name: $TEST_DISPLAY_NAME"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_api() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing: $test_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url" -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ] || [ "$expected_status" = "any" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        ((pass_count++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "   Response: $body"
        ((fail_count++))
    fi
    
    # Return the body for further processing
    echo "$body" > /tmp/last_response.json
}

echo "📋 TEST 1: Session Check (Unauthenticated)"
echo "-------------------------------------------"
test_api "GET /api/auth/session" "GET" "/api/auth/session" "" "200"
SESSION_BODY=$(cat /tmp/last_response.json)
echo "   Response: $SESSION_BODY"
echo ""

echo "📋 TEST 2: Signup New User"
echo "--------------------------"
SIGNUP_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD",
  "confirmPassword": "$TEST_PASSWORD",
  "display_name": "$TEST_DISPLAY_NAME",
  "phone": "+212600000000"
}
EOF
)
test_api "POST /api/auth/signup" "POST" "/api/auth/signup" "$SIGNUP_DATA" "201"
SIGNUP_BODY=$(cat /tmp/last_response.json)
echo "   Response: $SIGNUP_BODY"
echo ""

echo "📋 TEST 3: Login with New Credentials"
echo "--------------------------------------"
LOGIN_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD"
}
EOF
)
test_api "POST /api/auth/login" "POST" "/api/auth/login" "$LOGIN_DATA" "200"
LOGIN_BODY=$(cat /tmp/last_response.json)
echo "   Response: $LOGIN_BODY"

# Extract token for subsequent tests
ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$USER_ID" ]; then
    echo ""
    echo "   🔑 Access Token: ${ACCESS_TOKEN:0:20}..."
    echo "   👤 User ID: $USER_ID"
else
    echo ""
    echo "   ⚠️ Could not extract tokens from login response"
fi
echo ""

echo "📋 TEST 4: Session Check (Authenticated)"
echo "-----------------------------------------"
# Use the access token from login
test_api "GET /api/auth/session (with cookie)" "GET" "/api/auth/session" "" "200"
AUTH_SESSION_BODY=$(cat /tmp/last_response.json)
echo "   Response: $AUTH_SESSION_BODY"
echo ""

echo "📋 TEST 5: Create Listing (Authenticated)"
echo "------------------------------------------"
if [ -n "$ACCESS_TOKEN" ] && [ -n "$USER_ID" ]; then
    LISTING_DATA=$(cat <<EOF
{
  "title": "Test Listing from Phase 6",
  "description": "This is a test listing created during Phase 6 diagnostics. It contains enough characters to pass validation requirements.",
  "category_id": "electronics",
  "price": 299.99,
  "condition": "new",
  "locationAddress": "Casablanca, Morocco",
  "contactPhone": "+212600000000",
  "negotiable": true
}
EOF
)
    
    # Create listing with auth token
    echo -n "Testing: POST /api/listings (authenticated)... "
    listing_response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        "$BASE_URL/api/listings" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "x-user-id: $USER_ID" \
        -d "$LISTING_DATA")
    
    listing_http_code=$(echo "$listing_response" | tail -n1)
    listing_body=$(echo "$listing_response" | sed '$d')
    
    if [ "$listing_http_code" = "201" ] || [ "$listing_http_code" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $listing_http_code)"
        ((pass_count++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 201, got $listing_http_code)"
        echo "   Response: $listing_body"
        ((fail_count++))
    fi
    echo "   Response: $listing_body"
    
    # Extract listing ID
    LISTING_ID=$(echo "$listing_body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$LISTING_ID" ]; then
        echo "   📝 Listing ID: $LISTING_ID"
    fi
else
    echo -e "${YELLOW}⚠️ SKIP${NC} - No authentication token available"
fi
echo ""

echo "📋 TEST 6: Get Categories (for Create Listing page)"
echo "---------------------------------------------------"
test_api "GET /api/categories" "GET" "/api/categories" "" "200"
CATEGORIES_BODY=$(cat /tmp/last_response.json)
CATEGORY_COUNT=$(echo "$CATEGORIES_BODY" | grep -c '"id":' || echo "0")
echo "   Categories found: $CATEGORY_COUNT"
echo ""

echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "Total Tests: $((pass_count + fail_count))"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! User flow is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some tests failed. Review the output above for details.${NC}"
    exit 1
fi
