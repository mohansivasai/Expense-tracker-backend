import { v4 as uuidv4 } from 'uuid';
import { DynamoDBService } from '../utils/dynamodb';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseQueryParams, PaginationResult } from '../types';

export class ExpenseService {
  private dynamoDBService: DynamoDBService;

  constructor() {
    this.dynamoDBService = new DynamoDBService();
  }

  async createExpense(userId: string, expenseData: CreateExpenseRequest): Promise<Expense> {
    const now = new Date().toISOString();
    const expenseId = uuidv4();

    const expense: Expense = {
      expenseId,
      userId,
      ...expenseData,
      createdAt: now,
      updatedAt: now,
    };

    // Validate amount
    if (expense.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate date format (YYYY-MM-DD)
    if (!this.isValidDate(expense.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate category
    if (!expense.category || expense.category.trim() === '') {
      throw new Error('Category is required');
    }

    return await this.dynamoDBService.createExpense(expense);
  }

  async getExpense(userId: string, expenseId: string): Promise<Expense> {
    const expense = await this.dynamoDBService.getExpense(userId, expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }
    return expense;
  }

  async updateExpense(userId: string, expenseId: string, updates: UpdateExpenseRequest): Promise<Expense> {
    // Verify expense exists and belongs to user
    const existingExpense = await this.dynamoDBService.getExpense(userId, expenseId);
    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    // Validate updates
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (updates.date && !this.isValidDate(updates.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (updates.category !== undefined && (!updates.category || updates.category.trim() === '')) {
      throw new Error('Category cannot be empty');
    }

    const updatedExpense = await this.dynamoDBService.updateExpense(userId, expenseId, updates);
    if (!updatedExpense) {
      throw new Error('Failed to update expense');
    }

    return updatedExpense;
  }

  async deleteExpense(userId: string, expenseId: string): Promise<boolean> {
    // Verify expense exists and belongs to user
    const existingExpense = await this.dynamoDBService.getExpense(userId, expenseId);
    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    return await this.dynamoDBService.deleteExpense(userId, expenseId);
  }

  async getExpensesByUser(params: ExpenseQueryParams): Promise<PaginationResult<Expense>> {
    const {
      userId,
      startDate,
      endDate,
      category,
      minAmount,
      maxAmount,
      limit = 50,
      nextToken,
    } = params;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Validate amount range
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      throw new Error('Minimum amount cannot be greater than maximum amount');
    }

    return await this.dynamoDBService.queryExpensesByUser(
      userId,
      startDate,
      endDate,
      category,
      minAmount,
      maxAmount,
      limit,
      nextToken
    );
  }

  async getAllExpensesByUser(userId: string): Promise<Expense[]> {
    return await this.dynamoDBService.getAllExpensesByUser(userId);
  }

  async getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
    if (!category || category.trim() === '') {
      throw new Error('Category is required');
    }

    return await this.dynamoDBService.getExpensesByCategory(userId, category);
  }

  async getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    return await this.dynamoDBService.getExpensesByDateRange(userId, startDate, endDate);
  }

  async getExpenseSummary(userId: string, startDate?: string, endDate?: string): Promise<{
    totalExpenses: number;
    totalAmount: number;
    averageAmount: number;
    categoryBreakdown: Record<string, { count: number; total: number }>;
    monthlyBreakdown: Record<string, { count: number; total: number }>;
  }> {
    const expenses = startDate && endDate
      ? await this.getExpensesByDateRange(userId, startDate, endDate)
      : await this.getAllExpensesByUser(userId);

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; total: number }> = {};
    expenses.forEach(expense => {
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = { count: 0, total: 0 };
      }
      categoryBreakdown[expense.category].count++;
      categoryBreakdown[expense.category].total += expense.amount;
    });

    // Monthly breakdown
    const monthlyBreakdown: Record<string, { count: number; total: number }> = {};
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { count: 0, total: 0 };
      }
      monthlyBreakdown[month].count++;
      monthlyBreakdown[month].total += expense.amount;
    });

    return {
      totalExpenses,
      totalAmount,
      averageAmount,
      categoryBreakdown,
      monthlyBreakdown,
    };
  }

  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
