import { Request, Response, NextFunction } from 'express';
export declare const getTreatmentPlans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addTreatmentPlan: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTreatmentPlanHandler: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTreatmentPlanHandler: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=treatmentPlanController.d.ts.map