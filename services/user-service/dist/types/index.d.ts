/// <reference types="cookie-parser" />
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
    category?: 'AUTHENTICATION' | 'AUTHORIZATION' | 'VALIDATION' | 'RESOURCE_CONFLICT' | 'EXTERNAL_SERVICE' | 'INTERNAL_ERROR';
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    transactionId?: string;
}
import type { Request as ExpressRequest, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
export type TypedRequest<P extends ParamsDictionary = ParamsDictionary, Q = ParsedQs | Record<string, any>, B = any> = ExpressRequest & {
    params: P;
    query: Q;
    body: B;
};
export interface ValidatedRequest<T = any> extends ExpressRequest {
    validatedData: T;
}
export type ErrorHandlerMiddleware = (error: Error, req: ExpressRequest, res: Response, next: NextFunction) => void;
export interface AuthorizeOptions {
    allowedRoles?: string[];
    requiredPermissions?: string[];
}
export type AuthorizationMiddlewareFactory = (options: AuthorizeOptions) => (req: TypedRequest, res: Response, next: NextFunction) => void;
export type ValidateRequestMiddleware = (schema: any) => (req: TypedRequest, res: Response, next: NextFunction) => void;
export interface AuthenticatedUser {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
    organizationId: string;
    teamIds?: string[];
    lang: string;
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
import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchema: z.ZodOptional<z.ZodString>;
export declare const languageSchema: z.ZodEnum<["sv", "en"]>;
export declare class HttpException extends Error {
    status: number;
    code: string;
    details?: Record<string, any>;
    constructor(statusOrOptions: number | HttpExceptionOptions, message?: string, code?: string, details?: Record<string, any>);
}
//# sourceMappingURL=index.d.ts.map