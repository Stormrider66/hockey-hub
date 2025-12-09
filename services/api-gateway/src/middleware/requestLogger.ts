import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  organizationId?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

// List of sensitive fields to redact from logs
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
  'bankAccount'
];

// Redact sensitive data from objects
function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // High-resolution time source when available (helps with Jest fake timers)
  const now: () => number = (globalThis as any)?.performance?.now
    ? () => (globalThis as any).performance.now()
    : () => Date.now();

  // Generate request ID (align with tests)
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).id = requestId;
  (req as any).__startMs = now();
  res.locals = { ...(res.locals || {}), requestId };

  // Log request
  const requestLog: RequestLogData = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.userId || (req as any).user?.id,
    organizationId: req.user?.organizationId
  };

  // Log request body for POST/PUT/PATCH (with sensitive data redacted)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const redactedBody = redactSensitiveData(req.body);
    (logger as any).http?.('Incoming request', { ...requestLog, body: redactedBody }) || logger.info('Incoming request', { ...requestLog, body: redactedBody });
  } else {
    (logger as any).http?.('Incoming request', requestLog) || logger.info('Incoming request', requestLog);
  }

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data: any): Response {
    res.send = originalSend;
    logResponse(data);
    return res.send(data);
  };

  res.json = function(data: any): Response {
    res.json = originalJson;
    logResponse(data);
    return res.json(data);
  };

  function logResponse(responseBody: any): void {
    const startMs = (req as any).__startMs ?? now();
    const responseTime = Math.max(0, now() - startMs);
    
    const responseLog: RequestLogData = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: responseTime
    };

    // Log errors with more detail
    if (res.statusCode >= 400) {
      const redactedResponse = redactSensitiveData(responseBody);
      logger.warn('Request failed', { 
        ...responseLog, 
        response: redactedResponse 
      });
    } else {
      (logger as any).http?.('Outgoing response', responseLog) || logger.info('Outgoing response', responseLog);
    }

    // Add performance warning for slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        correlationId: req.correlationId,
        url: req.originalUrl,
        responseTime,
        threshold: 1000
      });
    }
  }

  // Set request ID header for clients/tests if possible
  if (typeof (res as any).setHeader === 'function') {
    res.setHeader('X-Request-Id', requestId);
  }

  // Log on finish event as well (test harness triggers 'finish')
  if (typeof (res as any).on === 'function') {
    res.on('finish', () => {
      const startMs = (req as any).__startMs ?? now();
      const duration = Math.max(0, now() - startMs);
      const contentLength = (res as any).get?.('content-length');
      const responseLog: RequestLogData = {
        ...requestLog,
        statusCode: res.statusCode,
        duration,
        ...(contentLength ? { contentLength } as any : {})
      } as any;
      (logger as any).http?.('Outgoing response', responseLog) || logger.info('Outgoing response', responseLog);
    });
  }

  next();
}

// Error logging middleware
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const errorLog = {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userId: req.user?.userId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  };

  logger.error('Unhandled error', errorLog);

  // Don't expose internal errors to clients
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Internal server error',
    correlationId: req.correlationId,
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
}

// Access log middleware for specific routes
export function accessLogger(resource: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const accessLog = {
      correlationId: req.correlationId,
      resource,
      action: req.method,
      userId: req.user?.userId,
      organizationId: req.user?.organizationId,
      resourceId: req.params.id,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      timestamp: new Date().toISOString()
    };

    logger.info('Resource access', accessLog);
    next();
  };
}

// Audit log for sensitive operations
export function auditLogger(action: string, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    function logAudit(success: boolean): void {
      const auditLog = {
        correlationId: req.correlationId,
        action,
        resourceType,
        resourceId: req.params.id,
        userId: req.user?.userId,
        organizationId: req.user?.organizationId,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
        success,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      };

      logger.info('Audit log', auditLog);
    }

    res.send = function(data: any): Response {
      res.send = originalSend;
      logAudit(res.statusCode < 400);
      return res.send(data);
    };

    res.json = function(data: any): Response {
      res.json = originalJson;
      logAudit(res.statusCode < 400);
      return res.json(data);
    };

    next();
  };
}