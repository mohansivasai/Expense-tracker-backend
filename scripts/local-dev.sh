#!/bin/bash

# Local Development Script for Expense Tracker Backend
# This script starts DynamoDB local and runs serverless offline

set -e

echo "🚀 Starting Local Development Environment..."

# Check if Docker is running (for DynamoDB local)
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if port 8000 is available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use. Stopping existing process..."
    lsof -ti:8000 | xargs kill -9
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing process..."
    lsof -ti:3000 | xargs kill -9
fi

# Start DynamoDB Local
echo "📊 Starting DynamoDB Local on port 8000..."
docker run -d \
    --name dynamodb-local \
    -p 8000:8000 \
    -e AWS_ACCESS_KEY_ID=local \
    -e AWS_SECRET_ACCESS_KEY=local \
    -e AWS_DEFAULT_REGION=us-east-1 \
    amazon/dynamodb-local:latest \
    -jar DynamoDBLocal.jar -sharedDb -inMemory

# Wait for DynamoDB to be ready
echo "⏳ Waiting for DynamoDB to be ready..."
sleep 5

# Create local environment file
echo "🔧 Creating local environment configuration..."
cat > .env.local << EOF
# Local Development Environment
NODE_ENV=development
IS_OFFLINE=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_TABLE=expense-tracker-backend-dev
DYNAMODB_ENDPOINT=http://localhost:8000

# Cognito (for local testing)
COGNITO_USER_POOL_ID=local-user-pool
COGNITO_CLIENT_ID=local-client-id

# Serverless Offline
HTTP_PORT=3000
LAMBDA_PORT=3002
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Start Serverless Offline
echo "🌐 Starting Serverless Offline on port 3000..."
echo "📱 API will be available at: http://localhost:3000"
echo "🔐 Health check: http://localhost:3000/health"
echo "💰 Expenses: http://localhost:3000/expenses"
echo "📈 Summary: http://localhost:3000/summary"
echo "🏷️  Categories: http://localhost:3000/categories"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker stop dynamodb-local > /dev/null 2>&1 || true
    docker rm dynamodb-local > /dev/null 2>&1 || true
    rm -f .env.local
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start serverless offline
npx serverless offline start --stage dev --region us-east-1
