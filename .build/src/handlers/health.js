"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event, context) => {
    const timestamp = new Date().toISOString();
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
            status: 'healthy',
            timestamp,
            service: 'expense-tracker-backend',
            environment: process.env.STAGE || 'dev',
            region: process.env.AWS_REGION || 'us-east-1',
            memoryLimit: context.memoryLimitInMB,
            remainingTime: context.getRemainingTimeInMillis(),
        }),
    };
};
exports.handler = handler;
//# sourceMappingURL=health.js.map