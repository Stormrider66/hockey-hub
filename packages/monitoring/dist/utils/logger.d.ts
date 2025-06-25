import { Logger as PinoLogger } from 'pino';
export interface LogContext {
    service?: string;
    organizationId?: string;
    userId?: string;
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    [key: string]: any;
}
export interface LoggerConfig {
    service: string;
    level?: string;
    pretty?: boolean;
    redact?: string[];
}
/**
 * Creates a configured Pino logger instance with standardized settings
 */
export declare function createLogger(config: LoggerConfig): PinoLogger;
/**
 * Creates a child logger with additional context
 */
export declare function createChildLogger(logger: PinoLogger, context: LogContext): PinoLogger;
/**
 * Standard log messages for consistency
 */
export declare const LogMessages: {
    readonly SERVER_STARTING: "Server starting";
    readonly SERVER_STARTED: "Server started successfully";
    readonly SERVER_STOPPING: "Server shutting down";
    readonly SERVER_STOPPED: "Server stopped";
    readonly DB_CONNECTING: "Connecting to database";
    readonly DB_CONNECTED: "Database connected successfully";
    readonly DB_DISCONNECTED: "Database disconnected";
    readonly DB_ERROR: "Database error occurred";
    readonly DB_QUERY_SLOW: "Slow database query detected";
    readonly HTTP_REQUEST_STARTED: "HTTP request started";
    readonly HTTP_REQUEST_COMPLETED: "HTTP request completed";
    readonly HTTP_REQUEST_FAILED: "HTTP request failed";
    readonly AUTH_SUCCESS: "Authentication successful";
    readonly AUTH_FAILED: "Authentication failed";
    readonly AUTH_TOKEN_EXPIRED: "Authentication token expired";
    readonly AUTH_UNAUTHORIZED: "Unauthorized access attempt";
    readonly OPERATION_STARTED: "Operation started";
    readonly OPERATION_COMPLETED: "Operation completed successfully";
    readonly OPERATION_FAILED: "Operation failed";
    readonly CIRCUIT_BREAKER_OPEN: "Circuit breaker opened";
    readonly CIRCUIT_BREAKER_HALF_OPEN: "Circuit breaker half-open";
    readonly CIRCUIT_BREAKER_CLOSED: "Circuit breaker closed";
    readonly HEALTH_CHECK_PASSED: "Health check passed";
    readonly HEALTH_CHECK_FAILED: "Health check failed";
};
export type Logger = PinoLogger;
