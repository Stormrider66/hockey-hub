"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Format validation errors for consistent error response
 */
function formatValidationErrors(errors) {
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
function validateBody(type, options = {}) {
    return async (req, res, next) => {
        try {
            // Transform plain object to class instance
            const dto = (0, class_transformer_1.plainToClass)(type, req.body, {
                excludeExtraneousValues: false,
                enableImplicitConversion: true
            });
            // Validate the DTO
            const errors = await (0, class_validator_1.validate)(dto, {
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
        }
        catch (error) {
            console.error('Validation middleware error:', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Internal server error during validation'
            });
        }
    };
}
exports.validateBody = validateBody;
/**
 * Validation middleware factory for request query parameters
 */
function validateQuery(type, options = {}) {
    return async (req, res, next) => {
        try {
            const dto = (0, class_transformer_1.plainToClass)(type, req.query, {
                excludeExtraneousValues: false,
                enableImplicitConversion: true
            });
            const errors = await (0, class_validator_1.validate)(dto, {
                whitelist: options.whitelist ?? true,
                forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
                ...options
            });
            if (errors.length > 0) {
                const errorResponse = formatValidationErrors(errors);
                return res.status(errorResponse.statusCode).json(errorResponse);
            }
            req.query = dto;
            next();
        }
        catch (error) {
            console.error('Query validation middleware error:', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Internal server error during query validation'
            });
        }
    };
}
exports.validateQuery = validateQuery;
/**
 * Validation middleware factory for request parameters
 */
function validateParams(type, options = {}) {
    return async (req, res, next) => {
        try {
            const dto = (0, class_transformer_1.plainToClass)(type, req.params, {
                excludeExtraneousValues: false,
                enableImplicitConversion: true
            });
            const errors = await (0, class_validator_1.validate)(dto, {
                whitelist: options.whitelist ?? true,
                forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
                ...options
            });
            if (errors.length > 0) {
                const errorResponse = formatValidationErrors(errors);
                return res.status(errorResponse.statusCode).json(errorResponse);
            }
            req.params = dto;
            next();
        }
        catch (error) {
            console.error('Params validation middleware error:', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Internal server error during params validation'
            });
        }
    };
}
exports.validateParams = validateParams;
function validate(config) {
    return async (req, res, next) => {
        const middlewares = [];
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
            const result = await new Promise((resolve) => {
                middleware(req, res, (err) => {
                    if (err || res.headersSent) {
                        resolve(false);
                    }
                    else {
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
exports.validate = validate;
