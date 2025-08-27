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

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private service: string;
  private logLevel: LogLevel;

  constructor(service: string) {
    this.service = service;
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private formatLog(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const enrichedContext = this.enrichContext(context);
    
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        service: this.service,
        message,
        ...enrichedContext
      });
    } else {
      // Pretty format for development
      const contextStr = Object.keys(enrichedContext).length > 0 
        ? `\n${JSON.stringify(enrichedContext, null, 2)}` 
        : '';
      return `${timestamp} [${this.service}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }
  }

  private log(level: LogLevel, levelStr: string, message: string, context?: LogContext): void {
    if (level <= this.logLevel) {
      const output = this.formatLog(levelStr, message, context);
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(output);
          break;
        case LogLevel.WARN:
          console.warn(output);
          break;
        default:
          console.log(output);
      }
    }
  }

  // Core logging methods
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'warn', message, context);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        code: error.code,
        statusCode: error.statusCode
      } : undefined
    };
    this.log(LogLevel.ERROR, 'error', message, errorContext);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  // Specialized logging methods
  http(req: Request, res: { statusCode: number }, duration: number): void {
    const context: LogContext = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.headers['x-correlation-id'] as string,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.userId
    };

    const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const levelStr = res.statusCode >= 400 ? 'warn' : 'info';
    this.log(level, levelStr, `HTTP ${req.method} ${req.path} ${res.statusCode}`, context);
  }

  database(operation: string, duration: number, context?: LogContext): void {
    this.info(`Database ${operation}`, {
      ...context,
      type: 'database',
      operation,
      duration
    });
  }

  external(service: string, operation: string, duration: number, success: boolean, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const levelStr = success ? 'info' : 'warn';
    this.log(level, levelStr, `External service ${service} - ${operation}`, {
      ...context,
      type: 'external_service',
      service,
      operation,
      duration,
      success
    });
  }

  security(event: string, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      type: 'security'
    });
  }

  performance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance metric: ${metric}`, {
      ...context,
      type: 'performance',
      metric,
      value
    });
  }

  audit(action: string, resource: string, context?: LogContext): void {
    this.info(`Audit: ${action} on ${resource}`, {
      ...context,
      type: 'audit',
      action,
      resource
    });
  }

  // Helper methods
  private enrichContext(context?: LogContext): LogContext {
    const enriched: LogContext = {
      environment: process.env.NODE_ENV,
      ...context
    };

    // Remove undefined values
    Object.keys(enriched).forEach(key => {
      if (enriched[key] === undefined) {
        delete enriched[key];
      }
    });

    return enriched;
  }

  // Create a logger for Express request context
  requestLogger(req: Request): RequestLogger {
    return new RequestLogger(this, {
      correlationId: req.headers['x-correlation-id'] as string,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.userId,
      method: req.method,
      path: req.path
    });
  }
}

// Request-scoped logger
export class RequestLogger {
  constructor(
    private logger: Logger,
    private context: LogContext
  ) {}

  info(message: string, context?: LogContext): void {
    this.logger.info(message, { ...this.context, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { ...this.context, ...context });
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    this.logger.error(message, error, { ...this.context, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { ...this.context, ...context });
  }
}

// Factory for creating loggers
export class LoggerFactory {
  private static loggers = new Map<string, Logger>();

  static getLogger(service: string): Logger {
    if (!this.loggers.has(service)) {
      this.loggers.set(service, new Logger(service));
    }
    return this.loggers.get(service)!;
  }

  static setLogger(service: string, logger: Logger): void {
    this.loggers.set(service, logger);
  }
}