import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
export declare class MetricsCollector {
    private serviceName;
    private prefix;
    private httpRequestDuration;
    private httpRequestTotal;
    private httpRequestSizeBytes;
    private httpResponseSizeBytes;
    private activeConnections;
    private customMetrics;
    constructor(serviceName: string, prefix?: string);
    httpMetricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    createCounter(name: string, help: string, labelNames?: string[]): client.Counter<string>;
    createGauge(name: string, help: string, labelNames?: string[]): client.Gauge<string>;
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): client.Histogram<string>;
    createBusinessMetrics(): {
        loginAttempts: client.Counter<string>;
        tokenValidations: client.Counter<string>;
        databaseQueries: client.Histogram<string>;
        databaseConnections: client.Gauge<string>;
        trainingSessions: client.Counter<string>;
        exercisesExecuted: client.Counter<string>;
        medicalDocuments: client.Counter<string>;
        treatmentPlans: client.Counter<string>;
        eventsScheduled: client.Counter<string>;
        resourceBookings: client.Counter<string>;
        messagesExchanged: client.Counter<string>;
        notificationsSent: client.Counter<string>;
    };
    getMetricsHandler(): (_req: Request, res: Response) => Promise<void>;
    clearMetrics(): void;
}
export declare function enableDefaultMetrics(serviceName: string): void;
