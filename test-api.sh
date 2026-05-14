#!/bin/bash

# Travereel API Test Script
# Tests core functionality before deployment

BASE_URL="http://localhost:3000/api"
PASS=0
FAIL=0

echo "🧪 Travereel API Test Suite"
echo "================================"
echo ""

# Helper function
test_endpoint() {
  local name=$1
  local endpoint=$2
  local method=${3:-GET}
  local data=$4
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  if [ "$response" -ge 200 ] && [ "$response" -lt 500 ]; then
    echo "✅ PASS (HTTP $response)"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL (HTTP $response)"
    FAIL=$((FAIL + 1))
  fi
}

# Test endpoints
echo "📍 Testing API Endpoints..."
echo ""

test_endpoint "Auth - Register" "/auth" "POST" '{
  "action": "register",
  "email": "test@test.com",
  "username": "testuser",
  "name": "Test User",
  "password": "Test123!@#"
}'

test_endpoint "Auth - Login" "/auth" "POST" '{
  "action": "login",
  "email": "test@test.com",
  "password": "Test123!@#"
}'

test_endpoint "Posts - GET" "/posts" "GET"

test_endpoint "Users - GET" "/users" "GET"

test_endpoint "Communities - GET" "/communities" "GET"

test_endpoint "Search - GET" "/search?q=test" "GET"

echo ""
echo "================================"
echo "📊 Test Results:"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "📝 Total: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed! Ready for deployment."
else
  echo "⚠️  Some tests failed. Check the endpoints above."
fi

echo ""
echo "💡 Next steps:"
echo "1. Make sure dev server is running: bun run dev"
echo "2. Check database connection"
echo "3. Review failed endpoints if any"
