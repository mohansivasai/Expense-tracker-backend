const { spawn, exec } = require('child_process');
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configuration
const DYNAMODB_PORT = 9000; // Use port 9000 to avoid conflicts
const API_PORT = 3000;
const TABLE_NAME = 'expense-tracker-backend-dev';

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

// DynamoDB client for local
const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: `http://localhost:${DYNAMODB_PORT}`,
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

class LocalDevManager {
  constructor() {
    this.dynamoProcess = null;
    this.apiProcess = null;
    this.isShuttingDown = false;
  }

  // Check if ports are available
  async checkPorts() {
    console.log('🔍 Checking port availability...');
    
    const ports = [DYNAMODB_PORT, API_PORT];
    for (const port of ports) {
      try {
        const netstat = spawn('netstat', ['-an'], { shell: true });
        const grep = spawn('findstr', [`:${port}`], { shell: true });
        
        netstat.stdout.pipe(grep.stdin);
        
        const result = await new Promise((resolve) => {
          let output = '';
          grep.stdout.on('data', (data) => {
            output += data.toString();
          });
          grep.on('close', () => {
            resolve(output.trim());
          });
        });
        
        if (result) {
          console.log(`⚠️  Port ${port} is already in use. Please free it up first.`);
          return false;
        }
      } catch (error) {
        // Continue if netstat fails
      }
    }
    
    console.log('✅ Ports are available');
    return true;
  }

  // Start DynamoDB Local
  async startDynamoDB() {
    console.log('🚀 Starting DynamoDB Local...');
    
    return new Promise((resolve, reject) => {
      this.dynamoProcess = spawn('docker', [
        'run', '--rm', '-d',
        '--name', 'dynamodb-local',
        '-p', `${DYNAMODB_PORT}:8000`,
        '-e', 'AWS_ACCESS_KEY_ID=local',
        '-e', 'AWS_SECRET_ACCESS_KEY=local',
        '-e', 'AWS_DEFAULT_REGION=us-east-1',
        'amazon/dynamodb-local:latest',
        '-jar', 'DynamoDBLocal.jar',
        '-sharedDb', '-inMemory'
      ], { stdio: 'pipe' });

      this.dynamoProcess.stdout.on('data', (data) => {
        console.log(`DynamoDB: ${data.toString().trim()}`);
      });

      this.dynamoProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output.includes('Error response from daemon')) {
          // Container already exists, try to remove it
          this.cleanupExistingContainer();
        }
      });

