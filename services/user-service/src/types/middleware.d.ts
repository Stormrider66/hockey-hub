declare module '../middleware/validateRequest' {
    import { Request, Response, NextFunction } from 'express';
    import { AnyZodObject } from 'zod';
    
    // Define a consistent request handler type
    type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
    
    export const validateRequest: (schema: AnyZodObject) => RequestHandler;
}

declare module '../middleware/authenticateToken' {
    import { Request, Response, NextFunction } from 'express';
    
    export interface AuthenticatedUser {
        id: string;
        email: string;
        roles: string[];
        permissions: string[];
        organizationId: string;
        teamIds?: string[];
        lang: string;
    }
    
    // Define a consistent request handler type
    type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
    
    export const authenticateToken: RequestHandler;
} 