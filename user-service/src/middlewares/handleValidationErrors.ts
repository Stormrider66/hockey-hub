import { Request, Response, NextFunction } from 'express';
// Use ts-ignore to bypass type checking for express-validator
// @ts-ignore - bypass express-validator import issues
import * as expressValidator from 'express-validator';
// Fix the path if needed
import HttpException from '../errors/HttpException';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - bypass express-validator type issues
    const errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        // Use HttpException for standardized error response
        return next(new HttpException(400, 'Validation failed', 'VALIDATION_ERROR', errors.array()));
    }
    next();
}; 