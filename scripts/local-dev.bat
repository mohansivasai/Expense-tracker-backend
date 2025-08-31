@echo off
REM Local Development Script for Expense Tracker Backend (Windows)
REM This script starts DynamoDB local and runs serverless offline

echo 🚀 Starting Local Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if port 8000 is available and stop if in use
netstat -an | findstr ":8000" >nul
if not errorlevel 1 (
    echo ⚠️  Port 8000 is already in use. Stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Check if port 3000 is available and stop if in use
netstat -an | findstr ":3000" >nul
if not errorlevel 1 (
    echo ⚠️  Port 3000 is already in use. Stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Start DynamoDB Local
echo 📊 Starting DynamoDB Local on port 8000...
docker run -d --name dynamodb-local -p 8000:8000 -e AWS_ACCESS_KEY_ID=local -e AWS_SECRET_ACCESS_KEY=local -e AWS_DEFAULT_REGION=us-east-1 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -sharedDb -inMemory

REM Wait for DynamoDB to be ready
echo ⏳ Waiting for DynamoDB to be ready...
timeout /t 5 /nobreak >nul

REM Create local environment file
echo 🔧 Creating local environment configuration...
(
echo # Local Development Environment
echo NODE_ENV=development
echo IS_OFFLINE=true
echo AWS_REGION=us-east-1
echo AWS_ACCESS_KEY_ID=local
echo AWS_SECRET_ACCESS_KEY=local
echo DYNAMODB_TABLE=expense-tracker-backend-dev
echo DYNAMODB_ENDPOINT=http://localhost:8000
echo.
echo # Cognito ^(for local testing^)
echo COGNITO_USER_POOL_ID=local-user-pool
echo COGNITO_CLIENT_ID=local-client-id
echo.
echo # Serverless Offline
echo HTTP_PORT=3000
echo LAMBDA_PORT=3002
) > .env.local

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the project
echo 🔨 Building TypeScript project...
npm run build

REM Start Serverless Offline
echo 🌐 Starting Serverless Offline on port 3000...
echo 📱 API will be available at: http://localhost:3000
echo 🔐 Health check: http://localhost:3000/health
echo 💰 Expenses: http://localhost:3000/expenses
echo 📈 Summary: http://localhost:3000/summary
echo 🏷️  Categories: http://localhost:3000/categories
echo.
echo Press Ctrl+C to stop all services

REM Start serverless offline
npx serverless offline start --stage dev --region us-east-1

REM Cleanup on exit
echo.
echo 🧹 Cleaning up...
docker stop dynamodb-local >nul 2>&1
docker rm dynamodb-local >nul 2>&1
del .env.local >nul 2>&1
echo ✅ Cleanup complete
pause
