/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express'; // Ensure Express types are imported
import { DevelopmentPlanService } from '../services/DevelopmentPlanService'; // Import the service
// import { NotFoundError, AuthorizationError } from '../errors/serviceErrors'; // Commented: Assuming these exist later
// import { AuthenticatedUser } from '@hockey-hub/types'; // Use shared type for now - Commented
// import { ListDevelopmentPlansQueryInput } from '../validations/developmentPlanValidations'; // Import validation type - Commented out
import { ParsedQs } from 'qs'; // Import ParsedQs for query typing
import { CreateDevelopmentPlanInput, UpdateDevelopmentPlanInput, CreateDevelopmentPlanItemInput, UpdateDevelopmentPlanItemInput } from '../validation/developmentPlanSchemas';
import { checkPlayerAccess } from '../services/authzService'; // Use authz service
// Import custom errors
import { AuthorizationError, AuthenticationError } from '../errors/serviceErrors';

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

// Helper to extract token
const extractAuthToken = (req: Request): string | undefined => {
    return req.headers.authorization?.split(' ')[1];
};

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
            // Use AuthorizationError
            throw new AuthorizationError('User organization not found.'); 
        }
        
        if(!organizationId){
            // Use AuthorizationError
            throw new AuthorizationError('Organization ID is required to list development plans.'); 
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

// Keep this function as it was (just returns 501) - NOW IMPLEMENTED
export const deleteDevelopmentPlanItem = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    const { planId, itemId } = req.params;
    const user = req.user as any; // Use 'any' temporarily
    const organizationId = user?.organizationId;
    const authToken = extractAuthToken(req);

    if (!organizationId || !user?.id || !authToken) {
        // Use AuthenticationError
        return next(new AuthenticationError('User context or token missing.')); 
    }

    try {
        // Authorization: Can the user modify this plan?
        const plan = await planService.getDevelopmentPlanById(planId, organizationId);
        // More specific check: Can user manage development plans for this player?
        const canAccess = await checkPlayerAccess(user.id, plan.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
        if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to delete items from this plan.'); 
        }

        await planService.deleteItem(planId, itemId, organizationId);
        // Service now throws NotFoundError if item not found during delete
        // if (!deleted) {
        //     return res.status(404).json({ error: true, code: 'ITEM_NOT_FOUND', message: 'Development plan item not found.' });
        // }
        res.status(200).json({ success: true, message: 'Development plan item deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Add Stubs for other handlers mentioned in routes ---
// --- Now implement the previously stubbed handlers ---

export const getDevelopmentPlanById = async (req: Request, res: Response, next: NextFunction) => {
     const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const planId = req.params.planId;
        const organizationId = user?.organizationId;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.')); 
        }

        // Admin can view any plan in any org, otherwise scope to user's org
        const orgIdToCheck = user?.roles.includes('admin') ? undefined : organizationId;
        const plan = await planService.getDevelopmentPlanById(planId, orgIdToCheck);

        // Authorization: Check if user can access this specific plan
        // Admins/Club Admins can view any in their org.
        // Coaches/Players/Parents need specific access check based on the player the plan belongs to.
        if (!user?.roles.includes('admin') && !user?.roles.includes('club_admin')) {
             const canAccess = await checkPlayerAccess(user.id, plan.playerId, 'player:readDevelopmentPlan', authToken, plan.organizationId);
             if (!canAccess) {
                  // Use AuthorizationError
                  throw new AuthorizationError('Insufficient permissions to view this development plan.'); 
             }
        }
        // If we reach here, access is granted.
        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        // Specific known errors (NotFoundError, AuthorizationError) are already handled by their constructors if needed.
        // The global error handler will catch and log other unexpected errors.
        next(error);
    }
};

export const createDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
     const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const organizationId = user?.organizationId;
        const createdByUserId = user?.id;
        const teamId = user?.teamIds?.[0]; // Assuming user might belong to a team context
        const authToken = extractAuthToken(req);
        const validatedData = req.body as CreateDevelopmentPlanInput;

        if (!organizationId || !createdByUserId || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.'));
        }

        // Authorization: Can user create plans for this player?
        const canAccess = await checkPlayerAccess(createdByUserId, validatedData.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
        if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to create a plan for this player.'); 
        }

        const plan = await planService.createPlan(validatedData, organizationId, createdByUserId, teamId);
        res.status(201).json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

export const updateDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const organizationId = user?.organizationId;
        const planId = req.params.planId;
        const validatedData = req.body as UpdateDevelopmentPlanInput;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.')); 
        }

        // Authorization: Check if user can update THIS plan
        // Fetch the plan first to check ownership/player access
        const existingPlan = await planService.getDevelopmentPlanById(planId, organizationId);
        const canAccess = await checkPlayerAccess(user.id, existingPlan.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
         if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to update this plan.'); 
        }

        const plan = await planService.updatePlan(planId, organizationId, validatedData);
        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

export const deleteDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
     const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const organizationId = user?.organizationId;
        const planId = req.params.planId;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.'));
        }

        // Authorization: Check if user can delete THIS plan
        const existingPlan = await planService.getDevelopmentPlanById(planId, organizationId);
        const canAccess = await checkPlayerAccess(user.id, existingPlan.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
         if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to delete this plan.'); 
        }

        // Service method now throws NotFoundError if delete affects 0 rows
        await planService.deletePlan(planId, organizationId);
        // if (!deleted) {
        //      return res.status(404).json({ error: true, code: 'PLAN_NOT_FOUND', message: 'Development plan not found or delete failed.' });
        // }
        res.status(200).json({ success: true, message: 'Development plan deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

export const addDevelopmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
     const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const organizationId = user?.organizationId;
        const planId = req.params.planId;
        const validatedData = req.body as CreateDevelopmentPlanItemInput;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.')); 
        }

        // Authorization: Check if user can add items to THIS plan
        const existingPlan = await planService.getDevelopmentPlanById(planId, organizationId);
        const canAccess = await checkPlayerAccess(user.id, existingPlan.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
        if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to add items to this plan.'); 
        }

        const item = await planService.addItem(planId, organizationId, validatedData);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

export const updateDevelopmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any; // Use 'any' temporarily
        const organizationId = user?.organizationId;
        const { planId, itemId } = req.params;
        const validatedData = req.body as UpdateDevelopmentPlanItemInput;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            // Use AuthenticationError
            return next(new AuthenticationError('User context or token missing.')); 
        }

        // Authorization: Check if user can update items in THIS plan
        const existingPlan = await planService.getDevelopmentPlanById(planId, organizationId);
        const canAccess = await checkPlayerAccess(user.id, existingPlan.playerId, 'player:manageDevelopmentPlan', authToken, organizationId);
         if (!canAccess) {
            // Use AuthorizationError
            throw new AuthorizationError('Insufficient permissions to update items in this plan.'); 
        }

        // Service method throws NotFoundError if item doesn't exist for plan
        const item = await planService.updateItem(planId, itemId, organizationId, validatedData);
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// --- NEW: List Development Plan Items ---

