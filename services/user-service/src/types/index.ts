/*
 * Local replacement for the external `@hockey-hub/types` package.
 * These types are required across the user‑service codebase and
 * were extracted here so that the service can compile without the
 * original shared package.
 */

// ---------------------------------------------------------------------------
//  Authentication & JWT
// ---------------------------------------------------------------------------
export interface JwtPayload {
  userId: string;
  email?: string;
  roles: string[];
  permissions?: string[];
  organizationId?: string;
  exp?: number;
  iat?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions?: string[];
  };
}

// ---------------------------------------------------------------------------
//  HTTP Success / Error response helpers
// ---------------------------------------------------------------------------
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface HttpExceptionOptions {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: true;
  message: string;
  code: string;
  status: number;
  category?:
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'VALIDATION'
    | 'RESOURCE_CONFLICT'
    | 'EXTERNAL_SERVICE'
    | 'INTERNAL_ERROR';
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  transactionId?: string;
}

// ---------------------------------------------------------------------------
//  Express helpers
// ---------------------------------------------------------------------------
import type { Request as ExpressRequest, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

export type TypedRequest<
  P extends ParamsDictionary = ParamsDictionary,
  Q = ParsedQs | Record<string, any>,
  B = any,
> = ExpressRequest & {
  params: P;
  query: Q;
  body: B;
};

export interface ValidatedRequest<T = any> extends ExpressRequest {
  validatedData: T;
}

export type ErrorHandlerMiddleware = (
  error: Error,
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
) => void;

// ---------------------------------------------------------------------------
//  RBAC / Authorization helper types
// ---------------------------------------------------------------------------
export interface AuthorizeOptions {
  allowedRoles?: string[];
  requiredPermissions?: string[];
}

export type AuthorizationMiddlewareFactory = (
  options: AuthorizeOptions,
) => (req: TypedRequest, res: Response, next: NextFunction) => void;

export type ValidateRequestMiddleware = (
  schema: any,
) => (req: TypedRequest, res: Response, next: NextFunction) => void;

// ---------------------------------------------------------------------------
//  User / Auth related models
// ---------------------------------------------------------------------------
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  organizationId: string;
  teamIds?: string[];
  lang: string;
  // expose userId getter for backwards compatibility (maps to id)
  readonly userId?: string;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
  teamIds?: string[];
  lang?: string;
}

// ---------------------------------------------------------------------------
//  Zod helper schemas (re-exported)
// ---------------------------------------------------------------------------
import { z } from 'zod';
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);
export const phoneSchema = z.string().regex(/^\+?[0-9]{6,15}$/).optional();
export const languageSchema = z.enum(['sv', 'en']);

// ---------------------------------------------------------------------------
//  Custom HttpException class (supports positional & object constructors)
// ---------------------------------------------------------------------------
export class HttpException extends Error {
  status: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    statusOrOptions: number | HttpExceptionOptions,
    message?: string,
    code?: string,
    details?: Record<string, any>,
  ) {
    if (typeof statusOrOptions === 'number') {
      super(message ?? 'Error');
      this.status = statusOrOptions;
      this.code = code ?? 'INTERNAL_ERROR';
      this.details = details;
    } else {
      super(statusOrOptions.message);
      this.status = statusOrOptions.status ?? 500;
      this.code = statusOrOptions.code ?? 'INTERNAL_ERROR';
      this.details = statusOrOptions.details;
    }
  }
} 