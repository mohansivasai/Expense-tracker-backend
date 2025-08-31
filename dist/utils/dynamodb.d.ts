import { Expense, PaginationResult } from '../types';
export declare class DynamoDBService {
    private client;
    private tableName;
    private isOffline;
    constructor();
    createExpense(expense: Expense): Promise<Expense>;
    getExpense(userId: string, expenseId: string): Promise<Expense | null>;
    updateExpense(userId: string, expenseId: string, updates: Partial<Expense>): Promise<Expense | null>;
    deleteExpense(userId: string, expenseId: string): Promise<boolean>;
    queryExpensesByUser(userId: string, startDate?: string, endDate?: string, category?: string, minAmount?: number, maxAmount?: number, limit?: number, nextToken?: string): Promise<PaginationResult<Expense>>;
    getAllExpensesByUser(userId: string): Promise<Expense[]>;
    getExpensesByCategory(userId: string, category: string): Promise<Expense[]>;
    getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]>;
}
//# sourceMappingURL=dynamodb.d.ts.map