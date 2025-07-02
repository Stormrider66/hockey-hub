import { Logger } from '../utils/Logger';
declare module 'express' {
    interface Request {
        logger?: Logger;
        startTime?: number;
    }
}
export interface LoggingOptions {
    serviceName: string;
    skipPaths?: string[];
    logHeaders?: boolean;
    logBody?: boolean;
    sensitiveFields?: string[];
}
/**
 * Create logging middleware for Express applications
 */
export declare function createLoggingMiddleware(options: LoggingOptions): (req: Request, res: Response, next: NextFunction) => any;
/**
 * Error logging middleware
 */
export declare function errorLoggingMiddleware(serviceName: string): (err: any, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=loggingMiddleware.d.ts.map