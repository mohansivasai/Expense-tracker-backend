# 🚀 Local Development Guide

This guide explains how to run the Expense Tracker Backend locally with DynamoDB local and Serverless Offline.

## 📋 Prerequisites

- **Node.js 18+** installed
- **Docker** installed and running
- **npm** or **yarn** package manager

## 🏃‍♂️ Quick Start

### **Option 1: Automated Script (Recommended)**

#### **Linux/macOS:**
```bash
chmod +x scripts/local-dev.sh
npm run local:start
```

#### **Windows:**
```cmd
npm run local:start:win
```

### **Option 2: Manual Steps**

1. **Start DynamoDB Local:**
   ```bash
   npm run local:db
   ```

2. **Start Serverless Offline:**
   ```bash
   npm run local:offline
   ```

3. **Stop Services:**
   ```bash
   npm run local:stop
   ```

## 🔧 What the Scripts Do

### **`local:start` / `local:start:win`**
- ✅ Checks Docker availability
- ✅ Stops conflicting processes on ports 8000 and 3000
- ✅ Starts DynamoDB Local container
- ✅ Creates `.env.local` configuration
- ✅ Installs dependencies
- ✅ Builds TypeScript project
- ✅ Starts Serverless Offline
- ✅ Cleans up on exit

### **`local:db`**
- Starts DynamoDB Local in Docker container
- Port: 8000
- In-memory database
- Shared database mode

### **`local:offline`**
- Builds the project
- Starts Serverless Offline
- Port: 3000 (API)
- Port: 3002 (Lambda functions)

## 🌐 Local Endpoints

Once running, your API will be available at:

- **Base URL:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **Auth Verify:** `http://localhost:3000/auth/verify`
- **Expenses:** `http://localhost:3000/expenses`
- **Summary:** `http://localhost:3000/summary`
- **Categories:** `http://localhost:3000/categories`

## 🔐 Local Authentication

For local development, the API uses `SimpleAuthService` which accepts:

### **Test Token:**
```
Authorization: Bearer test-token
```

### **Base64 Encoded JSON:**
```bash
# Encode this:
echo '{"userId":"dev-user-123","email":"dev@example.com","groups":["users"]}' | base64

# Use the result:
Authorization: Bearer <base64-encoded-string>
```

## 🧪 Testing with Postman

### **1. Health Check (No Auth)**
```
GET http://localhost:3000/health
```

### **2. Auth Verification**
```
POST http://localhost:3000/auth/verify
Headers: Authorization: Bearer test-token
```

### **3. Create Expense**
```
POST http://localhost:3000/expenses
Headers: 
  Authorization: Bearer test-token
  Content-Type: application/json
Body:
{
  "title": "Grocery Shopping",
  "amount": 75.50,
  "category": "food",
  "date": "2024-01-15",
  "description": "Weekly groceries"
}
```

### **4. Get Expenses**
```
GET http://localhost:3000/expenses
Headers: Authorization: Bearer test-token
```

### **5. Get Summary**
```
GET http://localhost:3000/summary
Headers: Authorization: Bearer test-token
```

## 🗄️ DynamoDB Local

### **Connection Details:**
- **Endpoint:** `http://localhost:8000`
- **Region:** `us-east-1`
- **Access Key:** `local`
- **Secret Key:** `local`

### **Table Structure:**
- **Table Name:** `expense-tracker-backend-dev`
- **Partition Key:** `userId` (String)
- **Sort Key:** `expenseId` (String)
- **GSI:** `UserDateIndex` (userId + date)

### **Viewing Data:**
```bash
# Using AWS CLI
aws dynamodb scan --table-name expense-tracker-backend-dev --endpoint-url http://localhost:8000

# Using NoSQL Workbench
# Connect to: http://localhost:8000
```

## 🔍 Troubleshooting

### **Port Already in Use**
```bash
# Find process using port 8000
lsof -i :8000

# Find process using port 3000
lsof -i :3000

# Kill process (replace PID)
kill -9 <PID>
```

### **Docker Issues**
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# Or restart Docker service on Linux
sudo systemctl restart docker
```

### **Build Errors**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### **DynamoDB Connection Issues**
```bash
# Check if container is running
docker ps

# View container logs
docker logs dynamodb-local

# Restart container
npm run local:stop
npm run local:db
```

## 📁 Environment Variables

The `.env.local` file contains:

```bash
NODE_ENV=development
IS_OFFLINE=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_TABLE=expense-tracker-backend-dev
DYNAMODB_ENDPOINT=http://localhost:8000
COGNITO_USER_POOL_ID=local-user-pool
COGNITO_CLIENT_ID=local-client-id
HTTP_PORT=3000
LAMBDA_PORT=3002
```

## 🧪 Running Tests Locally

```bash
# Run tests with local environment
npm run test:local

# Run specific test file
npm test -- src/__tests__/expenseService.test.ts

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Next Steps

1. **Test all endpoints** with Postman
2. **Verify data persistence** in DynamoDB Local
3. **Run unit tests** to ensure functionality
4. **Deploy to AWS** when ready for production

## 📚 Additional Resources

- [Serverless Offline Documentation](https://github.com/dherault/serverless-offline)
- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)
