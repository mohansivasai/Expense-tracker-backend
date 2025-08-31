import { ExpenseService } from '../services/expenseService';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../types';

// Mock the DynamoDB service
jest.mock('../utils/dynamodb');

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    expenseService = new ExpenseService();
  });

  describe('createExpense', () => {
    it('should create an expense with valid data', async () => {
      const expenseData: CreateExpenseRequest = {
        title: 'Test Expense',
        amount: 50.00,
        category: 'food',
        date: '2024-01-15',
        description: 'Test description',
      };

      const result = await expenseService.createExpense(mockUserId, expenseData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.title).toBe(expenseData.title);
      expect(result.amount).toBe(expenseData.amount);
      expect(result.category).toBe(expenseData.category);
      expect(result.date).toBe(expenseData.date);
      expect(result.expenseId).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for invalid amount', async () => {
      const expenseData: CreateExpenseRequest = {
        title: 'Test Expense',
        amount: -10,
        category: 'food',
        date: '2024-01-15',
      };

      await expect(expenseService.createExpense(mockUserId, expenseData))
        .rejects
        .toThrow('Amount must be greater than 0');
    });

    it('should throw error for invalid date format', async () => {
      const expenseData: CreateExpenseRequest = {
        title: 'Test Expense',
        amount: 50.00,
        category: 'food',
        date: 'invalid-date',
      };

      await expect(expenseService.createExpense(mockUserId, expenseData))
        .rejects
        .toThrow('Invalid date format. Use YYYY-MM-DD');
    });

    it('should throw error for empty category', async () => {
      const expenseData: CreateExpenseRequest = {
        title: 'Test Expense',
        amount: 50.00,
        category: '',
        date: '2024-01-15',
      };

      await expect(expenseService.createExpense(mockUserId, expenseData))
        .rejects
        .toThrow('Category is required');
    });
  });

  describe('updateExpense', () => {
    it('should update an expense with valid data', async () => {
      const updateData: UpdateExpenseRequest = {
        title: 'Updated Expense',
        amount: 75.00,
      };

      const result = await expenseService.updateExpense(mockUserId, 'expense-id', updateData);

      expect(result).toBeDefined();
      expect(result?.title).toBe(updateData.title);
      expect(result?.amount).toBe(updateData.amount);
    });

    it('should throw error for invalid amount update', async () => {
      const updateData: UpdateExpenseRequest = {
        amount: -5,
      };

      await expect(expenseService.updateExpense(mockUserId, 'expense-id', updateData))
        .rejects
        .toThrow('Amount must be greater than 0');
    });
  });

  describe('getExpenseSummary', () => {
    it('should return expense summary', async () => {
      const summary = await expenseService.getExpenseSummary(mockUserId);

      expect(summary).toBeDefined();
      expect(summary.totalExpenses).toBeGreaterThanOrEqual(0);
      expect(summary.totalAmount).toBeGreaterThanOrEqual(0);
      expect(summary.averageAmount).toBeGreaterThanOrEqual(0);
      expect(summary.categoryBreakdown).toBeDefined();
      expect(summary.monthlyBreakdown).toBeDefined();
    });
  });
});
