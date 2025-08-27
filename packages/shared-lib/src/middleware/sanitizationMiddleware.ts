import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

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
  allowedAttributes?: { [key: string]: string[] };
}

/**
 * SQL injection patterns to detect and prevent
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(--|#|\/\*|\*\/|;)/g,
  /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
  /('|(\')|"|(\"))\s*\bOR\b/gi,
  /\b(xp_|sp_)\w+/gi
];

/**
 * XSS patterns to detect and prevent
 */
// Note: kept for reference; not used directly due to DOMPurify handling
// const XSS_PATTERNS = [
//   /<script[^>]*>[\s\S]*?<\/script>/gi,
//   /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
//   /javascript:/gi,
//   /on\w+\s*=/gi,
//   /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
// ];

/**
 * Check if a value contains potential SQL injection
 */
function containsSQLInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Check if a value contains potential XSS
 */
// function containsXSS(value: string): boolean {
//   return XSS_PATTERNS.some(pattern => pattern.test(value));
// }

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, options: SanitizationOptions): string {
  let sanitized = value;

  // Check for SQL injection attempts
  if (containsSQLInjection(sanitized)) {
    console.warn('Potential SQL injection detected:', sanitized);
    // Remove dangerous SQL keywords and characters
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
  }

  // Remove null bytes
  if (options.removeNullBytes !== false) {
    sanitized = sanitized.replace(/\0/g, '');
  }

  // Trim whitespace
  if (options.trimStrings !== false) {
    sanitized = sanitized.trim();
  }

  // Normalize whitespace
  if (options.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Enforce max string length
  if (options.maxStringLength && sanitized.length > options.maxStringLength) {
    sanitized = sanitized.substring(0, options.maxStringLength);
  }

  // HTML sanitization
  if (options.stripHtml) {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else if (options.escapeHtml !== false) {
    // Use DOMPurify for safe HTML sanitization
    const purifyConfig: any = {};
    
    if (options.allowedTags) {
      purifyConfig.ALLOWED_TAGS = options.allowedTags;
    }
    
    if (options.allowedAttributes) {
      purifyConfig.ALLOWED_ATTR = Object.keys(options.allowedAttributes).reduce((acc, tag) => {
        return [...acc, ...options.allowedAttributes![tag]];
      }, [] as string[]);
    }

    sanitized = String(DOMPurify.sanitize(sanitized, purifyConfig));
  }

  return sanitized;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any, options: SanitizationOptions): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key itself
        const sanitizedKey = sanitizeString(key, options);
        sanitized[sanitizedKey] = sanitizeObject(obj[key], options);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitization middleware factory
 */
export function sanitize(options: SanitizationOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize body
      if (req.body) {
        req.body = sanitizeObject(req.body, options);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, options) as any;
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = sanitizeObject(req.params, options) as any;
      }

      // Sanitize headers (be careful with this)
      const headerKeysToSanitize = ['user-agent', 'referer', 'x-forwarded-for'];
      headerKeysToSanitize.forEach(key => {
        if (req.headers[key] && typeof req.headers[key] === 'string') {
          req.headers[key] = sanitizeString(req.headers[key] as string, {
            ...options,
            stripHtml: true, // Always strip HTML from headers
            maxStringLength: 1000
          });
        }
      });

      next();
    } catch (error) {
      console.error('Sanitization middleware error:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error during input sanitization'
      });
    }
  };
}

/**
 * File upload validation middleware
 */
export interface FileUploadOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedExtensions?: string[];
  scanForVirus?: boolean; // Placeholder for virus scanning integration
}

export function validateFileUpload(options: FileUploadOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if files exist
      const hasFiles = Boolean((req as any).files) || Boolean((req as any).file);
      if (!hasFiles) {
        return next();
      }

      const files = Array.isArray((req as any).files) ? (req as any).files : 
                   (req as any).files ? Object.values((req as any).files).flat() as any[] : 
                   [((req as any).file)].filter(Boolean) as any[];

      // Check max files
      if (options.maxFiles && files.length > options.maxFiles) {
        return res.status(400).json({
          statusCode: 400,
          message: `Maximum ${options.maxFiles} files allowed`
        });
      }

      // Validate each file
      for (const file of files) {
        if (!file) continue;

        // Check file size
        if (options.maxFileSize && file.size > options.maxFileSize) {
          return res.status(400).json({
            statusCode: 400,
            message: `File ${file.originalname || file.name} exceeds maximum size of ${options.maxFileSize} bytes`
          });
        }

        // Check MIME type
        if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({
            statusCode: 400,
            message: `File type ${file.mimetype} is not allowed`
          });
        }

        // Check file extension
        if (options.allowedExtensions) {
          const ext = (file.originalname || file.name).split('.').pop()?.toLowerCase();
          if (!ext || !options.allowedExtensions.includes(ext)) {
            return res.status(400).json({
              statusCode: 400,
              message: `File extension .${ext} is not allowed`
            });
          }
        }

        // TODO: Implement virus scanning if enabled
        if (options.scanForVirus) {
          console.log('Virus scanning not yet implemented');
        }
      }

      next();
    } catch (error) {
      console.error('File upload validation error:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error during file validation'
      });
    }
  };
}

/**
 * Create a combined sanitization and validation middleware
 */
export function sanitizeAndValidate(
  sanitizationOptions: SanitizationOptions = {},
  fileUploadOptions?: FileUploadOptions
) {
  const middlewares: any[] = [sanitize(sanitizationOptions)];
  
  if (fileUploadOptions) {
    middlewares.push(validateFileUpload(fileUploadOptions));
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Execute middlewares sequentially
    let index = 0;
    
    const executeNext = (err?: any) => {
      if (err || res.headersSent) {
        return;
      }
      
      if (index >= middlewares.length) {
        return next();
      }
      
      const middleware = middlewares[index++];
      middleware(req, res, executeNext);
    };
    
    executeNext();
  };
}