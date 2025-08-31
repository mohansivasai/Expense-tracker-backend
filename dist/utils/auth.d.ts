import { AuthContext } from '../types';
export declare class SimpleAuthService {
    verifyToken(token: string): Promise<AuthContext>;
    authenticateRequest(authHeader: string): Promise<AuthContext>;
}
//# sourceMappingURL=auth.d.ts.map