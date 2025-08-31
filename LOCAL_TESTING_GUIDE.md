# 🧪 Local Testing Guide with Sample Data

This guide shows you how to run the Expense Tracker Backend locally with sample data in DynamoDB Local.

## 🚀 **Quick Start (3 Steps)**

### **Step 1: Start Docker Desktop**
1. Open Docker Desktop on Windows
2. Wait for it to start (check system tray)
3. Verify with: `docker --version`

### **Step 2: Start Local Environment**
```bash
npm run local:start:win
```

### **Step 3: Seed Sample Data**
```bash
npm run seed:local
```

## 📊 **Sample Data Overview**

The seeding script creates **7 sample expenses** across **2 users**:

### **User: dev-user-123 (5 expenses)**
- 🍽️ **Grocery Shopping** - $75.50 (food)
- ⛽ **Gas Station** - $45.00 (transport)
- 🎬 **Movie Tickets** - $32.00 (entertainment)
- ☕ **Coffee Shop** - $8.50 (food)
- 💪 **Gym Membership** - $29.99 (health)

### **User: dev-user-456 (2 expenses)**
- 📚 **Online Course** - $99.99 (education)
- 💡 **Electric Bill** - $85.00 (bills)

## 🌐 **Local API Endpoints**

Once running, your API will be available at:

- **Base URL:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **Auth Verify:** `http://localhost:3000/auth/verify`
- **Expenses:** `http://localhost:3000/expenses`
- **Summary:** `http://localhost:3000/summary`
- **Categories:** `http://localhost:3000/categories`

## 🔐 **Authentication for Testing**

For local development, use this token:
```
Authorization: Bearer test-token
```

## 🧪 **Testing with Postman**

### **1. Health Check (No Auth Required)**
```
GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "service": "expense-tracker-backend",
  "environment": "dev",
  "region": "us-east-1"
}
```

### **2. Auth Verification**
```
POST http://localhost:3000/auth/verify
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "dev-user-123",
    "email": "dev@example.com",
    "groups": ["users"]
  },
  "message": "Token is valid"
}
```

### **3. Get All Expenses**
```
GET http://localhost:3000/expenses
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "expenseId": "uuid-here",
      "userId": "dev-user-123",
      "title": "Grocery Shopping",
      "amount": 75.50,
      "category": "food",
      "date": "2024-01-15",
      "description": "Weekly groceries from Walmart",
      "tags": ["groceries", "weekly"],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
    // ... more expenses
  ],
  "nextToken": null,
  "hasMore": false
}
```

### **4. Get Expenses by Category**
```
GET http://localhost:3000/expenses?category=food
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "expenseId": "uuid-here",
      "title": "Grocery Shopping",
      "amount": 75.50,
      "category": "food",
      "date": "2024-01-15"
    },
    {
      "expenseId": "uuid-here",
      "title": "Coffee Shop",
      "amount": 8.50,
      "category": "food",
      "date": "2024-01-12"
    }
  ],
  "nextToken": null,
  "hasMore": false
}
```

### **5. Get Expense Summary**
```
GET http://localhost:3000/summary
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 5,
    "totalAmount": 190.99,
    "averageAmount": 38.20,
    "categoryBreakdown": {
      "food": { "count": 2, "total": 84.00 },
      "transport": { "count": 1, "total": 45.00 },
      "entertainment": { "count": 1, "total": 32.00 },
      "health": { "count": 1, "total": 29.99 }
    },
    "monthlyBreakdown": {
      "2024-01": { "count": 5, "total": 190.99 }
    }
  }
}
```

### **6. Get Categories**
```
GET http://localhost:3000/categories
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "id": "food", "name": "Food & Dining", "icon": "🍽️", "color": "#FF6B6B" },
    { "id": "transport", "name": "Transportation", "icon": "🚗", "color": "#4ECDC4" },
    { "id": "shopping", "name": "Shopping", "icon": "🛍️", "color": "#45B7D1" },
    { "id": "entertainment", "name": "Entertainment", "icon": "🎬", "color": "#96CEB4" },
    { "id": "health", "name": "Health & Fitness", "icon": "💊", "color": "#FFEAA7" },
    { "id": "bills", "name": "Bills & Utilities", "icon": "📱", "color": "#DDA0DD" },
    { "id": "education", "name": "Education", "icon": "📚", "color": "#98D8C8" },
    { "id": "other", "name": "Other", "icon": "📦", "color": "#F7DC6F" }
  ]
}
```

### **7. Create New Expense**
```
POST http://localhost:3000/expenses
Headers: 
  Authorization: Bearer test-token
  Content-Type: application/json
Body:
{
  "title": "Lunch with Friends",
  "amount": 25.00,
  "category": "food",
  "date": "2024-01-16",
  "description": "Pizza lunch downtown",
  "tags": ["lunch", "social"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "expenseId": "new-uuid-here",
    "userId": "dev-user-123",
    "title": "Lunch with Friends",
    "amount": 25.00,
    "category": "food",
    "date": "2024-01-16",
    "description": "Pizza lunch downtown",
    "tags": ["lunch", "social"],
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  },
  "message": "Expense created successfully"
}
```

## 🔍 **Viewing Data in DynamoDB Local**

### **Using AWS CLI:**
```bash
# List all expenses
aws dynamodb scan --table-name expense-tracker-backend-dev --endpoint-url http://localhost:8000

# Get specific expense
aws dynamodb get-item \
  --table-name expense-tracker-backend-dev \
  --key '{"userId":{"S":"dev-user-123"},"expenseId":{"S":"expense-id-here"}}' \
  --endpoint-url http://localhost:8000
```

### **Using NoSQL Workbench:**
1. Download [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html)
2. Connect to: `http://localhost:8000`
3. Browse the `expense-tracker-backend-dev` table

## 📝 **Data Structure Examples**

### **Expense Object:**
```json
{
  "expenseId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "dev-user-123",
  "title": "Grocery Shopping",
  "amount": 75.50,
  "category": "food",
  "date": "2024-01-15",
  "description": "Weekly groceries from Walmart",
  "tags": ["groceries", "weekly"],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### **Query Parameters:**
```json
{
  "userId": "dev-user-123",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "category": "food",
  "minAmount": 10.00,
  "maxAmount": 100.00,
  "limit": 10,
  "nextToken": null
}
```

### **Response Format:**
```json
{
  "success": true,
  "data": [...],
  "nextToken": "base64-encoded-pagination-token",
  "hasMore": true
}
```

## 🚨 **Troubleshooting**

### **Docker Issues:**
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# Or restart Docker service
```

### **Port Conflicts:**
```bash
# Check what's using port 8000
netstat -an | findstr ":8000"

# Check what's using port 3000
netstat -an | findstr ":3000"
```

### **Build Errors:**
```bash
# Clean and rebuild
npm run build
```

## 🎯 **Next Steps**

1. **Test all endpoints** with Postman
2. **Verify data persistence** in DynamoDB Local
3. **Test different scenarios** (filters, pagination, etc.)
4. **Run unit tests** with `npm run test:local`
5. **Deploy to AWS** when ready

## 📚 **Additional Resources**

- [Serverless Offline Documentation](https://github.com/dherault/serverless-offline)
- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Postman Collection Template](https://learning.postman.com/docs/collections/using-collections/)
