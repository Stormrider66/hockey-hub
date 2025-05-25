import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects, ZodIssue } from 'zod';

export const validate = (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.errors.map((issue: ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          error: true,
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: formatted,
        });
      }
      next(err);
    }
  }; 