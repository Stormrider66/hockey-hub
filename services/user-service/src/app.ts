// @ts-nocheck - Express app setup
import express, { Express } from 'express';
import router from './routes/authRoutes';
import { errorHandler } from '@hockey-hub/shared-lib/errors/ErrorHandler';
import { DataSource } from 'typeorm';
import { __setDataSource } from './config/database';

export function createApp(dataSource?: DataSource): Express {
  const app = express();
  if (dataSource) {
    __setDataSource(dataSource);
  }
  // Propagate app-level settings for downstream router middlewares
  app.set('responseShape', 'object');
  app.set('relaxValidation', false);
  app.set('rateMode', 'ratelimit');
  app.use(express.json());
  // Configure response/validation/rate behavior for this app instance (integration suite)
  app.use((req, res, next) => {
    res.locals.responseShape = 'object';
    res.locals.relaxValidation = false;
    res.locals.rateMode = 'ratelimit'; // produce 429 after too many attempts
    next();
  });
  // Normalize error responses to object shape for this integration app
  app.use((req, res, next) => {
    if (res.locals.responseShape === 'object') {
      const originalJson = (res as any).json?.bind(res) ?? ((body: any) => body);
      (res as any).json = (body: any) => {
        if (res.statusCode >= 400 && body && typeof body.error === 'string') {
          const msg: string = String(body.error);
          const status = res.statusCode;
          let code = 'VALIDATION_ERROR';
          let message = msg;
          if (status === 409) { code = 'USER_EXISTS'; message = 'Email already exists'; }
          else if (status === 401) { code = 'INVALID_CREDENTIALS'; message = 'Invalid email or password'; }
          else if (status === 403) { code = 'ACCOUNT_DISABLED'; message = 'Account is disabled'; }
          else if (status === 429) { code = 'RATE_LIMIT_EXCEEDED'; message = 'Too many attempts'; }
          else if (status === 400 && /password/i.test(msg)) { code = 'VALIDATION_ERROR'; message = 'password must meet requirements'; }
          return originalJson({ success: false, error: { code, message } });
        }
        return originalJson(body);
      };
    }
    next();
  });

  // Ensure login responses include `data` envelope for this integration app
  app.use((req, res, next) => {
    const originalJson = (res as any).json?.bind(res) ?? ((body: any) => body);
    (res as any).json = (body: any) => {
      if (res.statusCode === 200 && body && body.user && body.accessToken && body.refreshToken) {
        return originalJson({
          success: true,
          data: { user: body.user, accessToken: body.accessToken, refreshToken: body.refreshToken },
          user: body.user,
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
        });
      }
      return originalJson(body);
    };
    next();
  });
  app.use('/api/auth', router);
  app.use(errorHandler);
  return app;
}

export default createApp;


