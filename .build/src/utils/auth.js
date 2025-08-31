"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAuthService = exports.AuthService = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
class AuthService {
    constructor() {
        const userPoolId = process.env.COGNITO_USER_POOL_ID;
        const clientId = process.env.COGNITO_CLIENT_ID;
        if (!userPoolId || !clientId) {
            throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables are required');
        }
        this.verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
            userPoolId,
            tokenUse: 'access',
            clientId,
        });
    }
    async verifyToken(token) {
        try {
            const payload = await this.verifier.verify(token);
            return {
                userId: payload.sub,
                email: payload.email || payload['cognito:username'],
                groups: payload['cognito:groups'] || [],
            };
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    async authenticateRequest(authHeader) {
        const token = this.extractTokenFromHeader(authHeader);
        if (!token) {
            throw new Error('Authorization header missing or invalid');
        }
        return this.verifyToken(token);
    }
    // Helper method for Lambda authorizer
    async authorize(event) {
        try {
            const token = event.authorizationToken;
            const authContext = await this.verifyToken(token);
            return {
                principalId: authContext.userId,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'execute-api:Invoke',
                            Effect: 'Allow',
                            Resource: event.methodArn,
                        },
                    ],
                },
                context: {
                    userId: authContext.userId,
                    email: authContext.email,
                    groups: JSON.stringify(authContext.groups),
                },
            };
        }
        catch (error) {
            throw new Error('Unauthorized');
        }
    }
}
exports.AuthService = AuthService;
// Simple token verification for development/testing
class SimpleAuthService {
    async verifyToken(token) {
        // This is a simplified version for development
        // In production, always use proper JWT verification
        if (!token || token === 'test-token') {
            return {
                userId: 'test-user-id',
                email: 'test@example.com',
                groups: ['users'],
            };
        }
        // For development, you can decode a simple token format
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            return {
                userId: decoded.userId || 'default-user-id',
                email: decoded.email || 'default@example.com',
                groups: decoded.groups || ['users'],
            };
        }
        catch {
            throw new Error('Invalid token format');
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    async authenticateRequest(authHeader) {
        const token = this.extractTokenFromHeader(authHeader);
        if (!token) {
            throw new Error('Authorization header missing or invalid');
        }
        return this.verifyToken(token);
    }
}
exports.SimpleAuthService = SimpleAuthService;
//# sourceMappingURL=auth.js.map