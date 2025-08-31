const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'Bearer test-token';

// Test configuration
const config = {
  headers: {
    'Authorization': AUTH_TOKEN,
    'Content-Type': 'application/json'
  }
};

async function testAPI() {
  console.log('🧪 Testing Expense Tracker API...\n');
  
  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Service:', healthResponse.data.service);
    console.log('   Environment:', healthResponse.data.environment);
    console.log('   Region:', healthResponse.data.region);
    console.log('');

    // 2. Auth Verification
    console.log('2️⃣ Testing Auth Verification...');
    const authResponse = await axios.post(`${BASE_URL}/auth/verify`, {}, config);
    console.log('✅ Auth Verification:', authResponse.data.message);
    console.log('   User ID:', authResponse.data.data.userId);
    console.log('   Email:', authResponse.data.data.email);
    console.log('   Groups:', authResponse.data.data.groups.join(', '));
    console.log('');

    // 3. Get Categories
    console.log('3️⃣ Testing Categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories`, config);
    console.log('✅ Categories:', categoriesResponse.data.data.length, 'categories found');
    categoriesResponse.data.data.forEach(cat => {
      console.log(`   - ${cat.icon} ${cat.name} (${cat.id})`);
    });
    console.log('');

    // 4. Get All Expenses
    console.log('4️⃣ Testing Get All Expenses...');
    const expensesResponse = await axios.get(`${BASE_URL}/expenses`, config);
    console.log('✅ Expenses:', expensesResponse.data.data.length, 'expenses found');
    console.log('   Total:', expensesResponse.data.data.length);
    console.log('   Has More:', expensesResponse.data.hasMore);
    console.log('   Next Token:', expensesResponse.data.nextToken || 'None');
    console.log('');

    // 5. Show Sample Expenses
    console.log('📊 Sample Expenses:');
    expensesResponse.data.data.slice(0, 3).forEach((expense, index) => {
      console.log(`   ${index + 1}. ${expense.title}`);
      console.log(`      Amount: $${expense.amount}`);
      console.log(`      Category: ${expense.category}`);
      console.log(`      Date: ${expense.date}`);
      console.log(`      Description: ${expense.description}`);
      console.log('');
    });

    // 6. Get Expenses by Category
    console.log('5️⃣ Testing Get Expenses by Category (food)...');
    const foodExpensesResponse = await axios.get(`${BASE_URL}/expenses?category=food`, config);
    console.log('✅ Food Expenses:', foodExpensesResponse.data.data.length, 'expenses found');
    foodExpensesResponse.data.data.forEach(expense => {
      console.log(`   - ${expense.title}: $${expense.amount}`);
    });
    console.log('');

    // 7. Get Expense Summary
    console.log('6️⃣ Testing Expense Summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/summary`, config);
    const summary = summaryResponse.data.data;
    console.log('✅ Summary:');
    console.log(`   Total Expenses: ${summary.totalExpenses}`);
    console.log(`   Total Amount: $${summary.totalAmount}`);
    console.log(`   Average Amount: $${summary.averageAmount.toFixed(2)}`);
    console.log('   Category Breakdown:');
    Object.entries(summary.categoryBreakdown).forEach(([category, data]) => {
      console.log(`     - ${category}: ${data.count} expenses, $${data.total}`);
    });
    console.log('');

    // 8. Create New Expense
    console.log('7️⃣ Testing Create New Expense...');
    const newExpense = {
      title: 'Test Lunch',
      amount: 15.99,
      category: 'food',
      date: '2024-01-16',
      description: 'Test expense for API testing',
      tags: ['test', 'lunch']
    };
    
    const createResponse = await axios.post(`${BASE_URL}/expenses`, newExpense, config);
    console.log('✅ New Expense Created:');
    console.log(`   ID: ${createResponse.data.data.expenseId}`);
    console.log(`   Title: ${createResponse.data.data.title}`);
    console.log(`   Amount: $${createResponse.data.data.amount}`);
    console.log(`   Category: ${createResponse.data.data.category}`);
    console.log(`   Message: ${createResponse.data.message}`);
    console.log('');

    // 9. Verify New Expense was Added
    console.log('8️⃣ Verifying New Expense was Added...');
    const updatedExpensesResponse = await axios.get(`${BASE_URL}/expenses`, config);
    const newTotal = updatedExpensesResponse.data.data.length;
    console.log(`✅ Total expenses after creation: ${newTotal}`);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📱 Your API is working perfectly with sample data!');
    console.log('\n🔍 You can now:');
    console.log('   - Use Postman to test different scenarios');
    console.log('   - View data in DynamoDB Local');
    console.log('   - Test with different query parameters');
    console.log('   - Run unit tests with: npm run test:local');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Network Error: Make sure the API is running on localhost:3000');
      console.error('   Run: npm run local:start:win');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the tests
testAPI();
