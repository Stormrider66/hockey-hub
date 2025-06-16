import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organizationService';
import {
    // ListOrganizationsInput, // Use Processed type instead
    GetOrganizationInput,
    CreateOrganizationInput,
    UpdateOrganizationInput,
} from '../validations/organizationValidations';
// Import specific DTO if needed for query typing before processing
// import { ListOrganizationsQueryDto } from '../dtos/organization.dto'; 
import { NotFoundError, ConflictError, AuthorizationError } from '../errors/serviceErrors';
import { AuthenticatedUser } from '../middleware/authenticateToken';

// Define the expected structure of query params AFTER validation/transformation
interface ProcessedListOrgsQuery {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'inactive' | 'trial';
    sort: 'name' | 'createdAt';
    order: 'asc' | 'desc';
}

// --- Organization Handlers --- //

export const listOrganizationsHandler = async (
    req: Request<{}, {}, {}, ProcessedListOrgsQuery>, // Use Processed type for query
    res: Response,
    next: NextFunction
) => {
    const organizationService = new OrganizationService();
    try {
        // Authorization check handled by middleware
        const processedQuery = req.query as unknown as ProcessedListOrgsQuery; // Cast after validation
        const { organizations, total } = await organizationService.listOrganizations(processedQuery);
        res.status(200).json({ 
            success: true, 
            data: organizations, 
            meta: { 
                total, 
                page: processedQuery.page, 
                limit: processedQuery.limit,
                pages: Math.ceil(total / processedQuery.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getOrganizationHandler = async (
    req: Request<GetOrganizationInput>,
    res: Response,
    next: NextFunction
) => {
    const organizationService = new OrganizationService();
    try {
        const user = req.user as AuthenticatedUser;
        const targetOrganizationId = req.params.organizationId;

        // Authorization check: Admin or member of the organization?
        if (!user.roles.includes('admin') && user.organizationId !== targetOrganizationId) {
             // Need a way to check if user belongs via team/role if not club_admin
             // For now, restrict to admin or matching organizationId (for club_admin)
            throw new AuthorizationError('Cannot access this organization\'s details.');
        }
        
        // Fetch details including counts
        const organizationDetails = await organizationService.getOrganizationDetailsWithCounts(targetOrganizationId);
        res.status(200).json({ success: true, data: organizationDetails });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        if (error instanceof AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
};

export const createOrganizationHandler = async (
    req: Request<{}, {}, CreateOrganizationInput>,
    res: Response,
    next: NextFunction
) => {
    const organizationService = new OrganizationService();
    try {
        const user = req.user as AuthenticatedUser;
        // Authorization check already done by middleware (admin role required)
        const organization = await organizationService.createOrganization(req.body, user.userId!);
        res.status(201).json({ success: true, data: organization });
    } catch (error) {
        if (error instanceof ConflictError) {
            return res.status(409).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
};

export const updateOrganizationHandler = async (
    req: Request<UpdateOrganizationInput['params'], {}, UpdateOrganizationInput['body']>,
    res: Response,
    next: NextFunction
) => {
    const organizationService = new OrganizationService();
    try {
        const user = req.user as AuthenticatedUser;
        const targetOrganizationId = req.params.organizationId;

        // Authorization check: Admin or Club Admin of this specific organization?
         if (!user.roles.includes('admin') && !(user.roles.includes('club_admin') && user.organizationId === targetOrganizationId)) {
            throw new AuthorizationError('Not authorized to update this organization.');
        }
        
        // Prevent club_admin from changing status if that's a rule
        if (req.body.status && !user.roles.includes('admin')) {
            throw new AuthorizationError('Only system administrators can change organization status.');
        }

        const organization = await organizationService.updateOrganization(targetOrganizationId, req.body, user.userId!);
        res.status(200).json({ success: true, data: organization });
    } catch (error) {
         if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        if (error instanceof ConflictError || error instanceof AuthorizationError) {
            return res.status(error.statusCode).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
};

export const deleteOrganizationHandler = async (
    req: Request<GetOrganizationInput>,
    res: Response,
    next: NextFunction
) => {
    const organizationService = new OrganizationService();
    try {
        const user = req.user as AuthenticatedUser;
        // Authorization check already done by middleware (admin role required)

        await organizationService.deleteOrganization(req.params.organizationId, user.userId!);
        res.status(200).json({ success: true, message: 'Organization deleted successfully' });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        next(error);
    }
}; 