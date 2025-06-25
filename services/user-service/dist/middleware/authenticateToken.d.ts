import { Response, NextFunction } from 'express';
import { AuthenticatedUser, TypedRequest } from '../types';
export { AuthenticatedUser };
type AuthRequestHandler = (req: TypedRequest, res: Response, next: NextFunction) => void;
export declare const authenticateToken: AuthRequestHandler;
//# sourceMappingURL=authenticateToken.d.ts.map