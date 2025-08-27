import { ValidatorOptions } from 'class-validator';
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
export declare class ValidationService {
    private static defaultOptions;
    /**
     * Validate a plain object against a validation class
     */
    static validate<T extends object>(validationClass: new () => T, plainObject: any, options?: ValidatorOptions): Promise<ValidationResponse>;
    /**
     * Validate with business rules
     */
    static validateWithBusinessRules<T extends object>(validationClass: new () => T, plainObject: any, businessRuleChecks: (() => ValidationResult)[], options?: ValidatorOptions): Promise<ValidationResponse>;
    /**
     * Validate array of objects
     */
    static validateArray<T extends object>(validationClass: new () => T, plainArray: any[], options?: ValidatorOptions): Promise<ValidationResponse[]>;
    /**
     * Format validation errors for response
     */
    private static formatValidationErrors;
    /**
     * Sanitize input data
     */
    static sanitize(data: any): any;
    /**
     * Common validation patterns
     */
    static readonly patterns: {
        email: RegExp;
        phone: RegExp;
        uuid: RegExp;
        subdomain: RegExp;
        hexColor: RegExp;
        season: RegExp;
        time24: RegExp;
    };
}
/**
 * Express middleware for validation
 */
export declare function validateRequest<T extends object>(validationClass: new () => T, source?: 'body' | 'query' | 'params'): (req: any, res: any, next: any) => Promise<any>;
/**
 * Async validator wrapper for custom validators
 */
export declare function createAsyncValidator<T>(validator: (value: T) => Promise<boolean>, errorMessage: string): (value: T) => Promise<string | null>;
//# sourceMappingURL=ValidationService.d.ts.map