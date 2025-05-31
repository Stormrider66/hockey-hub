import { z } from 'zod';
import { 
  emailSchema,
  passwordSchema,
  phoneSchema,
  languageSchema,
} from '@hockey-hub/types';

// Schema for user registration
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, { message: 'First name is required' }).max(100),
  lastName: z.string().min(1, { message: 'Last name is required' }).max(100),
  phone: phoneSchema,
  preferredLanguage: languageSchema,
});

// Schema for user login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }), // Simpler validation for login
});

// Schema for forgot password request
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Schema for reset password action - using newPassword instead of password to match DTO
export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Plain reset password schema without refinement for use with validateRequest middleware
export const resetPasswordSchemaBase = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
});

// Type definitions inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;