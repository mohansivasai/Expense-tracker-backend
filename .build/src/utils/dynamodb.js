"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
class DynamoDBService {
    constructor() {
        this.isOffline = process.env['IS_OFFLINE'] === 'true';
        const dynamoClient = new client_dynamodb_1.DynamoDBClient({
            region: process.env['AWS_REGION'] || 'us-east-1',
            ...(this.isOffline && { endpoint: "http://localhost:8000" })
        });
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = process.env['DYNAMODB_TABLE'] || 'expense-tracker-backend-dev';
    }
    async createExpense(expense) {
        const params = {
            TableName: this.tableName,
            Item: expense,
        };
        await this.client.send(new lib_dynamodb_1.PutCommand(params));
        return expense;
    }
    async getExpense(userId, expenseId) {
        const params = {
            TableName: this.tableName,
            Key: {
                userId,
                expenseId,
            },
        };
        const result = await this.client.send(new lib_dynamodb_1.GetCommand(params));
        return result.Item ? result.Item : null;
    }
    async updateExpense(userId, expenseId, updates) {
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        Object.keys(updates).forEach((key) => {
            if (key !== 'userId' && key !== 'expenseId' && key !== 'createdAt') {
                updateExpression.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = updates[key];
            }
        });
        if (updateExpression.length === 0) {
            return this.getExpense(userId, expenseId);
        }
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        const params = {
            TableName: this.tableName,
            Key: {
                userId,
                expenseId,
            },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };
        const result = await this.client.send(new lib_dynamodb_1.UpdateCommand(params));
        return result.Attributes ? result.Attributes : null;
    }
    async deleteExpense(userId, expenseId) {
        const params = {
            TableName: this.tableName,
            Key: {
                userId,
                expenseId,
            },
        };
        await this.client.send(new lib_dynamodb_1.DeleteCommand(params));
        return true;
    }
    async queryExpensesByUser(userId, startDate, endDate, category, minAmount, maxAmount, limit = 50, nextToken) {
        let filterExpression = '#userId = :userId';
        const expressionAttributeNames = {
            '#userId': 'userId',
        };
        const expressionAttributeValues = {
            ':userId': userId,
        };
        if (startDate || endDate) {
            filterExpression += ' AND #date BETWEEN :startDate AND :endDate';
            expressionAttributeNames['#date'] = 'date';
            expressionAttributeValues[':startDate'] = startDate || '1900-01-01';
            expressionAttributeValues[':endDate'] = endDate || '9999-12-31';
        }
        if (category) {
            filterExpression += ' AND #category = :category';
            expressionAttributeNames['#category'] = 'category';
            expressionAttributeValues[':category'] = category;
        }
        if (minAmount !== undefined || maxAmount !== undefined) {
            if (minAmount !== undefined) {
                filterExpression += ' AND #amount >= :minAmount';
                expressionAttributeNames['#amount'] = 'amount';
                expressionAttributeValues[':minAmount'] = minAmount;
            }
            if (maxAmount !== undefined) {
                filterExpression += ' AND #amount <= :maxAmount';
                expressionAttributeNames['#amount'] = 'amount';
                expressionAttributeValues[':maxAmount'] = maxAmount;
            }
        }
        const params = {
            TableName: this.tableName,
            IndexName: 'UserDateIndex',
            KeyConditionExpression: '#userId = :userId',
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            Limit: limit,
            ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
        };
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        return {
            items: (result.Items || []),
            nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
            hasMore: !!result.LastEvaluatedKey,
        };
    }
    async getAllExpensesByUser(userId) {
        const params = {
            TableName: this.tableName,
            IndexName: 'UserDateIndex',
            KeyConditionExpression: '#userId = :userId',
            ExpressionAttributeNames: {
                '#userId': 'userId',
            },
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        };
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        return (result.Items || []);
    }
    async getExpensesByCategory(userId, category) {
        const params = {
            TableName: this.tableName,
            IndexName: 'UserDateIndex',
            KeyConditionExpression: '#userId = :userId',
            FilterExpression: '#category = :category',
            ExpressionAttributeNames: {
                '#userId': 'userId',
                '#category': 'category',
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':category': category,
            },
        };
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        return (result.Items || []);
    }
    async getExpensesByDateRange(userId, startDate, endDate) {
        const params = {
            TableName: this.tableName,
            IndexName: 'UserDateIndex',
            KeyConditionExpression: '#userId = :userId AND #date BETWEEN :startDate AND :endDate',
            ExpressionAttributeNames: {
                '#userId': 'userId',
                '#date': 'date',
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':startDate': startDate,
                ':endDate': endDate,
            },
        };
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        return (result.Items || []);
    }
}
exports.DynamoDBService = DynamoDBService;
//# sourceMappingURL=dynamodb.js.map