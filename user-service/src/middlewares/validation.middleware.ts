import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import HttpException from '../errors/HttpException'; // Corrected path

// Define the type for the DTO constructor
type DtoConstructor<T> = new (...args: any[]) => T;

// Define a ValidationHandler type
type ValidationHandler = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Express middleware to validate request body against a DTO class.
 * @param type The DTO class to validate against.
 * @param skipMissingProperties If true, skips validation for missing properties.
 */
export const validationMiddleware = <T extends object>(
  type: DtoConstructor<T>,
  skipMissingProperties = false
): ValidationHandler => {
  return (req, res, next) => {
    // Transform the plain object (req.body) to an instance of the DTO class
    const dtoInstance = plainToInstance(type, req.body);

    // Validate the DTO instance
    validate(dtoInstance, { skipMissingProperties })
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          // Format the errors
          const message = errors
            .map((error: ValidationError) =>
              Object.values(error.constraints || {}).join(', ')
            )
            .join(', ');

          // Pass the error to the centralized error handler
          const validationError = new HttpException(
            400, // Bad Request
            `Validation failed: ${message}`,
            'VALIDATION_ERROR',
            { validationErrors: errors } // Optional: Include original errors in details
          );
          next(validationError); 
        } else {
          // Validation passed, attach DTO instance to request for controller use (optional)
          // req.dto = dtoInstance; // You might need to extend Request type
          next(); // Proceed to the next middleware/handler
        }
      })
      .catch(err => { // Catch potential errors during validation itself
        // Pass generic server error to the centralized handler
        next(new HttpException(500, 'Error during input validation processing.', 'INTERNAL_VALIDATION_ERROR', { originalError: err }));
      });
  };
};

export default validationMiddleware; 