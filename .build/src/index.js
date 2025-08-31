"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const expenseService_1 = require("./services/expenseService");
const auth_1 = require("./utils/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json());
// Services
const expenseService = new expenseService_1.ExpenseService();
const authService = new auth_1.SimpleAuthService();
// Middleware to extract user ID from auth header
const extractUserId = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        const authContext = await authService.authenticateRequest(authHeader);
        req.userId = authContext.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'expense-tracker-backend',
        environment: process.env.NODE_ENV || 'development',
    });
});
// Auth verification endpoint
app.post('/auth/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' });
        }
        const authContext = await authService.authenticateRequest(authHeader);
        res.json({
            success: true,
            data: {
                userId: authContext.userId,
                email: authContext.email,
                groups: authContext.groups,
            },
            message: 'Token is valid',
        });
    }
    catch (error) {
        res.status(401).json({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid token',
        });
    }
});
// Expense endpoints
app.get('/expenses', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate, category, minAmount, maxAmount, limit, nextToken } = req.query;
        const result = await expenseService.getExpensesByUser({
            userId,
            startDate: startDate,
            endDate: endDate,
            category: category,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            limit: limit ? parseInt(limit) : 50,
            nextToken: nextToken,
        });
        res.json({
            success: true,
            data: result.items,
            nextToken: result.nextToken,
            hasMore: result.hasMore,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
app.post('/expenses', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const expenseData = req.body;
        const newExpense = await expenseService.createExpense(userId, expenseData);
        res.status(201).json({
            success: true,
            data: newExpense,
            message: 'Expense created successfully',
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('validation')) {
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message,
            });
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
app.get('/expenses/:id', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const expense = await expenseService.getExpense(userId, id);
        res.json({
            success: true,
            data: expense,
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message,
            });
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
app.put('/expenses/:id', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const updateData = req.body;
        const updatedExpense = await expenseService.updateExpense(userId, id, updateData);
        res.json({
            success: true,
            data: updatedExpense,
            message: 'Expense updated successfully',
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message,
            });
        }
        if (error instanceof Error && error.message.includes('validation')) {
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message,
            });
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
app.delete('/expenses/:id', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        await expenseService.deleteExpense(userId, id);
        res.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                error: 'Not Found',
                message: error.message,
            });
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
// Summary endpoints
app.get('/summary', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { startDate, endDate } = req.query;
        const summary = await expenseService.getExpenseSummary(userId, startDate, endDate);
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
// Category endpoints
app.get('/categories', extractUserId, async (req, res) => {
    try {
        const categories = [
            { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
            { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
            { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
            { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
            { id: 'health', name: 'Health & Fitness', icon: '💊', color: '#FFEAA7' },
            { id: 'bills', name: 'Bills & Utilities', icon: '📱', color: '#DDA0DD' },
            { id: 'education', name: 'Education', icon: '📚', color: '#98D8C8' },
            { id: 'other', name: 'Other', icon: '📦', color: '#F7DC6F' },
        ];
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
app.get('/categories/:category', extractUserId, async (req, res) => {
    try {
        const userId = req.userId;
        const { category } = req.params;
        const expenses = await expenseService.getExpensesByCategory(userId, category);
        res.json({
            success: true,
            data: expenses,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'Endpoint not found',
    });
});
// Error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Expense Tracker Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth verify: http://localhost:${PORT}/auth/verify`);
    console.log(`💰 Expenses: http://localhost:${PORT}/expenses`);
    console.log(`📈 Summary: http://localhost:${PORT}/summary`);
    console.log(`🏷️  Categories: http://localhost:${PORT}/categories`);
});
exports.default = app;
//# sourceMappingURL=index.js.map