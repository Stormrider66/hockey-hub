// This file centralizes Express types for use across the application
// to avoid conflicts between different imports of Express types

import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

// Re-export interface types from express for consistency
export interface Request extends ExpressRequest {}
export type { Response, NextFunction, ParamsDictionary, ParsedQs };

// Define any custom types here
export type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>; 