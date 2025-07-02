"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAndValidate = exports.validateFileUpload = exports.sanitize = void 0;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
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
const XSS_PATTERNS = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
];
/**
 * Check if a value contains potential SQL injection
 */
function containsSQLInjection(value) {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}
/**
 * Check if a value contains potential XSS
 */
function containsXSS(value) {
    return XSS_PATTERNS.some(pattern => pattern.test(value));
}
/**
 * Sanitize a string value
 */
function sanitizeString(value, options) {
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
    }
    else if (options.escapeHtml !== false) {
        // Use DOMPurify for safe HTML sanitization
        const purifyConfig = {};
        if (options.allowedTags) {
            purifyConfig.ALLOWED_TAGS = options.allowedTags;
        }
        if (options.allowedAttributes) {
            purifyConfig.ALLOWED_ATTR = Object.keys(options.allowedAttributes).reduce((acc, tag) => {
                return [...acc, ...options.allowedAttributes[tag]];
            }, []);
        }
        sanitized = isomorphic_dompurify_1.default.sanitize(sanitized, purifyConfig);
    }
    return sanitized;
}
/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj, options) {
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
        const sanitized = {};
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
function sanitize(options = {}) {
    return (req, res, next) => {
        try {
            // Sanitize body
            if (req.body) {
                req.body = sanitizeObject(req.body, options);
            }
            // Sanitize query parameters
            if (req.query) {
                req.query = sanitizeObject(req.query, options);
            }
            // Sanitize URL parameters
            if (req.params) {
                req.params = sanitizeObject(req.params, options);
            }
            // Sanitize headers (be careful with this)
            const headerKeysToSanitize = ['user-agent', 'referer', 'x-forwarded-for'];
            headerKeysToSanitize.forEach(key => {
                if (req.headers[key] && typeof req.headers[key] === 'string') {
                    req.headers[key] = sanitizeString(req.headers[key], {
                        ...options,
                        stripHtml: true, // Always strip HTML from headers
                        maxStringLength: 1000
                    });
                }
            });
            next();
        }
        catch (error) {
            console.error('Sanitization middleware error:', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Internal server error during input sanitization'
            });
        }
    };
}
exports.sanitize = sanitize;
function validateFileUpload(options = {}) {
    return (req, res, next) => {
        try {
            // Check if files exist
            if (!req.files && !req.file) {
                return next();
            }
            const files = Array.isArray(req.files) ? req.files :
                req.files ? Object.values(req.files).flat() :
                    [req.file].filter(Boolean);
            // Check max files
            if (options.maxFiles && files.length > options.maxFiles) {
                return res.status(400).json({
                    statusCode: 400,
                    message: `Maximum ${options.maxFiles} files allowed`
                });
            }
            // Validate each file
            for (const file of files) {
                if (!file)
                    continue;
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
        }
        catch (error) {
            console.error('File upload validation error:', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Internal server error during file validation'
            });
        }
    };
}
exports.validateFileUpload = validateFileUpload;
/**
 * Create a combined sanitization and validation middleware
 */
function sanitizeAndValidate(sanitizationOptions = {}, fileUploadOptions) {
    const middlewares = [sanitize(sanitizationOptions)];
    if (fileUploadOptions) {
        middlewares.push(validateFileUpload(fileUploadOptions));
    }
    return (req, res, next) => {
        // Execute middlewares sequentially
        let index = 0;
        const executeNext = (err) => {
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
exports.sanitizeAndValidate = sanitizeAndValidate;
