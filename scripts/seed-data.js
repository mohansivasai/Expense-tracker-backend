const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Sample data for testing
const sampleExpenses = [
  {
    expenseId: uuidv4(),
    userId: 'dev-user-123',
    title: 'Grocery Shopping',
    amount: 75.50,
    category: 'food',
    date: '2024-01-15',
    description: 'Weekly groceries from Walmart',
    tags: ['groceries', 'weekly'],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-123',
    title: 'Gas Station',
    amount: 45.00,
    category: 'transport',
    date: '2024-01-14',
    description: 'Fuel for car',
    tags: ['fuel', 'car'],
    createdAt: '2024-01-14T15:30:00.000Z',
    updatedAt: '2024-01-14T15:30:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-123',
    title: 'Movie Tickets',
    amount: 32.00,
    category: 'entertainment',
    date: '2024-01-13',
    description: 'Avengers movie with friends',
    tags: ['movie', 'entertainment'],
    createdAt: '2024-01-13T19:00:00.000Z',
    updatedAt: '2024-01-13T19:00:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-123',
    title: 'Coffee Shop',
    amount: 8.50,
    category: 'food',
    date: '2024-01-12',
    description: 'Morning coffee and pastry',
    tags: ['coffee', 'breakfast'],
    createdAt: '2024-01-12T08:00:00.000Z',
    updatedAt: '2024-01-12T08:00:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-123',
    title: 'Gym Membership',
    amount: 29.99,
    category: 'health',
    date: '2024-01-10',
    description: 'Monthly gym subscription',
    tags: ['fitness', 'subscription'],
    createdAt: '2024-01-10T12:00:00.000Z',
    updatedAt: '2024-01-10T12:00:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-456',
    title: 'Online Course',
    amount: 99.99,
    category: 'education',
    date: '2024-01-08',
    description: 'React development course on Udemy',
    tags: ['learning', 'programming'],
    createdAt: '2024-01-08T09:00:00.000Z',
    updatedAt: '2024-01-08T09:00:00.000Z'
  },
  {
    expenseId: uuidv4(),
    userId: 'dev-user-456',
    title: 'Electric Bill',
    amount: 85.00,
    category: 'bills',
    date: '2024-01-05',
    description: 'Monthly electricity payment',
    tags: ['utilities', 'monthly'],
    createdAt: '2024-01-05T14:00:00.000Z',
    updatedAt: '2024-01-05T14:00:00.000Z'
  }
];

// DynamoDB configuration for local
const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'expense-tracker-backend-dev';

async function seedData() {
  console.log('🌱 Seeding DynamoDB Local with sample data...');
  
  try {
    // Insert sample expenses
    for (const expense of sampleExpenses) {
      const command = new PutCommand({
        TableName: tableName,
        Item: expense
      });
      
      await docClient.send(command);
      console.log(`✅ Added: ${expense.title} - $${expense.amount}`);
    }
    
    console.log('\n🎉 Sample data seeded successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Total expenses: ${sampleExpenses.length}`);
    console.log(`- User 1 (dev-user-123): ${sampleExpenses.filter(e => e.userId === 'dev-user-123').length} expenses`);
    console.log(`- User 2 (dev-user-456): ${sampleExpenses.filter(e => e.userId === 'dev-user-456').length} expenses`);
    
    console.log('\n🔍 Categories available:');
    const categories = [...new Set(sampleExpenses.map(e => e.category))];
    categories.forEach(cat => {
      const count = sampleExpenses.filter(e => e.category === cat).length;
      const total = sampleExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      console.log(`  - ${cat}: ${count} expenses, $${total.toFixed(2)} total`);
    });
    
    console.log('\n🚀 You can now test the API endpoints!');
    console.log('📱 Health check: http://localhost:3000/health');
    console.log('💰 Get expenses: http://localhost:3000/expenses (with Authorization: Bearer test-token)');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding
seedData();
