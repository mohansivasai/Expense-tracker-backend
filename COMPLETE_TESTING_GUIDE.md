# 🧪 Complete API Testing Guide

This guide shows you how to test the Expense Tracker Backend locally with comprehensive examples for all HTTP methods and data scenarios.

## 🚀 **Quick Start - One Command Setup**

### **Start Everything with One Command:**
```bash
npm run start:local
```

This single command will:
1. ✅ Start DynamoDB Local in Docker
2. ✅ Create the DynamoDB table with proper schema
3. ✅ Seed 7 sample expenses across 2 users
4. ✅ Start the Express API server
5. ✅ Provide you with all endpoints and testing info

## 📱 **API Endpoints Overview**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check | ❌ No |
| `POST` | `/auth/verify` | Verify authentication token | ❌ No |
| `GET` | `/expenses` | Get all expenses (with filters) | ✅ Yes |
| `POST` | `/expenses` | Create new expense | ✅ Yes |
| `GET` | `/expenses/:id` | Get specific expense | ✅ Yes |
| `PUT` | `/expenses/:id` | Update expense | ✅ Yes |
| `DELETE` | `/expenses/:id` | Delete expense | ✅ Yes |
| `GET` | `/summary` | Get expense summary | ✅ Yes |
| `GET` | `/categories` | Get all categories | ✅ Yes |
| `GET` | `/categories/:category` | Get expenses by category | ✅ Yes |

## 🔐 **Authentication**

For local testing, use this token:
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
  "environment": "development"
}
```

### **2. Authentication Verification**
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

## 💰 **Expense Management Testing**

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

### **4. Get Expenses with Filters**
```
GET http://localhost:3000/expenses?category=food&minAmount=10&maxAmount=100
Headers: Authorization: Bearer test-token
```

**Query Parameters Available:**
- `category`: Filter by expense category
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)
- `minAmount`: Minimum amount filter
- `maxAmount`: Maximum amount filter
- `limit`: Number of results (default: 50)
- `nextToken`: Pagination token

### **5. Create New Expense**
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

**Required Fields:**
- `title`: Expense title
- `amount`: Amount (must be > 0)
- `category`: Expense category
- `date`: Date in YYYY-MM-DD format

**Optional Fields:**
- `description`: Expense description
- `tags`: Array of tags

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

### **6. Get Specific Expense**
```
GET http://localhost:3000/expenses/{expenseId}
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
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
}
```

### **7. Update Expense**
```
PUT http://localhost:3000/expenses/{expenseId}
Headers: 
  Authorization: Bearer test-token
  Content-Type: application/json
Body:
{
  "title": "Updated Grocery Shopping",
  "amount": 80.00,
  "description": "Updated description"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "expenseId": "uuid-here",
    "userId": "dev-user-123",
    "title": "Updated Grocery Shopping",
    "amount": 80.00,
    "category": "food",
    "date": "2024-01-15",
    "description": "Updated description",
    "tags": ["groceries", "weekly"],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  },
  "message": "Expense updated successfully"
}
```

### **8. Delete Expense**
```
DELETE http://localhost:3000/expenses/{expenseId}
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

## 📊 **Summary and Analytics Testing**

### **9. Get Expense Summary**
```
GET http://localhost:3000/summary
Headers: Authorization: Bearer test-token
```

**Query Parameters:**
- `startDate`: Start date for summary (YYYY-MM-DD)
- `endDate`: End date for summary (YYYY-MM-DD)

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

### **10. Get All Categories**
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

### **11. Get Expenses by Category**
```
GET http://localhost:3000/categories/food
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
  ]
}
```

## 🔍 **Advanced Testing Scenarios**

### **12. Test Pagination**
```
GET http://localhost:3000/expenses?limit=2
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    // First 2 expenses
  ],
  "nextToken": "base64-encoded-token",
  "hasMore": true
}
```

**Get Next Page:**
```
GET http://localhost:3000/expenses?limit=2&nextToken={token}
Headers: Authorization: Bearer test-token
```

### **13. Test Date Range Filtering**
```
GET http://localhost:3000/expenses?startDate=2024-01-10&endDate=2024-01-15
Headers: Authorization: Bearer test-token
```

### **14. Test Amount Range Filtering**
```
GET http://localhost:3000/expenses?minAmount=20&maxAmount=100
Headers: Authorization: Bearer test-token
```

