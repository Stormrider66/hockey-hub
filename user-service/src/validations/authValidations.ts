import { z } from 'zod';

// Base email validation
const emailValidation = z.string().email({ message: 'Invalid email address' });

// Base password validation (example: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordValidation = z.string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

// Schema for user registration
export const registerSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
  firstName: z.string().min(1, { message: 'First name is required' }).max(100),
  lastName: z.string().min(1, { message: 'Last name is required' }).max(100),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' }).optional(),
  preferredLanguage: z.enum(['sv', 'en']).optional().default('sv'),
});

// Schema for user login
export const loginSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, { message: 'Password is required' }), // Simpler validation for login
});

// Schema for forgot password request
export const forgotPasswordSchema = z.object({
  email: emailValidation,
});

// Schema for reset password action
export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: passwordValidation,
  confirmPassword: z.string().min(1, { message: 'Password confirmation is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type definitions inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>; 