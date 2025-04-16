/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express'; // Ensure Express types are imported
import * as PlanRepository from '../repositories/developmentPlanRepository';
import { DevelopmentPlan } from '../types/planning'; 
import { checkPlayerAccess } from '../services/authzService'; 
import { 
    CreateDevelopmentPlanInput, 
    UpdateDevelopmentPlanInput,
    CreateDevelopmentPlanItemInput,
    UpdateDevelopmentPlanItemInput 
} from '../validation/developmentPlanSchemas';

// TODO: Refine error handling

export const getDevelopmentPlans = async (req: Request, res: Response, next: NextFunction) => {
    // ... (Authorization Logic) ...

    // Use parseInt correctly
    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1; 
    const offset = (pageNum - 1) * limitNum;

    try {
        const plans = await PlanRepository.findDevelopmentPlans(filters, limitNum, offset);
        const total = await PlanRepository.countDevelopmentPlans(filters);
        res.status(200).json({ 
            success: true, 
            data: plans,
            meta: { pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }
         });
    } catch (error) {
        next(error);
    }
};

// ... deleteDevelopmentPlanItem function ...
export const deleteDevelopmentPlanItem = async (req: Request, res: Response, _next: NextFunction) => {
    const { planId, itemId } = req.params;
    // TODO: Authorization: Check access to parent plan
    // TODO: Implement repository function and logic
    res.status(501).json({ message: `DELETE /development-plans/${planId}/items/${itemId} Not Implemented Yet`});
};