export const listDevelopmentPlanItemsHandler = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any;
        const organizationId = user?.organizationId;
        const { planId } = req.params;
        const authToken = extractAuthToken(req);

        if (!organizationId || !user?.id || !authToken) {
            return next(new AuthenticationError('User context or token missing.'));
        }

        // Ensure the user can access this plan (re-use existing helper for authorization)
        const plan = await planService.getDevelopmentPlanById(planId, organizationId);

        if (!user?.roles.includes('admin') && !user?.roles.includes('club_admin')) {
            const canAccess = await checkPlayerAccess(user.id, plan.playerId, 'player:readDevelopmentPlan', authToken, organizationId);
            if (!canAccess) {
                throw new AuthorizationError('Insufficient permissions to view items for this plan.');
            }
        }

        const items = await planService.listItems(planId, organizationId);
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        next(error);
    }
};

// deleteDevelopmentPlanItem already exists

// --- New handlers to support GET endpoints ---

export const listDevelopmentPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any;
        const organizationId = user?.organizationId;
        if (!organizationId) {
            return next(new AuthenticationError('Organization context missing'));
        }
        const { page = '1', limit = '20', teamId, playerId, status, sort, order } = req.query;
        const options = {
            page: Number(page),
            limit: Number(limit),
            organizationId,
            teamId: teamId as string | undefined,
            playerId: playerId as string | undefined,
            status: status as string | undefined,
            sort: sort as string | undefined,
            order: (order as 'asc' | 'desc') || 'desc',
        };
        const { plans, total } = await planService.listDevelopmentPlans(options);
        res.status(200).json({ success: true, data: plans, meta: { total, page: options.page, limit: options.limit } });
    } catch (err) {
        next(err);
    }
};

export const getDevelopmentPlanPublic = async (req: Request, res: Response, next: NextFunction) => {
    const planService = new DevelopmentPlanService();
    try {
        const user = req.user as any;
        const organizationId = user?.organizationId;
        const planId = req.params.planId;
        const plan = await planService.getDevelopmentPlanById(planId, organizationId);
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        next(err);
    }
};