import { Request, Response, NextFunction } from 'express';
export declare const getTreatmentPlanItems: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addTreatmentPlanItem: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTreatmentPlanItemHandler: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTreatmentPlanItemHandler: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=treatmentPlanItemController.d.ts.map