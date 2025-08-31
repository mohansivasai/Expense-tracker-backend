"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const expenseService_1 = require("../services/expenseService");
const auth_1 = require("../utils/auth");
const expenseService = new expenseService_1.ExpenseService();
const authService = new auth_1.SimpleAuthService();
const handler = async (event) => {
    try {
        const { httpMethod, path, queryStringParameters, body } = event;
        // Extract user ID from the authorizer context (set by API Gateway)
        const userId = event.requestContext.authorizer?.['context']?.['userId'] ||
            event.requestContext.authorizer?.['claims']?.['sub'] ||
            'test-user-id'; // Fallback for development
        // Route based on path and method
        const pathSegments = path.split('/').filter(Boolean);
        // Health check endpoint (no auth required)
        if (path === '/health' && httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'expense-tracker-backend',
                }),
            };
        }
        // Auth verification endpoint (no auth required)
        if (path === '/auth/verify' && httpMethod === 'POST') {
            return await handleAuthVerify(event);
        }
        // All other endpoints require authentication
        if (!userId) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Valid authentication token required',
                }),
            };
        }
        // Expense endpoints
        if (pathSegments[0] === 'expenses') {
            return await handleExpenseEndpoints(httpMethod, pathSegments, userId, body, queryStringParameters);
        }
        // Summary endpoints
        if (pathSegments[0] === 'summary') {
            return await handleSummaryEndpoints(httpMethod, userId, queryStringParameters);
        }
        // Categories endpoints
        if (pathSegments[0] === 'categories') {
            return await handleCategoryEndpoints(httpMethod, pathSegments, userId);
        }
        return {
            statusCode: 404,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Not Found',
                message: 'Endpoint not found',
            }),
        };
    }
    catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
            }),
        };
    }
};
exports.handler = handler;
async function handleExpenseEndpoints(method, pathSegments, userId, body, queryParams) {
    try {
        switch (method) {
            case 'GET':
                if (pathSegments.length === 1) {
                    // GET /expenses - list expenses with filters
                    const expenseQueryParams = {
                        userId,
                        startDate: queryParams?.startDate,
                        endDate: queryParams?.endDate,
                        category: queryParams?.category,
                        minAmount: queryParams?.minAmount ? parseFloat(queryParams.minAmount) : undefined,
                        maxAmount: queryParams?.maxAmount ? parseFloat(queryParams.maxAmount) : undefined,
                        limit: queryParams?.limit ? parseInt(queryParams.limit) : 50,
                        nextToken: queryParams?.nextToken,
                    };
                    const result = await expenseService.getExpensesByUser(expenseQueryParams);
                    return {
                        statusCode: 200,
                        headers: getCorsHeaders(),
                        body: JSON.stringify({
                            success: true,
                            data: result.items,
                            nextToken: result.nextToken,
                            hasMore: result.hasMore,
                        }),
                    };
                }
                else if (pathSegments.length === 2) {
                    // GET /expenses/{id} - get specific expense
                    const expenseId = pathSegments[1];
                    if (!expenseId) {
                        return {
                            statusCode: 400,
                            headers: getCorsHeaders(),
                            body: JSON.stringify({
                                error: 'Bad Request',
                                message: 'Expense ID is required',
                            }),
                        };
                    }
                    const expense = await expenseService.getExpense(userId, expenseId);
                    return {
                        statusCode: 200,
                        headers: getCorsHeaders(),
                        body: JSON.stringify({
                            success: true,
                            data: expense,
                        }),
                    };
                }
                break;
            case 'POST':
                if (pathSegments.length === 1) {
                    // POST /expenses - create new expense
                    if (!body) {
                        return {
                            statusCode: 400,
                            headers: getCorsHeaders(),
                            body: JSON.stringify({
                                error: 'Bad Request',
                                message: 'Request body is required',
                            }),
                        };
                    }
                    const expenseData = JSON.parse(body);
                    const newExpense = await expenseService.createExpense(userId, expenseData);
                    return {
                        statusCode: 201,
                        headers: getCorsHeaders(),
                        body: JSON.stringify({
                            success: true,
                            data: newExpense,
                            message: 'Expense created successfully',
                        }),
                    };
                }
                break;
            case 'PUT':
                if (pathSegments.length === 2) {
                    // PUT /expenses/{id} - update expense
                    if (!body) {
                        return {
                            statusCode: 400,
                            headers: getCorsHeaders(),
                            body: JSON.stringify({
                                error: 'Bad Request',
                                message: 'Request body is required',
                            }),
                        };
                    }
                    const expenseId = pathSegments[1];
                    if (!expenseId) {
                        return {
                            statusCode: 400,
                            headers: getCorsHeaders(),
                            body: JSON.stringify({
                                error: 'Bad Request',
                                message: 'Expense ID is required',
                            }),
                        };
                    }
                    const updateData = JSON.parse(body);
                    const updatedExpense = await expenseService.updateExpense(userId, expenseId, updateData);
                    return {
                        statusCode: 200,
                        headers: getCorsHeaders(),
                        body: JSON.stringify({
                            success: true,
                            data: updatedExpense,
                            message: 'Expense updated successfully',
                        }),
                    };
                }
                break;
            case 'DELETE':
                if (pathSegments.length === 2) {
                    // DELETE /expenses/{id} - delete expense
                    const expenseId = pathSegments[1];
                    if (!expenseId) {
                        return {
                            statusCode: 400,
                            headers: getCorsHeaders(),
                            body: JSON.stringify({
                                error: 'Bad Request',
                                message: 'Expense ID is required',
                            }),
                        };
                    }
                    await expenseService.deleteExpense(userId, expenseId);
                    return {
                        statusCode: 200,
                        headers: getCorsHeaders(),
                        body: JSON.stringify({
                            success: true,
                            message: 'Expense deleted successfully',
                        }),
                    };
                }
                break;
        }
        return {
            statusCode: 405,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Method Not Allowed',
                message: 'HTTP method not supported for this endpoint',
            }),
        };
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return {
                statusCode: 404,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    error: 'Not Found',
                    message: error.message,
                }),
            };
        }
        if (error instanceof Error && error.message.includes('validation')) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    error: 'Bad Request',
                    message: error.message,
                }),
            };
        }
        throw error;
    }
}
async function handleSummaryEndpoints(method, userId, queryParams) {
    if (method !== 'GET') {
        return {
            statusCode: 405,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Method Not Allowed',
                message: 'Only GET method is supported for summary endpoints',
            }),
        };
    }
    try {
        const startDate = queryParams?.startDate;
        const endDate = queryParams?.endDate;
        const summary = await expenseService.getExpenseSummary(userId, startDate, endDate);
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: summary,
            }),
        };
    }
    catch (error) {
        throw error;
    }
}
async function handleCategoryEndpoints(method, pathSegments, userId) {
    if (method !== 'GET') {
        return {
            statusCode: 405,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Method Not Allowed',
                message: 'Only GET method is supported for category endpoints',
            }),
        };
    }
    try {
        if (pathSegments.length === 1) {
            // GET /categories - get all categories
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
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: true,
                    data: categories,
                }),
            };
        }
        else if (pathSegments.length === 2) {
            // GET /categories/{category} - get expenses by category
            const category = pathSegments[1];
            if (!category) {
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({
                        error: 'Bad Request',
                        message: 'Category is required',
                    }),
                };
            }
            const expenses = await expenseService.getExpensesByCategory(userId, category);
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: true,
                    data: expenses,
                }),
            };
        }
        return {
            statusCode: 404,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Not Found',
                message: 'Category endpoint not found',
            }),
        };
    }
    catch (error) {
        throw error;
    }
}
async function handleAuthVerify(event) {
    try {
        const authHeader = event.headers['Authorization'] || event.headers['authorization'];
        if (!authHeader) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Authorization header is required',
                }),
            };
        }
        const authContext = await authService.authenticateRequest(authHeader);
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: {
                    userId: authContext.userId,
                    email: authContext.email,
                    groups: authContext.groups,
                },
                message: 'Token is valid',
            }),
        };
    }
    catch (error) {
        return {
            statusCode: 401,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Unauthorized',
                message: error instanceof Error ? error.message : 'Invalid token',
            }),
        };
    }
}
function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };
}
//# sourceMappingURL=api.js.map