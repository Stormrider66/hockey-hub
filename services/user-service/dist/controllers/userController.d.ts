import { Request, Response, NextFunction } from 'express';
import { GetUserInput, UpdateUserInput, AssignRoleInput, RemoveRoleInput } from '../validations/userValidations';
import { ListUsersQueryDto } from '../dtos/user.dto';
export declare const listUsersHandler: (req: Request<{}, {}, {}, ListUsersQueryDto>, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserHandler: (req: Request<GetUserInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUserHandler: (req: Request<UpdateUserInput['params'], {}, UpdateUserInput['body']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteUserHandler: (req: Request<GetUserInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const assignRoleHandler: (req: Request<AssignRoleInput['params'], {}, AssignRoleInput['body']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeRoleHandler: (req: Request<RemoveRoleInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map