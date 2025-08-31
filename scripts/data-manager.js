const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DYNAMODB_PORT = 8000;
const TABLE_NAME = 'expense-tracker-backend-dev';
const DATA_DIR = path.join(__dirname, '..', 'data');

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

class DataManager {
  constructor() {
    this.ensureDataDirectory();
  }

  // Ensure data directory exists
  async ensureDataDirectory() {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  // Export all data from DynamoDB to JSON files
  async exportData() {
    console.log('📤 Exporting data from DynamoDB Local...');
    
    try {
      // Scan all expenses
      const scanParams = {
        TableName: TABLE_NAME
      };

      const result = await docClient.send(new ScanCommand(scanParams));
      const expenses = result.Items || [];

      if (expenses.length === 0) {
        console.log('⚠️  No data found in DynamoDB');
        return;
      }

      // Group expenses by user
      const userData = {};
      expenses.forEach(expense => {
        const userId = expense.userId;
        if (!userData[userId]) {
          userData[userId] = [];
        }
        userData[userId].push(expense);
      });

      // Export each user's data to separate files
      for (const [userId, userExpenses] of Object.entries(userData)) {
        const filename = `${userId}-expenses.json`;
        const filepath = path.join(DATA_DIR, filename);
        
        await fs.writeFile(filepath, JSON.stringify(userExpenses, null, 2));
        console.log(`✅ Exported ${userExpenses.length} expenses for ${userId} to ${filename}`);
      }

      // Export summary data
      const summaryData = {
        totalExpenses: expenses.length,
        users: Object.keys(userData),
        categories: [...new Set(expenses.map(e => e.category))],
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        exportDate: new Date().toISOString()
      };

      const summaryFilepath = path.join(DATA_DIR, 'data-summary.json');
      await fs.writeFile(summaryFilepath, JSON.stringify(summaryData, null, 2));
      console.log(`✅ Exported summary data to data-summary.json`);

      console.log(`\n🎉 Data export completed!`);
      console.log(`📁 Data saved to: ${DATA_DIR}`);
      console.log(`📊 Total expenses exported: ${expenses.length}`);
      console.log(`👥 Users: ${Object.keys(userData).join(', ')}`);

    } catch (error) {
      console.error('❌ Error exporting data:', error.message);
      throw error;
    }
  }

  // Import data from JSON files to DynamoDB
  async importData() {
    console.log('📥 Importing data to DynamoDB Local...');
    
    try {
      const files = await fs.readdir(DATA_DIR);
      const expenseFiles = files.filter(f => f.endsWith('-expenses.json'));
      
      if (expenseFiles.length === 0) {
        console.log('⚠️  No expense data files found');
        return;
      }

      let totalImported = 0;
      
      for (const filename of expenseFiles) {
        const filepath = path.join(DATA_DIR, filename);
        const fileContent = await fs.readFile(filepath, 'utf8');
        const expenses = JSON.parse(fileContent);

        console.log(`📁 Importing ${expenses.length} expenses from ${filename}...`);

        for (const expense of expenses) {
          try {
            const putParams = {
              TableName: TABLE_NAME,
              Item: expense
            };

            await docClient.send(new PutCommand(putParams));
            totalImported++;
          } catch (error) {
            console.error(`⚠️  Failed to import expense ${expense.expenseId}:`, error.message);
          }
        }
      }

      console.log(`\n🎉 Data import completed!`);
      console.log(`📊 Total expenses imported: ${totalImported}`);

    } catch (error) {
      console.error('❌ Error importing data:', error.message);
      throw error;
    }
  }

  // Clear all data from DynamoDB
  async clearData() {
    console.log('🗑️  Clearing all data from DynamoDB Local...');
    
    try {
      // Scan all expenses
      const scanParams = {
        TableName: TABLE_NAME
      };

      const result = await docClient.send(new ScanCommand(scanParams));
      const expenses = result.Items || [];

      if (expenses.length === 0) {
        console.log('✅ No data to clear');
        return;
      }

      console.log(`🗑️  Deleting ${expenses.length} expenses...`);

      // Delete each expense
      for (const expense of expenses) {
        const deleteParams = {
          TableName: TABLE_NAME,
          Key: {
            userId: expense.userId,
            expenseId: expense.expenseId
          }
        };

        await docClient.send(new DeleteCommand(deleteParams));
      }

      console.log(`✅ Cleared ${expenses.length} expenses from DynamoDB`);

    } catch (error) {
      console.error('❌ Error clearing data:', error.message);
      throw error;
    }
  }

  // List all data files
  async listDataFiles() {
    try {
      const files = await fs.readdir(DATA_DIR);
      const dataFiles = files.filter(f => f.endsWith('.json'));
      
      if (dataFiles.length === 0) {
        console.log('📁 No data files found');
        return;
      }

      console.log('📁 Available data files:');
      for (const file of dataFiles) {
        const filepath = path.join(DATA_DIR, file);
        const stats = await fs.stat(filepath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file} (${sizeKB} KB)`);
      }

    } catch (error) {
      console.error('❌ Error listing data files:', error.message);
    }
  }

  // Show data summary
  async showDataSummary() {
    try {
      const summaryFilepath = path.join(DATA_DIR, 'data-summary.json');
      await fs.access(summaryFilepath);
      
      const content = await fs.readFile(summaryFilepath, 'utf8');
      const summary = JSON.parse(content);
      
      console.log('📊 Data Summary:');
      console.log(`   Total Expenses: ${summary.totalExpenses}`);
      console.log(`   Users: ${summary.users.join(', ')}`);
      console.log(`   Categories: ${summary.categories.join(', ')}`);
      console.log(`   Total Amount: $${summary.totalAmount.toFixed(2)}`);
      console.log(`   Export Date: ${summary.exportDate}`);

    } catch (error) {
      console.log('📊 No data summary available');
    }
  }

  // Backup current data
  async backupData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DATA_DIR, 'backups', timestamp);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy all JSON files to backup directory
      const files = await fs.readdir(DATA_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const sourcePath = path.join(DATA_DIR, file);
        const destPath = path.join(backupDir, file);
        await fs.copyFile(sourcePath, destPath);
      }
      
      console.log(`✅ Data backed up to: ${backupDir}`);
      console.log(`📁 Backed up ${jsonFiles.length} files`);

    } catch (error) {
      console.error('❌ Error backing up data:', error.message);
    }
  }

  // Restore data from backup
  async restoreData(backupTimestamp) {
    const backupDir = path.join(DATA_DIR, 'backups', backupTimestamp);
    
    try {
      await fs.access(backupDir);
      
      // Clear current data
      await this.clearData();
      
      // Copy backup files to data directory
      const files = await fs.readdir(backupDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const sourcePath = path.join(backupDir, file);
        const destPath = path.join(DATA_DIR, file);
        await fs.copyFile(sourcePath, destPath);
      }
      
      // Import the restored data
      await this.importData();
      
      console.log(`✅ Data restored from backup: ${backupTimestamp}`);

    } catch (error) {
      console.error('❌ Error restoring data:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const dataManager = new DataManager();
  
  try {
    switch (command) {
      case 'export':
        await dataManager.exportData();
        break;
        
      case 'import':
        await dataManager.importData();
        break;
        
      case 'clear':
        await dataManager.clearData();
        break;
        
      case 'list':
        await dataManager.listDataFiles();
        break;
        
      case 'summary':
        await dataManager.showDataSummary();
        break;
        
      case 'backup':
        await dataManager.backupData();
        break;
        
      case 'restore':
        const timestamp = args[1];
        if (!timestamp) {
          console.log('❌ Please provide backup timestamp: npm run data:restore <timestamp>');
          return;
        }
        await dataManager.restoreData(timestamp);
        break;
        
      default:
        console.log('📚 Data Manager - Available commands:');
        console.log('   npm run data:export    - Export data from DynamoDB to JSON files');
        console.log('   npm run data:import    - Import data from JSON files to DynamoDB');
        console.log('   npm run data:clear     - Clear all data from DynamoDB');
        console.log('   npm run data:list      - List available data files');
        console.log('   npm run data:summary   - Show data summary');
        console.log('   npm run data:backup    - Create backup of current data');
        console.log('   npm run data:restore   - Restore data from backup');
        console.log('\n💡 Example: npm run data:export');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DataManager;
