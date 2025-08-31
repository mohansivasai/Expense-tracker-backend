#!/bin/bash

# Test script for local development environment
# This script tests the API endpoints to ensure everything is working

set -e

echo "🧪 Testing Local Development Environment..."

# Check if services are running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ API is not running on port 3000"
    echo "Please start the local development environment first:"
    echo "  npm run local:start"
    exit 1
fi

if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ DynamoDB Local is not running on port 8000"
    echo "Please start the local development environment first:"
    echo "  npm run local:start"
    exit 1
fi

echo "✅ Services are running"

# Test health endpoint
echo "🔍 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test auth verification
echo "🔐 Testing auth verification..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/verify \
    -H "Authorization: Bearer test-token" \
    -H "Content-Type: application/json")
if echo "$AUTH_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Auth verification passed"
else
    echo "❌ Auth verification failed"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Test creating an expense
echo "💰 Testing expense creation..."
EXPENSE_DATA='{
  "title": "Test Expense",
  "amount": 25.50,
  "category": "food",
  "date": "2024-01-15",
  "description": "Test expense for local testing"
}'

CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/expenses \
    -H "Authorization: Bearer test-token" \
    -H "Content-Type: application/json" \
    -d "$EXPENSE_DATA")

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Expense creation passed"
    # Extract expense ID for further testing
    EXPENSE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"expenseId":"[^"]*"' | cut -d'"' -f4)
    echo "📝 Created expense with ID: $EXPENSE_ID"
else
    echo "❌ Expense creation failed"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

# Test getting expenses
echo "📋 Testing expense retrieval..."
EXPENSES_RESPONSE=$(curl -s http://localhost:3000/expenses \
    -H "Authorization: Bearer test-token")

if echo "$EXPENSES_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Expense retrieval passed"
else
    echo "❌ Expense retrieval failed"
    echo "Response: $EXPENSES_RESPONSE"
    exit 1
fi

# Test getting categories
echo "🏷️ Testing categories endpoint..."
CATEGORIES_RESPONSE=$(curl -s http://localhost:3000/categories \
    -H "Authorization: Bearer test-token")

if echo "$CATEGORIES_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Categories endpoint passed"
else
    echo "❌ Categories endpoint failed"
    echo "Response: $CATEGORIES_RESPONSE"
    exit 1
fi

# Test getting summary
echo "📊 Testing summary endpoint..."
SUMMARY_RESPONSE=$(curl -s http://localhost:3000/summary \
    -H "Authorization: Bearer test-token")

if echo "$SUMMARY_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Summary endpoint passed"
else
    echo "❌ Summary endpoint failed"
    echo "Response: $SUMMARY_RESPONSE"
    exit 1
fi

# Test unauthorized access
echo "🚫 Testing unauthorized access..."
UNAUTHORIZED_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/expenses)
HTTP_CODE=$(echo "$UNAUTHORIZED_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Unauthorized access properly blocked"
else
    echo "❌ Unauthorized access not properly blocked (HTTP: $HTTP_CODE)"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Your local development environment is working correctly."
echo ""
echo "📱 API is available at: http://localhost:3000"
echo "🗄️ DynamoDB Local is running at: http://localhost:8000"
echo ""
echo "🔐 Use this token for testing: Bearer test-token"
echo "📚 See LOCAL_DEVELOPMENT.md for more details"
