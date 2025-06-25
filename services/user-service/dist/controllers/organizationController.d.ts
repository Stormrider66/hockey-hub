import { Request, Response, NextFunction } from 'express';
import { GetOrganizationInput, CreateOrganizationInput, UpdateOrganizationInput } from '../validations/organizationValidations';
interface ProcessedListOrgsQuery {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'inactive' | 'trial';
    sort: 'name' | 'createdAt';
    order: 'asc' | 'desc';
}
export declare const listOrganizationsHandler: (req: Request<{}, {}, {}, ProcessedListOrgsQuery>, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrganizationHandler: (req: Request<GetOrganizationInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createOrganizationHandler: (req: Request<{}, {}, CreateOrganizationInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateOrganizationHandler: (req: Request<UpdateOrganizationInput['params'], {}, UpdateOrganizationInput['body']>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteOrganizationHandler: (req: Request<GetOrganizationInput>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=organizationController.d.ts.map