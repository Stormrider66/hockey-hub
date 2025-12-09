import { Request, Response, NextFunction } from 'express';

export function createLoggingMiddleware(_opts?: any) {
  return function (_req: Request, _res: Response, next: NextFunction) {
    next();
  };
}

export function errorLoggingMiddleware(_serviceName?: string) {
  return function (_req: Request, _res: Response, next: NextFunction) {
    next();
  };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({ message: err?.message || 'Internal Server Error' });
}





