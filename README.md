# Expense Tracker Backend

A TypeScript-based backend API for an expense tracking application, designed to run on AWS Lambda with API Gateway and DynamoDB. This backend is optimized to work with AWS Amplify for frontend authentication.

## Features

- **Expense Management**: Create, read, update, and delete expenses
- **User Authentication**: JWT-based authentication with AWS Cognito
- **Data Storage**: DynamoDB with optimized queries and indexes
- **API Gateway Integration**: RESTful API endpoints with CORS support
- **Serverless Architecture**: Built with AWS Lambda and Serverless Framework
- **TypeScript**: Full type safety and modern JavaScript features

## Architecture

```
Frontend (AWS Amplify) → API Gateway → Lambda Functions → DynamoDB
                                    ↓
                              Cognito User Pool
```

## Prerequisites

- Node.js 18+ 
- AWS CLI configured with appropriate permissions
- Serverless Framework CLI
- TypeScript knowledge

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your AWS credentials and configuration
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

- `AWS_REGION`: Your AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `DYNAMODB_TABLE`: DynamoDB table name
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID (if using existing)
- `COGNITO_CLIENT_ID`: Cognito Client ID (if using existing)

### AWS Permissions

Ensure your AWS user/role has permissions for:
- Lambda (create, update, delete functions)
- API Gateway (create, update, delete APIs)
- DynamoDB (create, update, delete tables)
- Cognito (create, update, delete user pools)
- IAM (create roles and policies)

## Development

### Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Serverless Offline

```bash
# Start serverless offline for local testing
npx serverless offline start
```

## Deployment

### Deploy to Development

```bash
npm run deploy:dev
```

### Deploy to Production

```bash
npm run deploy:prod
```

### Manual Deployment

```bash
# Build and deploy
npm run build
serverless deploy --stage dev
```

## API Endpoints

### Authentication Endpoints

- `POST /auth/verify` - Verify JWT token
- `GET /health` - Health check (no auth required)

### Expense Endpoints

- `GET /expenses` - List expenses with filters
- `POST /expenses` - Create new expense
- `GET /expenses/{id}` - Get specific expense
- `PUT /expenses/{id}` - Update expense
- `DELETE /expenses/{id}` - Delete expense

### Summary Endpoints

- `GET /summary` - Get expense summary and analytics

### Category Endpoints

- `GET /categories` - Get all expense categories
- `GET /categories/{category}` - Get expenses by category

## API Authentication

All endpoints (except `/health` and `/auth/verify`) require authentication via JWT tokens from AWS Cognito.

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Example Request

```bash
curl -X GET https://your-api-gateway-url/expenses \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

## DynamoDB Schema

### Expenses Table

- **Partition Key**: `userId` (String)
- **Sort Key**: `expenseId` (String)
- **Global Secondary Index**: `UserDateIndex`
  - Partition Key: `userId` (String)
  - Sort Key: `date` (String)

### Sample Expense Item

```json
{
  "userId": "user123",
  "expenseId": "exp456",
  "title": "Grocery Shopping",
  "amount": 75.50,
  "category": "food",
  "date": "2024-01-15",
  "description": "Weekly groceries",
  "tags": ["groceries", "weekly"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Frontend Integration with AWS Amplify

### Setup Amplify

```bash
npm install aws-amplify
```

### Configure Amplify

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'your-user-pool-id',
    userPoolWebClientId: 'your-client-id',
  },
  API: {
    endpoints: [
      {
        name: 'ExpenseAPI',
        endpoint: 'your-api-gateway-url',
        region: 'us-east-1',
      },
    ],
  },
});
```

### Authentication

```typescript
import { Auth } from 'aws-amplify';

// Sign in
const user = await Auth.signIn(email, password);

// Get current session
const session = await Auth.currentSession();
const token = session.getIdToken().getJwtToken();

// Sign out
await Auth.signOut();
```

### API Calls

```typescript
import { API } from 'aws-amplify';

// Get expenses
const expenses = await API.get('ExpenseAPI', '/expenses', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Create expense
const newExpense = await API.post('ExpenseAPI', '/expenses', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: {
    title: 'New Expense',
    amount: 25.00,
    category: 'food',
    date: '2024-01-15',
  },
});
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Deploy to test environment
npm run deploy:dev

# Run integration tests
npm run test:integration
```

## Monitoring and Logging

- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: API Gateway and Lambda metrics
- **X-Ray**: Distributed tracing (optional)

## Security Considerations

- All endpoints (except health check) require authentication
- JWT tokens are validated on every request
- DynamoDB access is restricted by IAM policies
- CORS is configured for frontend integration
- Input validation and sanitization implemented

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS headers are properly configured
2. **Authentication Failures**: Verify JWT token format and Cognito configuration
3. **DynamoDB Errors**: Check IAM permissions and table configuration
4. **Deployment Failures**: Verify AWS credentials and permissions

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
npm run deploy:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review AWS documentation for Lambda, API Gateway, and DynamoDB
