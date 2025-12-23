// @ts-nocheck - Complex service with TypeORM issues
import { Router, type Router as ExpressRouter } from 'express';
import { authenticate, authorize, validationMiddleware, parsePaginationParams, createPaginationResponse } from '@hockey-hub/shared-lib';
import { CreatePlayerAvailabilityDto } from '@hockey-hub/shared-lib';
import { CachedPlayerAvailabilityRepository } from '../repositories/CachedPlayerAvailabilityRepository';
const router: ExpressRouter = Router();
const availabilityRepository = new CachedPlayerAvailabilityRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all player availability
router.get('/', authorize(['medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const availability = await availabilityRepository.findAll();
    // Pagination
    const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const total = availability.length;
    const data = availability.slice(skip, skip + limit);
    const paged = createPaginationResponse(data, page, limit, total);
    // Preserve existing keys; include pagination info additionally
    res.json({ success: true, data: paged.data, total: paged.total, page: paged.page, limit: paged.pageSize, totalPages: Math.max(1, Math.ceil(paged.total / paged.pageSize)) });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player availability'
    });
  }
});

// Get availability for specific player
router.get('/players/:playerId', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const { playerId } = req.params;
    const availability = await availabilityRepository.findByPlayerId(parseInt(playerId));
    const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 20, maxLimit: 100 });
    const total = availability.length;
    const data = availability.slice(skip, skip + limit);
    const paged = createPaginationResponse(data, page, limit, total);
    res.json({ success: true, data: paged.data, total: paged.total, page: paged.page, limit: paged.pageSize, totalPages: Math.max(1, Math.ceil(paged.total / paged.pageSize)) });
  } catch (error) {
    console.error('Error fetching player availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player availability'
    });
  }
});

// Get current availability for specific player
router.get('/players/:playerId/current', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const { playerId } = req.params;
    const availability = await availabilityRepository.findCurrentByPlayerId(parseInt(playerId));
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching current player availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current player availability'
    });
  }
});

// Update player availability
router.post('/players/:playerId', authorize(['medical_staff', 'admin']), validationMiddleware(CreatePlayerAvailabilityDto), async (req, res) => {
  try {
    const { playerId } = req.params;
    const availabilityData = {
      ...req.body,
      playerId: parseInt(playerId)
    };
    
    const availability = await availabilityRepository.save(availabilityData);
    
    res.status(201).json({
      success: true,
      data: availability,
      message: 'Player availability updated successfully'
    });
  } catch (error) {
    console.error('Error updating player availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update player availability'
    });
  }
});

// Get team availability summary
router.get('/team/summary', authorize(['medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const summary = await availabilityRepository.getTeamAvailabilitySummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching team availability summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team availability summary'
    });
  }
});

export default router;