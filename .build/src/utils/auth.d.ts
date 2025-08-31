import { AuthContext } from '../types';
export declare class AuthService {
    private verifier;
    constructor();
    verifyToken(token: string): Promise<AuthContext>;
    extractTokenFromHeader(authHeader: string): string | null;
    authenticateRequest(authHeader: string): Promise<AuthContext>;
    authorize(event: any): Promise<{
        principalId: string;
        policyDocument: {
            Version: string;
            Statement: Array<{
                Action: string;
                Effect: string;
                Resource: string;
            }>;
        };
        context: {
            userId: string;
            email: string;
            groups: string;
        };
    }>;
}
export declare class SimpleAuthService {
    verifyToken(token: string): Promise<AuthContext>;
    extractTokenFromHeader(authHeader: string): string | null;
    authenticateRequest(authHeader: string): Promise<AuthContext>;
}
//# sourceMappingURL=auth.d.ts.map