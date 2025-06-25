"use strict";
/*
 * Local replacement for the external `@hockey-hub/types` package.
 * These types are required across the user‑service codebase and
 * were extracted here so that the service can compile without the
 * original shared package.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpException = exports.languageSchema = exports.phoneSchema = exports.passwordSchema = exports.emailSchema = void 0;
// ---------------------------------------------------------------------------
//  Zod helper schemas (re-exported)
// ---------------------------------------------------------------------------
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().email();
exports.passwordSchema = zod_1.z.string().min(8);
exports.phoneSchema = zod_1.z.string().regex(/^\+?[0-9]{6,15}$/).optional();
exports.languageSchema = zod_1.z.enum(['sv', 'en']);
// ---------------------------------------------------------------------------
//  Custom HttpException class (supports positional & object constructors)
// ---------------------------------------------------------------------------
class HttpException extends Error {
    constructor(statusOrOptions, message, code, details) {
        var _a, _b;
        if (typeof statusOrOptions === 'number') {
            super(message !== null && message !== void 0 ? message : 'Error');
            this.status = statusOrOptions;
            this.code = code !== null && code !== void 0 ? code : 'INTERNAL_ERROR';
            this.details = details;
        }
        else {
            super(statusOrOptions.message);
            this.status = (_a = statusOrOptions.status) !== null && _a !== void 0 ? _a : 500;
            this.code = (_b = statusOrOptions.code) !== null && _b !== void 0 ? _b : 'INTERNAL_ERROR';
            this.details = statusOrOptions.details;
        }
    }
}
exports.HttpException = HttpException;
//# sourceMappingURL=index.js.map