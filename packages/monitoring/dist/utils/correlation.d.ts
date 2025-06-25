import { Request } from 'express';
/**
 * Generates a new correlation ID
 */
export declare function generateCorrelationId(): string;
/**
 * Extracts correlation ID from request headers or generates a new one
 */
export declare function getCorrelationId(req: Request): string;
/**
 * Sets correlation ID on the request object
 */
export declare function setCorrelationId(req: Request & {
    correlationId?: string;
}, correlationId: string): void;
/**
 * Gets correlation ID from request object
 */
export declare function getCorrelationIdFromRequest(req: Request & {
    correlationId?: string;
}): string | undefined;
/**
 * Creates headers with correlation ID for outbound requests
 */
export declare function createCorrelationHeaders(correlationId: string): Record<string, string>;
