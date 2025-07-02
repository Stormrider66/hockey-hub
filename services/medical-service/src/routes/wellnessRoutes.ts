import { Router, Request, Response } from 'express';
import { authenticate, authorize, validationMiddleware, parsePaginationParams } from '@hockey-hub/shared-lib';
import { CreateWellnessEntryDto } from '@hockey-hub/shared-lib';
import { CachedMedicalService } from '../services/CachedMedicalService';
import { CachedWellnessRepository } from '../repositories/CachedWellnessRepository';
const router = Router();
const medicalService = new CachedMedicalService();
const wellnessRepository = new CachedWellnessRepository();

// Apply authentication to all routes
router.use(authenticate);

// Submit wellness entry
router.post('/players/:playerId/wellness', authorize(['player', 'medical_staff', 'admin']), validationMiddleware(CreateWellnessEntryDto), async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const wellnessData = {
      ...req.body,
      playerId: parseInt(playerId)
    };
    
    const entry = await medicalService.submitWellnessEntry(wellnessData);
    
    res.status(201).json({
      success: true,
      message: 'Wellness data submitted successfully',
      data: entry
    });
  } catch (error) {
    console.error('Error submitting wellness:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit wellness data'
    });
  }
});

// Get wellness history for a player with pagination
router.get('/players/:playerId/wellness', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });
    
    const result = await wellnessRepository.findByPlayerIdPaginated(
      parseInt(playerId),
      paginationParams
    );
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.pages,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev
      }
    });
  } catch (error) {
    console.error('Error fetching wellness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellness data'
    });
  }
});

// Get latest wellness entry for a player
router.get('/players/:playerId/wellness/latest', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const wellness = await wellnessRepository.findLatestByPlayerId(parseInt(playerId));
    
    res.json({
      success: true,
      data: wellness
    });
  } catch (error) {
    console.error('Error fetching latest wellness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest wellness data'
    });
  }
});

// Get wellness data for date range with pagination
router.get('/players/:playerId/wellness/range', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });
    
    const result = await wellnessRepository.findByPlayerIdAndDateRangePaginated(
      parseInt(playerId),
      new Date(startDate as string),
      new Date(endDate as string),
      paginationParams
    );
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.pages,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev
      }
    });
  } catch (error) {
    console.error('Error fetching wellness range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellness data for date range'
    });
  }
});

// Get team wellness summary
router.get('/team/wellness/summary', authorize(['medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
  try {
    const summary = await wellnessRepository.getTeamWellnessSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching team wellness summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team wellness summary'
    });
  }
});

export default router;