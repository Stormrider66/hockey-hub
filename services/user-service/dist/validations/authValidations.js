"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchemaBase = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("@hockey-hub/types");
// Schema for user registration
exports.registerSchema = zod_1.z.object({
    email: types_1.emailSchema,
    password: types_1.passwordSchema,
    firstName: zod_1.z.string().min(1, { message: 'First name is required' }).max(100),
    lastName: zod_1.z.string().min(1, { message: 'Last name is required' }).max(100),
    phone: types_1.phoneSchema,
    preferredLanguage: types_1.languageSchema,
});
// Schema for user login
exports.loginSchema = zod_1.z.object({
    email: types_1.emailSchema,
    password: zod_1.z.string().min(1, { message: 'Password is required' }), // Simpler validation for login
});
// Schema for forgot password request
exports.forgotPasswordSchema = zod_1.z.object({
    email: types_1.emailSchema,
});
// Schema for reset password action - using newPassword instead of password to match DTO
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, { message: 'Reset token is required' }),
    newPassword: types_1.passwordSchema,
    confirmPassword: zod_1.z.string().min(1, { message: 'Password confirmation is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
// Plain reset password schema without refinement for use with validateRequest middleware
exports.resetPasswordSchemaBase = zod_1.z.object({
    token: zod_1.z.string().min(1, { message: 'Reset token is required' }),
    newPassword: types_1.passwordSchema,
    confirmPassword: zod_1.z.string().min(1, { message: 'Password confirmation is required' }),
});
//# sourceMappingURL=authValidations.js.map