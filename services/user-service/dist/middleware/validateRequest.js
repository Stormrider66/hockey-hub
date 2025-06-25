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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../config/logger"));
const validateRequest = (schema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const validationErrors = error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            logger_1.default.warn('Validation failed', { errors: validationErrors, body: req.body });
            res.status(400).json({
                error: true,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: validationErrors,
            });
            return;
        }
        // Pass other errors to the generic error handler
        logger_1.default.error('Unexpected error during validation', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            error: true,
            message: 'Internal Server Error during validation',
            code: 'INTERNAL_ERROR',
        });
        return;
    }
});
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.js.map