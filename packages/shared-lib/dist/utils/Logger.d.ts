import { Request } from 'express';
export interface LogContext {
    service?: string;
    userId?: string | number;
    correlationId?: string;
    requestId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    error?: any;
    [key: string]: any;
}
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private service;
    private logLevel;
    constructor(service: string);
    private parseLogLevel;
    private formatLog;
    private log;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error | any, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    http(req: Request, res: any, duration: number): void;
    database(operation: string, duration: number, context?: LogContext): void;
    external(service: string, operation: string, duration: number, success: boolean, context?: LogContext): void;
    security(event: string, context?: LogContext): void;
    performance(metric: string, value: number, context?: LogContext): void;
    audit(action: string, resource: string, context?: LogContext): void;
    private enrichContext;
    requestLogger(req: Request): RequestLogger;
}
export declare class RequestLogger {
    private logger;
    private context;
    constructor(logger: Logger, context: LogContext);
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error | any, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
export declare class LoggerFactory {
    private static loggers;
    static getLogger(service: string): Logger;
    static setLogger(service: string, logger: Logger): void;
}
//# sourceMappingURL=Logger.d.ts.map