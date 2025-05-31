import type { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../config/logger';

// Type for the request handler function
type ValidateRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const validateRequest = 
  (schema: AnyZodObject): ValidateRequestHandler => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Validation failed', { errors: validationErrors, body: req.body });
        res.status(400).json({
          error: true,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        });
        return;
      }
      // Pass other errors to the generic error handler
      logger.error('Unexpected error during validation', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({
        error: true,
        message: 'Internal Server Error during validation',
        code: 'INTERNAL_ERROR',
      });
      return;
    }
  }; 