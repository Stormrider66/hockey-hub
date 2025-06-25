import { Request, Response } from 'express';
import { HealthCheck, HealthResponse } from './types';
export declare class HealthCheckManager {
    private checks;
    private startTime;
    constructor();
    addCheck(healthCheck: HealthCheck): void;
    removeCheck(name: string): void;
    private executeCheck;
    runHealthChecks(): Promise<HealthResponse>;
    getHandler(): (_req: Request, res: Response) => Promise<void>;
    getLivenessHandler(): (_req: Request, res: Response) => void;
    getReadinessHandler(): (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    private checkMemoryUsage;
    private checkUptime;
    static createDatabaseCheck(name: string, checkFn: () => Promise<boolean>): HealthCheck;
    static createExternalServiceCheck(serviceName: string, checkFn: () => Promise<boolean>): HealthCheck;
    static createCustomCheck(name: string, checkFn: () => Promise<{
        healthy: boolean;
        details?: any;
        error?: string;
    }>, critical?: boolean, timeout?: number): HealthCheck;
}
