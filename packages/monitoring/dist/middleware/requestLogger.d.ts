import { Logger } from 'pino';
export interface RequestLoggerOptions {
    logger: Logger;
    excludePaths?: string[];
    slowRequestThreshold?: number;
}
/**
 * Creates a request logging middleware
 */
export declare function createRequestLogger(options: RequestLoggerOptions): any[];
/**
 * Creates a middleware to log slow database queries
 */
export declare function createDatabaseQueryLogger(logger: Logger, slowQueryThreshold?: number): {
    logQuery: (query: string, parameters?: any[], duration?: number) => void;
    logError: (error: Error, query: string) => void;
};
