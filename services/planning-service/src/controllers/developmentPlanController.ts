/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express'; // Ensure Express types are imported
import { DevelopmentPlanService } from '../services/DevelopmentPlanService'; // Import the service
// import { NotFoundError, AuthorizationError } from '../errors/serviceErrors'; // Commented: Assuming these exist later
// import { AuthenticatedUser } from '@hockey-hub/types'; // Use shared type for now - Commented
// import { ListDevelopmentPlansQueryInput } from '../validations/developmentPlanValidations'; // Import validation type - Commented out
import { ParsedQs } from 'qs'; // Import ParsedQs for query typing

// Define the expected structure of query params AFTER validation/transformation
interface ProcessedListDevPlansQuery {
    page: number;
    limit: number;
    teamId?: string;
    playerId?: string;
    status?: string; 
    sort: string;
    order: 'asc' | 'desc';
    organizationId: string; // Added required organizationId
}

// TODO: Refine error handling

export const getDevelopmentPlans = async (req: Request<{}, any, any, ParsedQs>, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        // Cast to validated/processed type after validation middleware runs
        const query = req.query as unknown as ProcessedListDevPlansQuery;

        // Authorization/Filtering based on user role
        let organizationId = user?.organizationId; // Add optional chaining
        if (user?.roles.includes('admin')) { // Add optional chaining
            // Allow admin to filter by orgId from query, otherwise default to their own (if applicable)
            organizationId = query.organizationId || user?.organizationId; 
        } else if (!organizationId) {
            //  throw new AuthorizationError('User organization not found.'); // Commented out
             throw new Error('User organization not found.'); // Use generic Error for now
        }
        
        if(!organizationId){
            // throw new AuthorizationError('Organization ID is required to list development plans.'); // Commented out
            throw new Error('Organization ID is required to list development plans.'); // Use generic Error
        }

        const options = { 
            ...query,
            organizationId: organizationId, // Use determined organization ID
        };

        const { plans, total } = await planService.listDevelopmentPlans(options);
        
        res.status(200).json({ 
            success: true, 
            data: plans,
            meta: { 
                total, 
                page: options.page, 
                limit: options.limit, 
                pages: Math.ceil(total / options.limit) 
            }
         });
    } catch (error) {
        next(error);
    }
};

// Keep this function as it was (just returns 501)
export const deleteDevelopmentPlanItem = async (req: Request, res: Response, _next: NextFunction) => {
    const { planId, itemId } = req.params;
    // TODO: Authorization: Check access to parent plan
    // TODO: Implement repository function and logic
    res.status(501).json({ message: `DELETE /development-plans/${planId}/items/${itemId} Not Implemented Yet`});
};

// --- Add Stubs for other handlers mentioned in routes ---

export const getDevelopmentPlanById = async (req: Request, res: Response, next: NextFunction) => {
     const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const planId = req.params.planId;
        const plan = await planService.getDevelopmentPlanById(planId);

        // Authorization: Check if user can access this specific plan
        if (user?.roles.includes('admin')) { // Add optional chaining
             // Admin access ok
        } else if (user?.organizationId !== plan.organizationId) { // Add optional chaining
            // throw new AuthorizationError('Cannot access plan outside your organization.'); // Commented out
            throw new Error('Cannot access plan outside your organization.'); // Use generic Error
        } 

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        // Check error type more safely
        if (error instanceof Error) {
             if (error.name === 'NotFoundError') { // Check name if custom errors aren't imported
                 return res.status(404).json({ error: true, message: error.message, code: 'PLAN_NOT_FOUND' });
             }
             if (error.name === 'AuthorizationError') {
                 return res.status(403).json({ error: true, message: error.message, code: 'FORBIDDEN' });
             }
        }
        // Log unknown errors
        console.error('Unknown error in getDevelopmentPlanById:', error);
        next(error);
    }
};

export const createDevelopmentPlanHandler = async (_req: Request, res: Response, next: NextFunction) => {
     // const planService = new DevelopmentPlanService();
    try {
        // TODO: Authorization based on role (admin, club_admin, coach?)
        // TODO: Ensure organizationId in body matches user's org if not admin
        // const plan = await planService.createPlan(req.body);
         res.status(501).json({ message: 'POST /development-plans Not Implemented Yet'});
    } catch (error) {
        next(error);
    }
};

export const updateDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
    // const planService = new DevelopmentPlanService();
    try {
        const planId = req.params.planId;
        // TODO: Authorization check (can update THIS plan?)
        // const plan = await planService.updatePlan(planId, req.body);
         res.status(501).json({ message: `PUT /development-plans/${planId} Not Implemented Yet`});
    } catch (error) {
        next(error);
    }
};

export const deleteDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
     // const planService = new DevelopmentPlanService();
    try {
        const planId = req.params.planId;
        // TODO: Authorization check (can delete THIS plan? Typically admin/club_admin)
        // await planService.deletePlan(planId);
         res.status(501).json({ message: `DELETE /development-plans/${planId} Not Implemented Yet`});
    } catch (error) {
        next(error);
    }
};

export const addDevelopmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
     // const planService = new DevelopmentPlanService();
    try {
        const planId = req.params.planId;
        // TODO: Authorization check (can add items to THIS plan?)
        // const item = await planService.addItem(planId, req.body);
         res.status(501).json({ message: `POST /development-plans/${planId}/items Not Implemented Yet`});
    } catch (error) {
        next(error);
    }
};

export const updateDevelopmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    // const planService = new DevelopmentPlanService();
    try {
        const { planId, itemId } = req.params;
        // TODO: Authorization check (can update items in THIS plan?)
        // const item = await planService.updateItem(planId, itemId, req.body);
         res.status(501).json({ message: `PUT /development-plans/${planId}/items/${itemId} Not Implemented Yet`});
    } catch (error) {
        next(error);
    }
};

// deleteDevelopmentPlanItem already exists