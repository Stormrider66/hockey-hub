import { Response, NextFunction } from 'express';
export declare const authenticateToken: (req: any, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const authorize: (...roles: string[]) => (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map