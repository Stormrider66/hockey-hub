import { Logger } from 'pino';
import { PerformanceTiming } from '../types';
export declare class PerformanceMonitor {
    private timings;
    private readonly logger;
    private readonly slowThreshold;
    constructor(logger: Logger, slowThreshold?: number);
    /**
     * Start timing an operation
     */
    startTimer(operation: string, metadata?: Record<string, any>): void;
    /**
     * End timing and log if slow
     */
    endTimer(operation: string): number | null;
    /**
     * Time an async operation
     */
    timeOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    /**
     * Get all active timings
     */
    getActiveTimings(): PerformanceTiming[];
    /**
     * Clear all timings
     */
    clear(): void;
}
/**
 * Create a performance timing decorator for class methods
 */
export declare function Timed(operation?: string, slowThreshold?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
