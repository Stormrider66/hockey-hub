/// <reference types="cookie-parser" />
import type { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
type ValidateRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateRequest: (schema: AnyZodObject) => ValidateRequestHandler;
export {};
//# sourceMappingURL=validateRequest.d.ts.map