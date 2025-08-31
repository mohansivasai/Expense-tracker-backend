import { AuthContext } from '../types';

// Production auth service (commented out for now due to type complexity)
// export class AuthService {
//   // Implementation for production Cognito JWT verification
//   // Will be implemented when deploying to AWS
// }

// Simple token verification for development/testing
export class SimpleAuthService {
  async verifyToken(token: string): Promise<AuthContext> {
    // For development, accept any token and return a test user
    if (token === 'test-token') {
      return {
        userId: 'dev-user-123',
        email: 'dev@example.com',
        groups: ['users'],
      };
    }

    // Try to decode base64 JSON token for more realistic testing
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parsed = JSON.parse(decoded);
      
      if (parsed.userId && parsed.email) {
        return {
          userId: parsed.userId,
          email: parsed.email,
          groups: parsed.groups || ['users'],
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }

    throw new Error('Invalid token');
  }

  async authenticateRequest(authHeader: string): Promise<AuthContext> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    return this.verifyToken(token);
  }
}
