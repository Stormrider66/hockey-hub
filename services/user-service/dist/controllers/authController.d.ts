import { Response, NextFunction } from 'express';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../validations/authValidations';
import { TypedRequest } from '../types';
export declare const registerHandler: (req: TypedRequest<{}, {}, RegisterInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const loginHandler: (req: TypedRequest<{}, {}, LoginInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const refreshTokenHandler: (req: TypedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logoutHandler: (req: TypedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const forgotPasswordHandler: (req: TypedRequest<{}, {}, ForgotPasswordInput>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resetPasswordHandler: (req: TypedRequest<{}, {}, ResetPasswordInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map