      this.dynamoProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ DynamoDB Local started successfully');
          resolve();
        } else {
          reject(new Error(`DynamoDB failed to start with code ${code}`));
        }
      });

      // Wait longer for DynamoDB to be ready
      setTimeout(() => resolve(), 5000);
    });
  }

  // Clean up existing container
  async cleanupExistingContainer() {
    console.log('🧹 Cleaning up existing DynamoDB container...');
    try {
      exec('docker stop dynamodb-local', () => {
        exec('docker rm dynamodb-local', () => {
          console.log('✅ Existing container cleaned up');
        });
      });
    } catch (error) {
      console.log('⚠️  Could not clean up existing container');
    }
  }

  // Create DynamoDB table
  async createTable() {
    console.log('🏗️  Creating DynamoDB table...');
    
    // Wait a bit more for DynamoDB to be fully ready
    console.log('⏳ Waiting for DynamoDB to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simple health check - try to list tables
    try {
      console.log('🔍 Testing DynamoDB connection...');
      await docClient.send(new DescribeTableCommand({ TableName: 'test-connection' }));
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log('✅ DynamoDB is responding (expected error for non-existent table)');
      } else {
        console.log('⚠️  DynamoDB might not be ready yet, waiting more...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    try {
      // Check if table exists
      try {
        await docClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log('✅ Table already exists');
        return;
      } catch (error) {
        // Table doesn't exist, create it
        console.log('📋 Table does not exist, creating new table...');
      }

      const createTableParams = {
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'expenseId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'expenseId', AttributeType: 'S' },
          { AttributeName: 'date', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserDateIndex',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'date', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      };

      console.log('🔨 Sending CreateTable command...');
      await docClient.send(new CreateTableCommand(createTableParams));
      console.log('✅ DynamoDB table created successfully');
      
      // Wait for table to be active
      console.log('⏳ Waiting for table to be active...');
      await this.waitForTableActive();
      
    } catch (error) {
      console.error('❌ Error creating table:', error.message);
      if (error.message.includes('socket hang up')) {
        console.log('🔄 Socket hang up detected, this usually means DynamoDB is not ready yet');
        console.log('⏳ Waiting a bit more and retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await this.createTable(); // Retry once
      }
      throw error;
    }
  }

  // Wait for table to be active
  async waitForTableActive() {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const result = await docClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        if (result.Table?.TableStatus === 'ACTIVE') {
          console.log('✅ Table is now active');
          return;
        }
      } catch (error) {
        // Table might not be ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Table did not become active in time');
  }

  // Seed sample data
  async seedData() {
    console.log('🌱 Seeding sample data...');
    
    try {
      for (const expense of sampleExpenses) {
        const command = new PutCommand({
          TableName: TABLE_NAME,
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
      
    } catch (error) {
      console.error('❌ Error seeding data:', error.message);
      throw error;
    }
  }

  // Start Express API server
  async startAPIServer() {
    console.log('🚀 Starting Express API server...');
    
    return new Promise((resolve, reject) => {
      console.log('🔧 Building project with npm run build...');
      
      // Build the project first - use simple npm command with shell
      const buildProcess = spawn('npm', ['run', 'build'], { 
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd(),
        env: { ...process.env, PATH: process.env.PATH }
      });
      
      // Capture build output for debugging
      buildProcess.stdout.on('data', (data) => {
        console.log(`Build: ${data.toString().trim()}`);
      });
      
      buildProcess.stderr.on('data', (data) => {
        console.error(`Build Error: ${data.toString().trim()}`);
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build successful, starting server...');
          
          // Start the server
          this.apiProcess = spawn('node', ['dist/index.js'], {
            stdio: 'pipe',
            cwd: process.cwd(),
            env: { ...process.env, NODE_ENV: 'development' }
          });

          this.apiProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            console.log(`API: ${output}`);
            
            if (output.includes('running on port')) {
              console.log('✅ API server started successfully');
              resolve();
            }
          });

          this.apiProcess.stderr.on('data', (data) => {
            console.error(`API Error: ${data.toString().trim()}`);
          });

          this.apiProcess.on('close', (code) => {
            if (!this.isShuttingDown) {
              console.log(`❌ API server stopped with code ${code}`);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (!this.isShuttingDown) {
              console.log('✅ API server appears to be running');
              resolve();
            }
          }, 5000);
          
        } else {
          console.error(`❌ Build failed with exit code ${code}`);
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  }

  // Find npm command
  findNpmCommand() {
    // Try common npm locations
    const possiblePaths = [
      'npm',
      'npx'
    ];
    
    // Add Windows-specific paths
    if (process.platform === 'win32') {
      possiblePaths.push(
        'C:\\Program Files\\nodejs\\npm.cmd',
        'C:\\Program Files\\nodejs\\npm',
        process.env.APPDATA + '\\npm\\npm.cmd',
        process.env.APPDATA + '\\npm\\npm'
      );
    }
    
    for (const path of possiblePaths) {
      try {
        require('child_process').execSync(`"${path}" --version`, { stdio: 'ignore' });
        return path;
      } catch (error) {
        // Continue to next path
      }
    }
    
    // Fallback to npm with shell
    return 'npm';
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      this.isShuttingDown = true;
      
      if (this.apiProcess) {
        this.apiProcess.kill('SIGTERM');
      }
      
      if (this.dynamoProcess) {
        this.dynamoProcess.kill('SIGTERM');
      }
      
      // Clean up Docker container
      try {
        exec('docker stop dynamodb-local', () => {
          exec('docker rm dynamodb-local', () => {
            console.log('✅ DynamoDB container cleaned up');
            process.exit(0);
          });
        });
      } catch (error) {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  // Main startup sequence
  async start() {
    try {
      console.log('🚀 Starting Local Development Environment...\n');
      
      // Check ports
      if (!(await this.checkPorts())) {
        process.exit(1);
      }
      
      // Start DynamoDB
      await this.startDynamoDB();
      
      // Create table
      await this.createTable();
      
      // Seed data
      await this.seedData();
      
      // Start API server
      await this.startAPIServer();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('\n🎉 Local development environment is ready!');
      console.log('\n📱 API Endpoints:');
      console.log(`   Health Check: http://localhost:${API_PORT}/health`);
      console.log(`   Auth Verify: http://localhost:${API_PORT}/auth/verify`);
      console.log(`   Expenses: http://localhost:${API_PORT}/expenses`);
      console.log(`   Summary: http://localhost:${API_PORT}/summary`);
      console.log(`   Categories: http://localhost:${API_PORT}/categories`);
      
      console.log('\n🔐 Authentication:');
      console.log('   Use this token for all authenticated requests:');
      console.log('   Authorization: Bearer test-token');
      
      console.log('\n📊 Sample Data:');
      console.log(`   - ${sampleExpenses.length} sample expenses loaded`);
      console.log(`   - 2 test users (dev-user-123, dev-user-456)`);
      console.log(`   - 7 expense categories`);
      
      console.log('\n🧪 Testing:');
      console.log('   - Use Postman or curl to test endpoints');
      console.log('   - Run: npm run test:api (after server is running)');
      console.log('   - View data: aws dynamodb scan --table-name expense-tracker-backend-dev --endpoint-url http://localhost:8000');
      
      console.log('\n⏹️  Press Ctrl+C to stop all services');
      
    } catch (error) {
      console.error('❌ Failed to start local environment:', error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  // Cleanup
  cleanup() {
    if (this.apiProcess) {
      this.apiProcess.kill('SIGTERM');
    }
    if (this.dynamoProcess) {
      this.dynamoProcess.kill('SIGTERM');
    }
  }
}

// Start the local development environment
const manager = new LocalDevManager();
manager.start().catch(error => {
  console.error('❌ Startup failed:', error.message);
  process.exit(1);
});
