import { Request, Response, NextFunction } from 'express';
/**
 * Sanitization options
 */
export interface SanitizationOptions {
    stripHtml?: boolean;
    escapeHtml?: boolean;
    trimStrings?: boolean;
    removeNullBytes?: boolean;
    normalizeWhitespace?: boolean;
    maxStringLength?: number;
    allowedTags?: string[];
    allowedAttributes?: {
        [key: string]: string[];
    };
}
/**
 * Sanitization middleware factory
 */
export declare function sanitize(options?: SanitizationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * File upload validation middleware
 */
export interface FileUploadOptions {
    allowedMimeTypes?: string[];
    maxFileSize?: number;
    maxFiles?: number;
    allowedExtensions?: string[];
    scanForVirus?: boolean;
}
export declare function validateFileUpload(options?: FileUploadOptions): (req: Request, res: Response, next: NextFunction) => any;
/**
 * Create a combined sanitization and validation middleware
 */
export declare function sanitizeAndValidate(sanitizationOptions?: SanitizationOptions, fileUploadOptions?: FileUploadOptions): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=sanitizationMiddleware.d.ts.map