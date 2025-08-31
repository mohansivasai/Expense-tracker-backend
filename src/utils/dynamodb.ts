import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Expense, DynamoDBItem, PaginationResult } from '../types';

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE || 'expense-tracker-backend-dev';
  }

  async createExpense(expense: Expense): Promise<Expense> {
    const params = {
      TableName: this.tableName,
      Item: expense,
    };

    await this.client.send(new PutCommand(params));
    return expense;
  }

  async getExpense(userId: string, expenseId: string): Promise<Expense | null> {
    const params = {
      TableName: this.tableName,
      Key: {
        userId,
        expenseId,
      },
    };

    const result = await this.client.send(new GetCommand(params));
    return result.Item ? (result.Item as Expense) : null;
  }

  async updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<Expense | null> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(updates).forEach((key) => {
      if (key !== 'userId' && key !== 'expenseId' && key !== 'createdAt') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key as keyof Expense];
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

    const result = await this.client.send(new UpdateCommand(params));
    return result.Attributes ? (result.Attributes as Expense) : null;
  }

  async deleteExpense(userId: string, expenseId: string): Promise<boolean> {
    const params = {
      TableName: this.tableName,
      Key: {
        userId,
        expenseId,
      },
    };

    await this.client.send(new DeleteCommand(params));
    return true;
  }

  async queryExpensesByUser(
    userId: string,
    startDate?: string,
    endDate?: string,
    category?: string,
    minAmount?: number,
    maxAmount?: number,
    limit: number = 50,
    nextToken?: string
  ): Promise<PaginationResult<Expense>> {
    let filterExpression = '#userId = :userId';
    const expressionAttributeNames: Record<string, string> = {
      '#userId': 'userId',
    };
    const expressionAttributeValues: Record<string, any> = {
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

    const result = await this.client.send(new QueryCommand(params));
    
    return {
      items: (result.Items || []) as Expense[],
      nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
      hasMore: !!result.LastEvaluatedKey,
    };
  }

  async getAllExpensesByUser(userId: string): Promise<Expense[]> {
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

    const result = await this.client.send(new QueryCommand(params));
    return (result.Items || []) as Expense[];
  }

  async getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
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

    const result = await this.client.send(new QueryCommand(params));
    return (result.Items || []) as Expense[];
  }

  async getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
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

    const result = await this.client.send(new QueryCommand(params));
    return (result.Items || []) as Expense[];
  }
}
