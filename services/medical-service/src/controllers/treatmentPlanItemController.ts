import { Request, Response, NextFunction } from 'express';
import * as TreatmentPlanItemRepository from '../repositories/treatmentPlanItemRepository';

export const getTreatmentPlanItems = async (req: Request, res: Response, next: NextFunction) => {
  const { planId } = req.params;
  try {
    const items = await TreatmentPlanItemRepository.findItemsByPlanId(planId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const addTreatmentPlanItem = async (req: Request, res: Response, next: NextFunction) => {
  const { planId } = req.params;
  const data = req.body as {
    description: string;
    frequency: string;
    duration: string;
    sets?: number;
    reps?: number;
    progressionCriteria?: string;
    exerciseId?: string;
    sequence: number;
  };

  if (!data.description || data.sequence === undefined) {
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: description, sequence' });
  }

  try {
    const newItem = await TreatmentPlanItemRepository.createTreatmentPlanItem({
      planId,
      description: data.description,
      frequency: data.frequency,
      duration: data.duration,
      sets: data.sets,
      reps: data.reps,
      progressionCriteria: data.progressionCriteria,
      exerciseId: data.exerciseId,
      sequence: data.sequence,
    });
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

export const updateTreatmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const data = req.body as Partial<{
    description: string;
    frequency: string;
    duration: string;
    sets?: number;
    reps?: number;
    progressionCriteria?: string;
    exerciseId?: string;
    sequence: number;
  }>;
  try {
    const updated = await TreatmentPlanItemRepository.updateTreatmentPlanItem(id, data);
    if (!updated) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan item not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTreatmentPlanItemHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const deleted = await TreatmentPlanItemRepository.deleteTreatmentPlanItem(id);
    if (!deleted) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan item not found' });
    }
    res.status(200).json({ success: true, message: 'Treatment plan item deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 