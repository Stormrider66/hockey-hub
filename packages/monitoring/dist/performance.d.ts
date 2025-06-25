import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
export declare class PerformanceMonitor {
    private logger;
    private operationThresholds;
    private activeOperations;
    constructor(logger: pino.Logger);
    setThreshold(operation: string, thresholdMs: number): void;
    startOperation(operation: string, metadata?: Record<string, any>): string;
    endOperation(operationId: string): number;
    timeFunction<T>(operation: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): Promise<T>;
    performanceMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    trackDatabaseQuery<T>(operation: string, table: string, query: string, fn: () => T | Promise<T>): Promise<T>;
    trackExternalCall<T>(serviceName: string, operation: string, fn: () => T | Promise<T>): Promise<T>;
    getPerformanceStats(): {
        activeOperations: number;
        thresholds: Record<string, number>;
        recentOperations: Array<{
            operation: string;
            startTime: number;
            metadata?: any;
        }>;
    };
    cleanupStaleOperations(maxAgeMs?: number): number;
    createPerformanceDecorator(operation?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
    private sanitizeQuery;
}
export declare function Performance(operation?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare global {
    namespace Express {
        interface Request {
            performanceId?: string;
        }
    }
}
