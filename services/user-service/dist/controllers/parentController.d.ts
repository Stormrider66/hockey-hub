import { Request, Response, NextFunction } from 'express';
import { AddParentLinkInput, RemoveParentLinkInput, GetRelatedUsersInput } from '../validations/parentValidations';
export declare const addParentLinkHandler: (req: Request<{}, {}, AddParentLinkInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeParentLinkHandler: (req: Request<RemoveParentLinkInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChildrenHandler: (req: Request<GetRelatedUsersInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getParentsHandler: (req: Request<GetRelatedUsersInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=parentController.d.ts.map