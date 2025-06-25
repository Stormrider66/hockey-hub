"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const types_1 = require("@hockey-hub/types");
/**
 * Middleware to validate request data against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
const validateRequest = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Validate request body against schema
            yield schema.parseAsync(req.body);
            // If validation passes, proceed to the next middleware/controller
            next();
        }
        catch (error) {
            // Handle Zod validation errors
            if (error instanceof zod_1.ZodError) {
                // Format the errors into a more user-friendly structure
                const errors = error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }));
                // Return a 400 Bad Request with formatted errors
                return next(new types_1.HttpException(400, 'Validation failed', 'VALIDATION_ERROR', errors));
            }
            // For any other errors, pass to the next error handler
            next(error);
        }
    });
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validate.middleware.js.map