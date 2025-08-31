import { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseQueryParams, PaginationResult } from '../types';
export declare class ExpenseService {
    private dynamoDBService;
    constructor();
    createExpense(userId: string, expenseData: CreateExpenseRequest): Promise<Expense>;
    getExpense(userId: string, expenseId: string): Promise<Expense>;
    updateExpense(userId: string, expenseId: string, updates: UpdateExpenseRequest): Promise<Expense>;
    deleteExpense(userId: string, expenseId: string): Promise<boolean>;
    getExpensesByUser(params: ExpenseQueryParams): Promise<PaginationResult<Expense>>;
    getAllExpensesByUser(userId: string): Promise<Expense[]>;
    getExpensesByCategory(userId: string, category: string): Promise<Expense[]>;
    getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]>;
    getExpenseSummary(userId: string, startDate?: string, endDate?: string): Promise<{
        totalExpenses: number;
        totalAmount: number;
        averageAmount: number;
        categoryBreakdown: Record<string, {
            count: number;
            total: number;
        }>;
        monthlyBreakdown: Record<string, {
            count: number;
            total: number;
        }>;
    }>;
    private isValidDate;
}
//# sourceMappingURL=expenseService.d.ts.map