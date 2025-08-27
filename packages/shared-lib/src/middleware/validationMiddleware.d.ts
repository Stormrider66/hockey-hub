import { Request, Response, NextFunction } from 'express';
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
 * Validation middleware factory for request DTOs
 * @param type The DTO class to validate against
 * @param options Validation options
 * @returns Express middleware function
 */
export declare function validateBody<T extends object>(type: ClassConstructor<T>, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validation middleware factory for request query parameters
 */
export declare function validateQuery<T extends object>(type: ClassConstructor<T>, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validation middleware factory for request parameters
 */
export declare function validateParams<T extends object>(type: ClassConstructor<T>, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Combined validation middleware for multiple sources
 */
export interface CombinedValidationOptions {
    body?: ClassConstructor<any>;
    query?: ClassConstructor<any>;
    params?: ClassConstructor<any>;
    options?: ValidationOptions;
}
export declare function validate(config: CombinedValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validationMiddleware.d.ts.map