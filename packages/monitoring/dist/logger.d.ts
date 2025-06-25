import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
export interface LoggerConfig {
    level: string;
    service: string;
    version?: string;
    environment?: string;
    redactionPaths?: string[];
}
export declare function createLogger(config: LoggerConfig): import("pino").Logger<never>;
export declare function correlationMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function requestLoggingMiddleware(logger: pino.Logger): (req: Request, res: Response, next: NextFunction) => void;
export declare function createChildLogger(logger: pino.Logger, req: Request, metadata?: Record<string, any>): pino.Logger<never>;
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
            logger?: pino.Logger;
        }
    }
}
