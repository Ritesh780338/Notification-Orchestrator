#!/bin/bash

# Authentication Testing Script
# This script tests the authentication endpoints

BASE_URL="http://localhost:3000/api"

echo "=================================="
echo "Authentication Testing Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Register New User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Extract token from register response
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
else
  echo -e "${RED}✗ Registration failed${NC}"
fi
echo ""

# Test 2: Login with demo user
echo -e "${YELLOW}Test 2: Login with Demo User${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract token from login response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Token: $TOKEN"
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Make sure you ran: npm run seed"
  exit 1
fi
echo ""

# Test 3: Get current user info
echo -e "${YELLOW}Test 3: Get Current User Info${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | jq '.'
echo ""

if echo "$ME_RESPONSE" | jq -e '.user' > /dev/null; then
  echo -e "${GREEN}✓ Get user info successful${NC}"
else
  echo -e "${RED}✗ Get user info failed${NC}"
fi
echo ""

# Test 4: Access protected endpoint (notifications stats)
echo -e "${YELLOW}Test 4: Access Protected Endpoint${NC}"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/notifications/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS_RESPONSE" | jq '.'
echo ""

if echo "$STATS_RESPONSE" | jq -e '.total' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Protected endpoint access successful${NC}"
else
  echo -e "${YELLOW}⚠ Protected endpoint returned data (may be empty if no notifications)${NC}"
fi
echo ""

# Test 5: Logout
echo -e "${YELLOW}Test 5: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

echo "$LOGOUT_RESPONSE" | jq '.'
echo ""

if echo "$LOGOUT_RESPONSE" | jq -e '.message' > /dev/null; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
fi
echo ""

# Test 6: Try to access protected endpoint without token
echo -e "${YELLOW}Test 6: Access Protected Endpoint Without Token (Should Fail)${NC}"
NO_AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me")

echo "$NO_AUTH_RESPONSE" | jq '.'
echo ""

if echo "$NO_AUTH_RESPONSE" | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected unauthorized request${NC}"
else
  echo -e "${RED}✗ Should have rejected unauthorized request${NC}"
fi
echo ""

echo "=================================="
echo "Testing Complete!"
echo "=================================="
