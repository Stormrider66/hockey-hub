import { Request, Response, NextFunction } from 'express';
import { CreateTeamInput, UpdateTeamInput, AddTeamMemberInput, RemoveTeamMemberInput, GetTeamInput } from '../validations/teamValidations';
import { ParsedQs } from 'qs';
export declare const createTeamHandler: (req: Request<{}, {}, CreateTeamInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTeamHandler: (req: Request<GetTeamInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTeamHandler: (req: Request<UpdateTeamInput['params'], {}, UpdateTeamInput['body']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTeamHandler: (req: Request<GetTeamInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addTeamMemberHandler: (req: Request<AddTeamMemberInput['params'], {}, AddTeamMemberInput['body']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeTeamMemberHandler: (req: Request<RemoveTeamMemberInput['params'], {}, {}, RemoveTeamMemberInput['query']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTeamMembersHandler: (req: Request<GetTeamInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listTeamsHandler: (req: Request<{}, {}, {}, ParsedQs>, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=teamController.d.ts.map