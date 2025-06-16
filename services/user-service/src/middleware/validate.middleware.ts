import { Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { 
  TypedRequest, 
  HttpException,
  ValidateRequestMiddleware
} from '@hockey-hub/types';

/**
 * Middleware to validate request data against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest: ValidateRequestMiddleware = (schema: AnyZodObject) => {
  return async (req: TypedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      await schema.parseAsync(req.body);
      
      // If validation passes, proceed to the next middleware/controller
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the errors into a more user-friendly structure
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        // Return a 400 Bad Request with formatted errors
        return next(
          new HttpException(400, 'Validation failed', 'VALIDATION_ERROR', errors)
        );
      }
      
      // For any other errors, pass to the next error handler
      next(error);
    }
  };
};