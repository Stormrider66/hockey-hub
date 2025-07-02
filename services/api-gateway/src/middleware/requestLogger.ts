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
  correlationId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  organizationId?: string;
  statusCode?: number;
  responseTime?: number;
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
  // Generate correlation ID
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Log request
  const requestLog: RequestLogData = {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
    organizationId: req.user?.organizationId
  };

  // Log request body for POST/PUT/PATCH (with sensitive data redacted)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const redactedBody = redactSensitiveData(req.body);
    logger.info('Incoming request', { ...requestLog, body: redactedBody });
  } else {
    logger.info('Incoming request', requestLog);
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
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    const responseLog: RequestLogData = {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime
    };

    // Log errors with more detail
    if (res.statusCode >= 400) {
      const redactedResponse = redactSensitiveData(responseBody);
      logger.warn('Request failed', { 
        ...responseLog, 
        response: redactedResponse 
      });
    } else {
      logger.info('Request completed', responseLog);
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

  // Set correlation ID in response headers
  res.setHeader('X-Correlation-Id', req.correlationId);

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
  return (req: Request, res: Response, next: NextFunction) => {
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