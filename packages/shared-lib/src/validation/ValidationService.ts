import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationResult } from './rules/BusinessRules';

export interface ValidationErrorDetail {
  field: string;
  constraints: string[];
  children?: ValidationErrorDetail[];
}

export interface ValidationResponse {
  isValid: boolean;
  errors: ValidationErrorDetail[];
  businessRuleErrors?: string[];
}

export class ValidationService {
  private static defaultOptions: ValidatorOptions = {
    whitelist: true, // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
    skipMissingProperties: false, // Validate all properties
    validationError: {
      target: false, // Don't include target in errors
      value: false, // Don't include values in errors (security)
    },
  };

  /**
   * Validate a plain object against a validation class
   */
  static async validate<T extends object>(
    validationClass: new () => T,
    plainObject: any,
    options?: ValidatorOptions
  ): Promise<ValidationResponse> {
    // Transform plain object to class instance
    const instance = plainToClass(validationClass, plainObject);

    // Validate
    const errors = await validate(
      instance as object,
      { ...this.defaultOptions, ...options }
    );

    // Format errors
    const errorDetails = this.formatValidationErrors(errors);

    return {
      isValid: errors.length === 0,
      errors: errorDetails,
    };
  }

  /**
   * Validate with business rules
   */
  static async validateWithBusinessRules<T extends object>(
    validationClass: new () => T,
    plainObject: any,
    businessRuleChecks: (() => ValidationResult)[],
    options?: ValidatorOptions
  ): Promise<ValidationResponse> {
    // First, validate structure
    const structureValidation = await this.validate(
      validationClass,
      plainObject,
      options
    );

    // Then, check business rules
    const businessRuleErrors: string[] = [];
    
    for (const check of businessRuleChecks) {
      const result = check();
      if (!result.isValid) {
        businessRuleErrors.push(...result.errors);
      }
    }

    return {
      isValid: structureValidation.isValid && businessRuleErrors.length === 0,
      errors: structureValidation.errors,
      businessRuleErrors: businessRuleErrors.length > 0 ? businessRuleErrors : undefined,
    };
  }

  /**
   * Validate array of objects
   */
  static async validateArray<T extends object>(
    validationClass: new () => T,
    plainArray: any[],
    options?: ValidatorOptions
  ): Promise<ValidationResponse[]> {
    const results: ValidationResponse[] = [];

    for (const item of plainArray) {
      const result = await this.validate(validationClass, item, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Format validation errors for response
   */
  private static formatValidationErrors(
    errors: ValidationError[]
  ): ValidationErrorDetail[] {
    return errors.map(error => {
      const detail: ValidationErrorDetail = {
        field: error.property,
        constraints: Object.values(error.constraints || {}),
      };

      if (error.children && error.children.length > 0) {
        detail.children = this.formatValidationErrors(error.children);
      }

      return detail;
    });
  }

  /**
   * Sanitize input data
   */
  static sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (['password', 'passwordHash', 'refreshToken'].includes(key)) {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === 'string') {
        // Trim strings and remove potential XSS
        sanitized[key] = value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Common validation patterns
   */
  static readonly patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    subdomain: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    season: /^\d{4}(-\d{4})?$/,
    time24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  };
}

/**
 * Express middleware for validation
 */
export function validateRequest<T extends object>(
  validationClass: new () => T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: any, res: any, next: any) => {
    const data = req[source];
    
    // Sanitize input
    const sanitizedData = ValidationService.sanitize(data);
    
    // Validate
    const result = await ValidationService.validate(
      validationClass,
      sanitizedData
    );

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.errors,
        },
      });
    }

    // Replace with sanitized data
    req[source] = sanitizedData;
    next();
  };
}

/**
 * Async validator wrapper for custom validators
 */
export function createAsyncValidator<T>(
  validator: (value: T) => Promise<boolean>,
  errorMessage: string
) {
  return async (value: T): Promise<string | null> => {
    const isValid = await validator(value);
    return isValid ? null : errorMessage;
  };
}