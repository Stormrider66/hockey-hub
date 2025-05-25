import { Request, Response, NextFunction } from 'express';
import * as playerAvailabilityRepository from '../repositories/playerAvailabilityRepository';

export const getAvailability = async (req: Request, res: Response, next: NextFunction) => {
  const { playerId } = req.params;
  try {
    const status = await playerAvailabilityRepository.getCurrentAvailability(playerId);
    if (!status) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Availability status not found' });
    }
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

export const setAvailability = async (req: any, res: Response, next: NextFunction) => {
  const { playerId } = req.params;
  const data = req.body as {
    currentStatus: string;
    notes?: string;
    effectiveFrom?: string;
    expectedEndDate?: string;
    injuryId?: string;
  };

  if (!data.currentStatus) {
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: currentStatus' });
  }

  try {
    const user = req.user as any;
    const updatedByUserId = user.id;
    const teamId = Array.isArray(user.teamIds) ? user.teamIds[0] : user.teamId;
    const effectiveFrom = data.effectiveFrom || new Date().toISOString().split('T')[0];

    const created = await playerAvailabilityRepository.createAvailabilityStatus({
      playerId,
      currentStatus: data.currentStatus,
      notes: data.notes,
      effectiveFrom,
      expectedEndDate: data.expectedEndDate,
      injuryId: data.injuryId,
      updatedByUserId,
      teamId,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}; 