/// <reference types="cookie-parser" />
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
export interface Request extends ExpressRequest {
}
export type { Response, NextFunction, ParamsDictionary, ParsedQs };
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
//# sourceMappingURL=express-types.d.ts.map