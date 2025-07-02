import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';

export interface ValidationOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  forbidUnknownValues?: boolean;
  disableErrorMessages?: boolean;
  dismissDefaultMessages?: boolean;
  validationError?: {
    target?: boolean;
    value?: boolean;
  };
  skipMissingProperties?: boolean;
  skipNullProperties?: boolean;
  skipUndefinedProperties?: boolean;
  groups?: string[];
  strictGroups?: boolean;
  always?: boolean;
}

export interface ValidationErrorResponse {
  statusCode: number;
  message: string;
  errors: Array<{
    field: string;
    value?: any;
    constraints: string[];
  }>;
}

/**
 * Format validation errors for consistent error response
 */
function formatValidationErrors(errors: ValidationError[]): ValidationErrorResponse {
  const formattedErrors = errors.map(error => {
    const constraints = error.constraints ? Object.values(error.constraints) : [];
    return {
      field: error.property,
      value: error.value,
      constraints
    };
  });

  return {
    statusCode: 400,
    message: 'Validation failed',
    errors: formattedErrors
  };
}

/**
 * Validation middleware factory for request DTOs
 * @param type The DTO class to validate against
 * @param options Validation options
 * @returns Express middleware function
 */
export function validateBody<T extends object>(
  type: ClassConstructor<T>,
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(type, req.body, {
        excludeExtraneousValues: false,
        enableImplicitConversion: true
      });

      // Validate the DTO
      const errors = await validate(dto as object, {
        whitelist: options.whitelist ?? true,
        forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
        forbidUnknownValues: options.forbidUnknownValues ?? true,
        skipMissingProperties: options.skipMissingProperties ?? false,
        skipNullProperties: options.skipNullProperties ?? false,
        skipUndefinedProperties: options.skipUndefinedProperties ?? false,
        groups: options.groups,
        strictGroups: options.strictGroups,
        always: options.always,
        validationError: {
          target: false,
          value: false,
          ...options.validationError
        }
      });

      if (errors.length > 0) {
        const errorResponse = formatValidationErrors(errors);
        return res.status(errorResponse.statusCode).json(errorResponse);
      }

      // Replace request body with validated DTO
      req.body = dto;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error during validation'
      });
    }
  };
}

/**
 * Validation middleware factory for request query parameters
 */
export function validateQuery<T extends object>(
  type: ClassConstructor<T>,
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(type, req.query, {
        excludeExtraneousValues: false,
        enableImplicitConversion: true
      });

      const errors = await validate(dto as object, {
        whitelist: options.whitelist ?? true,
        forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
        ...options
      });

      if (errors.length > 0) {
        const errorResponse = formatValidationErrors(errors);
        return res.status(errorResponse.statusCode).json(errorResponse);
      }

      req.query = dto as any;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error during query validation'
      });
    }
  };
}

/**
 * Validation middleware factory for request parameters
 */
export function validateParams<T extends object>(
  type: ClassConstructor<T>,
  options: ValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(type, req.params, {
        excludeExtraneousValues: false,
        enableImplicitConversion: true
      });

      const errors = await validate(dto as object, {
        whitelist: options.whitelist ?? true,
        forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
        ...options
      });

      if (errors.length > 0) {
        const errorResponse = formatValidationErrors(errors);
        return res.status(errorResponse.statusCode).json(errorResponse);
      }

      req.params = dto as any;
      next();
    } catch (error) {
      console.error('Params validation middleware error:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error during params validation'
      });
    }
  };
}

/**
 * Combined validation middleware for multiple sources
 */
export interface CombinedValidationOptions {
  body?: ClassConstructor<any>;
  query?: ClassConstructor<any>;
  params?: ClassConstructor<any>;
  options?: ValidationOptions;
}

export function validate(config: CombinedValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const middlewares: Array<(req: Request, res: Response, next: NextFunction) => Promise<void>> = [];

    if (config.body) {
      middlewares.push(validateBody(config.body, config.options));
    }
    if (config.query) {
      middlewares.push(validateQuery(config.query, config.options));
    }
    if (config.params) {
      middlewares.push(validateParams(config.params, config.options));
    }

    // Execute validations sequentially
    for (const middleware of middlewares) {
      const result = await new Promise<boolean>((resolve) => {
        middleware(req, res, (err?: any) => {
          if (err || res.headersSent) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

      if (!result) {
        return; // Validation failed, response already sent
      }
    }

    next();
  };
}