"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
class ExpenseService {
    constructor() {
        this.dynamoDBService = new dynamodb_1.DynamoDBService();
    }
    async createExpense(userId, expenseData) {
        const now = new Date().toISOString();
        const expenseId = (0, uuid_1.v4)();
        const expense = {
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
    async getExpense(userId, expenseId) {
        const expense = await this.dynamoDBService.getExpense(userId, expenseId);
        if (!expense) {
            throw new Error('Expense not found');
        }
        return expense;
    }
    async updateExpense(userId, expenseId, updates) {
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
    async deleteExpense(userId, expenseId) {
        // Verify expense exists and belongs to user
        const existingExpense = await this.dynamoDBService.getExpense(userId, expenseId);
        if (!existingExpense) {
            throw new Error('Expense not found');
        }
        return await this.dynamoDBService.deleteExpense(userId, expenseId);
    }
    async getExpensesByUser(queryParams) {
        const result = await this.dynamoDBService.queryExpensesByUser(queryParams.userId, queryParams.startDate, queryParams.endDate, queryParams.category, queryParams.minAmount, queryParams.maxAmount, queryParams.limit || 50, queryParams.nextToken);
        return {
            items: result.items,
            nextToken: result.nextToken,
            hasMore: result.hasMore,
        };
    }
    async getAllExpensesByUser(userId) {
        return await this.dynamoDBService.getAllExpensesByUser(userId);
    }
    async getExpensesByCategory(userId, category) {
        if (!category || category.trim() === '') {
            throw new Error('Category is required');
        }
        return await this.dynamoDBService.getExpensesByCategory(userId, category);
    }
    async getExpensesByDateRange(userId, startDate, endDate) {
        if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }
        if (startDate > endDate) {
            throw new Error('Start date cannot be after end date');
        }
        return await this.dynamoDBService.getExpensesByDateRange(userId, startDate, endDate);
    }
    async getExpenseSummary(userId, startDate, endDate) {
        const expenses = startDate && endDate
            ? await this.getExpensesByDateRange(userId, startDate, endDate)
            : await this.getAllExpensesByUser(userId);
        const totalExpenses = expenses.length;
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
        // Category breakdown
        const categoryBreakdown = {};
        expenses.forEach(expense => {
            if (!categoryBreakdown[expense.category]) {
                categoryBreakdown[expense.category] = { count: 0, total: 0 };
            }
            categoryBreakdown[expense.category].count++;
            categoryBreakdown[expense.category].total += expense.amount;
        });
        // Monthly breakdown
        const monthlyBreakdown = {};
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
    isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
}
exports.ExpenseService = ExpenseService;
//# sourceMappingURL=expenseService.js.map