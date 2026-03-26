#!/bin/bash

# Notification Orchestrator - API Test Script
# Quick script to test all API endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Notification Orchestrator - API Test Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET $BASE_URL/health"
response=$(curl -s -w "\n%{http_code}" $BASE_URL/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
fi
echo ""

# Test 2: Root Endpoint
echo "Test 2: Root Endpoint"
echo "GET $BASE_URL/"
response=$(curl -s -w "\n%{http_code}" $BASE_URL/)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
    echo "$body" | jq '.name, .version'
else
    echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
fi
echo ""

# Get user ID from database
echo "Fetching test user ID from database..."
USER_ID=$(psql -U postgres -d notification_orchestrator -t -c "SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1;" 2>/dev/null | xargs)

if [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}⚠ Warning: Could not fetch user ID. Some tests will be skipped.${NC}"
    echo "Make sure database is set up and migrations are run."
    echo ""
else
    echo -e "${GREEN}✓ User ID: $USER_ID${NC}"
    echo ""

    # Test 3: Get User Preferences
    echo "Test 3: Get User Preferences"
    echo "GET $BASE_URL/api/users/$USER_ID/preferences"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/$USER_ID/preferences")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
        echo "$body" | jq '.preferences | length' | xargs echo "Preferences count:"
    else
        echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
    fi
    echo ""

    # Test 4: Send Notification
    echo "Test 4: Send Notification Event"
    echo "POST $BASE_URL/api/notifications/events"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/events" \
        -H "Content-Type: application/json" \
        -d "{
            \"event_type\": \"user_signup\",
            \"user_id\": \"$USER_ID\",
            \"priority\": \"normal\",
            \"metadata\": {
                \"first_name\": \"Test User\"
            }
        }")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "202" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
        EVENT_ID=$(echo "$body" | jq -r '.event_id')
        echo "Event ID: $EVENT_ID"
        
        # Wait for processing
        echo "Waiting 3 seconds for processing..."
        sleep 3
        
        # Test 5: Check Notification Status
        echo ""
        echo "Test 5: Check Notification Status"
        echo "GET $BASE_URL/api/notifications/$EVENT_ID/status"
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/$EVENT_ID/status")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)

        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
            echo "$body" | jq '{status: .status, delivery_logs: .delivery_logs | length}'
        else
            echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
        fi
    else
        echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
        echo "$body"
    fi
    echo ""

    # Test 6: Update Preferences
    echo "Test 6: Update User Preferences"
    echo "PUT $BASE_URL/api/users/$USER_ID/preferences"
    response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/users/$USER_ID/preferences" \
        -H "Content-Type: application/json" \
        -d '{
            "preferences": [
                {
                    "channel": "email",
                    "category": "marketing",
                    "enabled": false
                }
            ]
        }')
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code"
        echo "$body" | jq '.message'
    else
        echo -e "${RED}✗ FAILED${NC} - Status: $http_code"
    fi
    echo ""
fi

# Test 7: Invalid Request
echo "Test 7: Invalid Request (Missing required fields)"
echo "POST $BASE_URL/api/notifications/events"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notifications/events" \
    -H "Content-Type: application/json" \
    -d '{
        "event_type": "test_event"
    }')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code (Expected 400)"
else
    echo -e "${RED}✗ FAILED${NC} - Status: $http_code (Expected 400)"
fi
echo ""

# Test 8: Non-existent Resource
echo "Test 8: Non-existent Notification"
echo "GET $BASE_URL/api/notifications/non-existent-id/status"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/notifications/non-existent-id/status")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "404" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $http_code (Expected 404)"
else
    echo -e "${RED}✗ FAILED${NC} - Status: $http_code (Expected 404)"
fi
echo ""

echo "=============================================="
echo "✅ API Tests Complete!"
echo ""
echo "Note: Make sure the application is running on $BASE_URL"
echo "Start with: npm run dev"
