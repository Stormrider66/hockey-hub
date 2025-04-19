import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
// import HttpException from '../exceptions/HttpException'; // Need exception handling setup

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

          // Use a generic error for now, replace with HttpException later
          // next(new HttpException(400, message));
          console.error("Validation Errors:", message);
          res.status(400).json({ error: true, message: `Validation failed: ${message}`, code: 'VALIDATION_ERROR' });
        } else {
          // Validation passed, attach DTO instance to request for controller use (optional)
          // req.dto = dtoInstance; // You might need to extend Request type
          next(); // Proceed to the next middleware/handler
        }
      })
      .catch(next); // Catch any errors during validation itself
  };
};

export default validationMiddleware; 