### **15. Test Combined Filters**
```
GET http://localhost:3000/expenses?category=food&startDate=2024-01-01&endDate=2024-01-31&minAmount=10&maxAmount=100&limit=5
Headers: Authorization: Bearer test-token
```

## 🚨 **Error Testing Scenarios**

### **16. Test Unauthorized Access**
```
GET http://localhost:3000/expenses
Headers: (No Authorization header)
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

### **17. Test Invalid Token**
```
GET http://localhost:3000/expenses
Headers: Authorization: Bearer invalid-token
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

### **18. Test Invalid Expense ID**
```
GET http://localhost:3000/expenses/invalid-id
Headers: Authorization: Bearer test-token
```

**Expected Response:**
```json
{
  "error": "Not Found",
  "message": "Expense not found"
}
```

### **19. Test Validation Errors**
```
POST http://localhost:3000/expenses
Headers: 
  Authorization: Bearer test-token
  Content-Type: application/json
Body:
{
  "title": "",
  "amount": -10,
  "category": "",
  "date": "invalid-date"
}
```

**Expected Response:**
```json
{
  "error": "Bad Request",
  "message": "Amount must be greater than 0"
}
```

## 📊 **Data Management Commands**

### **Export Data to Files:**
```bash
npm run data:export
```

### **Import Data from Files:**
```bash
npm run data:import
```

### **Clear All Data:**
```bash
npm run data:clear
```

### **List Data Files:**
```bash
npm run data:list
```

### **Show Data Summary:**
```bash
npm run data:summary
```

### **Backup Current Data:**
```bash
npm run data:backup
```

## 🧪 **Automated Testing**

### **Run API Tests:**
```bash
npm run test:api
```

### **Run Unit Tests:**
```bash
npm run test:local
```

## 🔧 **Testing Tools**

### **Postman Collection:**
1. Import the endpoints above into Postman
2. Set environment variable: `baseUrl = http://localhost:3000`
3. Set environment variable: `authToken = test-token`
4. Use `{{baseUrl}}` and `{{authToken}}` in your requests

### **cURL Examples:**
```bash
# Health check
curl http://localhost:3000/health

# Get expenses
curl -H "Authorization: Bearer test-token" http://localhost:3000/expenses

# Create expense
curl -X POST -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","amount":25.00,"category":"food","date":"2024-01-16"}' \
  http://localhost:3000/expenses
```

### **AWS CLI (for DynamoDB Local):**
```bash
# List all expenses
aws dynamodb scan --table-name expense-tracker-backend-dev --endpoint-url http://localhost:8000

# Get specific expense
aws dynamodb get-item \
  --table-name expense-tracker-backend-dev \
  --key '{"userId":{"S":"dev-user-123"},"expenseId":{"S":"expense-id"}}' \
  --endpoint-url http://localhost:8000
```

## 📝 **Test Data Structure**

### **Sample Expense Object:**
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

### **Available Categories:**
- `food` - Food & Dining 🍽️
- `transport` - Transportation 🚗
- `shopping` - Shopping 🛍️
- `entertainment` - Entertainment 🎬
- `health` - Health & Fitness 💊
- `bills` - Bills & Utilities 📱
- `education` - Education 📚
- `other` - Other 📦

## 🎯 **Testing Checklist**

- [ ] Health check endpoint
- [ ] Authentication verification
- [ ] Get all expenses
- [ ] Get expenses with filters
- [ ] Create new expense
- [ ] Get specific expense
- [ ] Update expense
- [ ] Delete expense
- [ ] Get expense summary
- [ ] Get all categories
- [ ] Get expenses by category
- [ ] Test pagination
- [ ] Test date filtering
- [ ] Test amount filtering
- [ ] Test combined filters
- [ ] Test error scenarios
- [ ] Test validation errors
- [ ] Export/import data
- [ ] Run automated tests

## 🚀 **Next Steps**

1. **Start the local environment**: `npm run start:local`
2. **Test all endpoints** using the examples above
3. **Export your test data**: `npm run data:export`
4. **Run automated tests**: `npm run test:api`
5. **Deploy to AWS** when ready

## 📚 **Additional Resources**

- [Postman Documentation](https://learning.postman.com/)
- [cURL Tutorial](https://curl.se/docs/tutorial.html)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
