import { Request, Response, NextFunction } from 'express';
import * as TreatmentPlanRepository from '../repositories/treatmentPlanRepository';

export const getTreatmentPlans = async (req: Request, res: Response, next: NextFunction) => {
  const { injuryId } = req.params;
  try {
    const plans = await TreatmentPlanRepository.findPlansByInjuryId(injuryId);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const addTreatmentPlan = async (req: Request, res: Response, next: NextFunction) => {
  const { injuryId } = req.params;
  const userId = (req as any).user?.id;
  const data = req.body as {
    phase: string;
    description: string;
    expectedDuration: number;
    goals: string;
    precautions?: string;
  };

  if (!userId) {
    return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
  }
  if (!data.phase || !data.description || data.expectedDuration === undefined || !data.goals) {
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: phase, description, expectedDuration, goals' });
  }

  try {
    const newPlan = await TreatmentPlanRepository.createTreatmentPlan({
      injuryId,
      phase: data.phase,
      description: data.description,
      expectedDuration: data.expectedDuration,
      goals: data.goals,
      precautions: data.precautions,
      createdByUserId: userId,
    });
    res.status(201).json({ success: true, data: newPlan });
  } catch (error) {
    next(error);
  }
};

export const updateTreatmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const data = req.body as Partial<{
    phase: string;
    description: string;
    expectedDuration: number;
    goals: string;
    precautions?: string;
  }>
  try {
    const updated = await TreatmentPlanRepository.updateTreatmentPlan(id, {
      phase: data.phase,
      description: data.description,
      expectedDuration: data.expectedDuration,
      goals: data.goals,
      precautions: data.precautions,
    });
    if (!updated) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTreatmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const deleted = await TreatmentPlanRepository.deleteTreatmentPlan(id);
    if (!deleted) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan not found' });
    }
    res.status(200).json({ success: true, message: 'Treatment plan deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 