import { Request, Response, NextFunction } from 'express';
import { Logger, LoggerFactory } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

declare module 'express' {
  interface Request {
    logger?: Logger;
    startTime?: number;
  }
}

export interface LoggingOptions {
  serviceName: string;
  skipPaths?: string[];
  logHeaders?: boolean;
  logBody?: boolean;
  sensitiveFields?: string[];
}

/**
 * Create logging middleware for Express applications
 */
export function createLoggingMiddleware(options: LoggingOptions) {
  const logger = LoggerFactory.getLogger(options.serviceName);
  const skipPaths = new Set(options.skipPaths || ['/health', '/metrics', '/favicon.ico']);
  const sensitiveFields = new Set(options.sensitiveFields || [
    'password', 'token', 'secret', 'authorization', 'cookie', 'credit_card'
  ]);

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for certain paths
    if (skipPaths.has(req.path)) {
      return next();
    }

    // Generate request ID if not present
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = uuidv4();
    }

    // Generate correlation ID if not present
    if (!req.headers['x-correlation-id']) {
      req.headers['x-correlation-id'] = req.headers['x-request-id'];
    }

    // Attach logger to request
    req.logger = logger.requestLogger(req);
    req.startTime = Date.now();

    // Log incoming request
    const requestLog: any = {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (options.logHeaders) {
      requestLog.headers = sanitizeObject(req.headers, sensitiveFields);
    }

    if (options.logBody && req.body && Object.keys(req.body).length > 0) {
      requestLog.body = sanitizeObject(req.body, sensitiveFields);
    }

    req.logger?.info('Incoming request', requestLog);

    // Capture response
    const originalSend = res.send;
    let responseBody: any;

    res.send = function(data: any) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - (req.startTime || 0);
      logger.http(req, res, duration);

      // Log additional response details for errors
      if (res.statusCode >= 400) {
        const errorLog: any = {
          statusCode: res.statusCode,
          duration,
          path: req.path,
          method: req.method
        };

        if (responseBody) {
          try {
            const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            errorLog.error = parsed.error || parsed.message || parsed;
          } catch {
            errorLog.response = responseBody.substring(0, 500); // Limit size
          }
        }

        req.logger?.warn('Request failed', errorLog);
      }
    });

    next();
  };
}

/**
 * Sanitize an object by removing sensitive fields
 */
function sanitizeObject(obj: any, sensitiveFields: Set<string>): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field is sensitive
      const isSensitive = Array.from(sensitiveFields).some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key], sensitiveFields);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(serviceName: string) {
  const logger = LoggerFactory.getLogger(serviceName);

  return (err: any, req: Request, res: Response, next: NextFunction) => {
    const duration = Date.now() - (req.startTime || 0);
    
    const errorContext = {
      method: req.method,
      path: req.path,
      statusCode: err.statusCode || 500,
      duration,
      correlationId: req.headers['x-correlation-id'] as string,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.userId,
      errorCode: err.code,
      errorName: err.name,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    };

    // Log based on error type
    if (err.isOperational) {
      logger.warn(`Operational error: ${err.message}`, errorContext);
    } else {
      logger.error(`System error: ${err.message}`, err, errorContext);
    }

    next(err);
  };
}