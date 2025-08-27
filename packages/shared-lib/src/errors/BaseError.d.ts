/**
 * Base error class for all custom errors in the Hockey Hub application
 */
export declare abstract class BaseError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly timestamp: Date;
    readonly context?: Record<string, any>;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean, context?: Record<string, any>);
    /**
     * Convert error to a JSON-serializable format
     */
    toJSON(): {
        name: string;
        message: string;
        code: string;
        statusCode: number;
        timestamp: Date;
        context: Record<string, any> | undefined;
        stack: string | undefined;
    };
}
//# sourceMappingURL=BaseError.d.ts.map