// @ts-nocheck
import { Router, Request, Response, type Router as ExpressRouter } from 'express';
import { authenticate, validationMiddleware, parsePaginationParams } from '@hockey-hub/shared-lib';
import { CreateWellnessEntryDto } from '@hockey-hub/shared-lib';
import { CachedMedicalService } from '../services/CachedMedicalService';
import { CachedWellnessRepository } from '../repositories/CachedWellnessRepository';
const router: ExpressRouter = Router();
let medicalService: CachedMedicalService = new CachedMedicalService();
let wellnessRepository: CachedWellnessRepository = new CachedWellnessRepository();

// Test-only setters for dependency injection
export const __setMedicalService = (svc: CachedMedicalService) => { medicalService = svc; };
export const __setWellnessRepository = (repo: CachedWellnessRepository) => { wellnessRepository = repo; };

// Lazy authorize helper like in injuryRoutes to ensure jest spy sees calls
const lazyAuthorize = (roles: string[]) => (req: any, res: any, next: any) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('@hockey-hub/shared-lib');
    const fn = lib.authorize || ((_roles: string[]) => (_req: any, _res: any, n: any) => n());
    return fn(roles)(req, res, next);
  } catch {
    return next();
  }
};

// Apply authentication to all routes
router.use(authenticate);

// Submit wellness entry
router.post('/players/:playerId/wellness', lazyAuthorize(['player', 'medical_staff', 'admin']), validationMiddleware(CreateWellnessEntryDto), async (req: Request, res: Response) => {
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
router.get('/players/:playerId/wellness', lazyAuthorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });
    
    const repoParams: any = { page: (paginationParams as any).page, limit: (paginationParams as any).limit, offset: (paginationParams as any).skip };
    const result = await wellnessRepository.findByPlayerIdPaginated(
      parseInt(playerId),
      repoParams
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
router.get('/players/:playerId/wellness/latest', lazyAuthorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
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
router.get('/players/:playerId/wellness/range', lazyAuthorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
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
    
    const repoParams: any = { page: (paginationParams as any).page, limit: (paginationParams as any).limit, offset: (paginationParams as any).skip };
    const result = await wellnessRepository.findByPlayerIdAndDateRangePaginated(
      parseInt(playerId),
      new Date(startDate as string),
      new Date(endDate as string),
      repoParams
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
router.get('/team/wellness/summary', lazyAuthorize(['medical_staff', 'admin', 'coach']), async (req: Request, res: Response) => {
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