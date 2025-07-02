import { Router } from 'express';
import { authenticate, authorize, validationMiddleware, parsePaginationParams } from '@hockey-hub/shared-lib';
import { CreateInjuryDto, UpdateInjuryDto } from '@hockey-hub/shared-lib';
import { CachedMedicalService } from '../services/CachedMedicalService';
import { CachedInjuryRepository } from '../repositories/CachedInjuryRepository';

const router = Router();
const medicalService = new CachedMedicalService();
const injuryRepository = new CachedInjuryRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all injuries with pagination
router.get('/', authorize(['medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const paginationParams = parsePaginationParams(req.query, { 
      page: 1, 
      limit: 20, 
      maxLimit: 100 
    });
    
    const result = await injuryRepository.findAllPaginated(paginationParams);
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.pages
      }
    });
  } catch (error) {
    console.error('Error fetching injuries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch injuries'
    });
  }
});

// Get active injuries with pagination
router.get('/active', authorize(['medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const paginationParams = parsePaginationParams(req.query, { 
      page: 1, 
      limit: 20, 
      maxLimit: 100 
    });
    
    const result = await injuryRepository.findActiveInjuriesPaginated(paginationParams);
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.pages
      }
    });
  } catch (error) {
    console.error('Error fetching active injuries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active injuries'
    });
  }
});

// Get injury by ID
router.get('/:id', authorize(['medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const { id } = req.params;
    const injury = await injuryRepository.findById(parseInt(id));
    
    if (!injury) {
      return res.status(404).json({
        success: false,
        message: 'Injury not found'
      });
    }
    
    res.json({
      success: true,
      data: injury
    });
  } catch (error) {
    console.error('Error fetching injury:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch injury'
    });
  }
});

// Get injuries by player ID with pagination
router.get('/player/:playerId', authorize(['medical_staff', 'admin', 'coach', 'player', 'parent']), async (req, res) => {
  try {
    const { playerId } = req.params;
    const paginationParams = parsePaginationParams(req.query, { 
      page: 1, 
      limit: 20, 
      maxLimit: 100 
    });
    
    const result = await injuryRepository.findByPlayerIdPaginated(parseInt(playerId), paginationParams);
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.pages
      }
    });
  } catch (error) {
    console.error('Error fetching player injuries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player injuries'
    });
  }
});

// Create new injury
router.post('/', authorize(['medical_staff', 'admin']), validationMiddleware(CreateInjuryDto), async (req, res) => {
  try {
    const injuryData = req.body;
    const injury = await medicalService.createInjury(injuryData);
    
    res.status(201).json({
      success: true,
      data: injury,
      message: 'Injury created successfully'
    });
  } catch (error) {
    console.error('Error creating injury:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create injury'
    });
  }
});

// Update injury
router.put('/:id', authorize(['medical_staff', 'admin']), validationMiddleware(UpdateInjuryDto), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const injury = await medicalService.updateInjury(parseInt(id), updates);
    
    res.json({
      success: true,
      data: injury,
      message: 'Injury updated successfully'
    });
  } catch (error) {
    console.error('Error updating injury:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update injury'
    });
  }
});

// Delete injury
router.delete('/:id', authorize(['medical_staff', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await injuryRepository.delete(parseInt(id));
    
    res.json({
      success: true,
      message: 'Injury deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting injury:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete injury'
    });
  }
});

// Get injury statistics by body part
router.get('/stats/body-parts', authorize(['medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const stats = await injuryRepository.countActiveByBodyPart();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching injury statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch injury statistics'
    });
  }
});

export default router;