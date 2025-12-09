import { Router, Request, Response, NextFunction, type Router as ExpressRouter } from 'express';
import { AppDataSource } from '../config/database';
import { EquipmentInventoryService } from '../services/EquipmentInventoryService';
import { EquipmentReservationService } from '../services/EquipmentReservationService';
import { EquipmentAvailabilityService } from '../services/EquipmentAvailabilityService';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';
import { 
  CreateEquipmentItemDto, 
  UpdateEquipmentItemDto, 
  EquipmentFilterDto,
  CreateEquipmentReservationDto,
  BulkReservationDto,
  UpdateReservationStatusDto,
  CheckInOutDto,
  AvailabilityCheckDto,
  BulkAvailabilityCheckDto,
  CreateFacilityEquipmentConfigDto,
  UpdateFacilityEquipmentConfigDto
} from '../dto/equipment.dto';
import { EquipmentStatus } from '../entities/EquipmentItem';

const router: ExpressRouter = Router();
const inventoryService = new EquipmentInventoryService();
const reservationService = new EquipmentReservationService();
const availabilityService = new EquipmentAvailabilityService();

// Apply authentication to all routes
router.use(authenticate);

// Middleware to check database connection
const checkDatabase = (req: Request, res: Response, next: NextFunction) => {
  if (!AppDataSource.isInitialized) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database service unavailable',
      message: 'Please ensure the database is created and running'
    });
  }
  next();
};

// ===== EQUIPMENT INVENTORY ROUTES =====

// Get all equipment with filters and pagination
router.get('/inventory', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const filter = req.query as unknown as EquipmentFilterDto;
      const result = await inventoryService.findAll(filter);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: result.total,
          pages: Math.ceil(result.total / (filter.limit || 20))
        }
      });
    } catch (error) {
      console.error('Error fetching equipment inventory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch equipment inventory',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get equipment by ID
router.get('/inventory/:id', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const equipment = await inventoryService.findById(id);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Create new equipment item
router.post('/inventory', 
  authorize(['admin', 'equipment_manager']), 
  validationMiddleware(CreateEquipmentItemDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as CreateEquipmentItemDto;
      const userId = (req as any).user.id;
      
      const equipment = await inventoryService.create(dto, userId);

      res.status(201).json({
        success: true,
        data: equipment,
        message: 'Equipment item created successfully'
      });
    } catch (error) {
      console.error('Error creating equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update equipment item
router.put('/inventory/:id', 
  authorize(['admin', 'equipment_manager']), 
  validationMiddleware(UpdateEquipmentItemDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateEquipmentItemDto;
      const userId = (req as any).user.id;
      
      const equipment = await inventoryService.update(id, dto, userId);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        data: equipment,
        message: 'Equipment item updated successfully'
      });
    } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update equipment status
router.patch('/inventory/:id/status', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = (req as any).user.id;

      if (!Object.values(EquipmentStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid equipment status'
        });
      }
      
      const equipment = await inventoryService.updateStatus(id, status, userId, notes);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        data: equipment,
        message: 'Equipment status updated successfully'
      });
    } catch (error) {
      console.error('Error updating equipment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update equipment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Delete equipment item (soft delete)
router.delete('/inventory/:id', 
  authorize(['admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      const success = await inventoryService.delete(id, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        message: 'Equipment item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get equipment summary for facility
router.get('/inventory/facility/:facilityId/summary', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { facilityId } = req.params;
      const summary = await inventoryService.getEquipmentSummary(facilityId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching equipment summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch equipment summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ===== AVAILABILITY ROUTES =====

// Check equipment availability
router.post('/availability/check', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  validationMiddleware(AvailabilityCheckDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as AvailabilityCheckDto;
      const availability = await availabilityService.checkAvailability(dto);

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Bulk availability check
router.post('/availability/bulk-check', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  validationMiddleware(BulkAvailabilityCheckDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as BulkAvailabilityCheckDto;
      const availability = await availabilityService.checkBulkAvailability(dto);

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error checking bulk availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check bulk availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get real-time availability for facility
router.get('/availability/facility/:facilityId/realtime', 
  authorize(['physical_trainer', 'coach', 'admin', 'equipment_manager']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { facilityId } = req.params;
      const availability = await availabilityService.getRealTimeAvailability(facilityId);

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error fetching real-time availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch real-time availability',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ===== RESERVATION ROUTES =====

// Create equipment reservation
router.post('/reserve', 
  authorize(['physical_trainer', 'coach', 'admin']), 
  validationMiddleware(CreateEquipmentReservationDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as CreateEquipmentReservationDto;
      const userId = (req as any).user.id;
      
      const reservation = await reservationService.createReservation(dto, userId);

      res.status(201).json({
        success: true,
        data: reservation,
        message: 'Equipment reserved successfully'
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create reservation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Create bulk reservations
router.post('/reserve/bulk', 
  authorize(['physical_trainer', 'coach', 'admin']), 
  validationMiddleware(BulkReservationDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const dto = req.body as BulkReservationDto;
      const userId = (req as any).user.id;
      
      const reservations = await reservationService.createBulkReservations(dto, userId);

      res.status(201).json({
        success: true,
        data: reservations,
        message: `${reservations.length} equipment reservations created successfully`
      });
    } catch (error) {
      console.error('Error creating bulk reservations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create bulk reservations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get reservations by session
router.get('/reserve/session/:sessionId', 
  authorize(['physical_trainer', 'coach', 'admin', 'player']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const reservations = await reservationService.findBySession(sessionId);

      res.json({
        success: true,
        data: reservations
      });
    } catch (error) {
      console.error('Error fetching session reservations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session reservations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update reservation status
router.patch('/reserve/:id/status', 
  authorize(['physical_trainer', 'coach', 'admin']), 
  validationMiddleware(UpdateReservationStatusDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateReservationStatusDto;
      const userId = (req as any).user.id;
      
      const reservation = await reservationService.updateStatus(id, dto, userId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({
        success: true,
        data: reservation,
        message: 'Reservation status updated successfully'
      });
    } catch (error) {
      console.error('Error updating reservation status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update reservation status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Check in equipment
router.post('/reserve/:id/checkin', 
  authorize(['physical_trainer', 'coach', 'admin', 'player']), 
  validationMiddleware(CheckInOutDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = req.body as CheckInOutDto;
      const userId = (req as any).user.id;
      
      const reservation = await reservationService.checkIn(id, dto, userId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({
        success: true,
        data: reservation,
        message: 'Equipment checked in successfully'
      });
    } catch (error) {
      console.error('Error checking in equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check in equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Check out equipment
router.post('/reserve/:id/checkout', 
  authorize(['physical_trainer', 'coach', 'admin', 'player']), 
  validationMiddleware(CheckInOutDto),
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = req.body as CheckInOutDto;
      const userId = (req as any).user.id;
      
      const reservation = await reservationService.checkOut(id, dto, userId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({
        success: true,
        data: reservation,
        message: 'Equipment checked out successfully'
      });
    } catch (error) {
      console.error('Error checking out equipment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check out equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Cancel reservation
router.delete('/reserve/:id', 
  authorize(['physical_trainer', 'coach', 'admin']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user.id;
      
      const reservation = await reservationService.cancelReservation(id, userId, reason);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({
        success: true,
        data: reservation,
        message: 'Reservation cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel reservation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ===== CONFLICT CHECKING ROUTES =====

// Check for equipment conflicts
router.get('/conflicts', 
  authorize(['physical_trainer', 'coach', 'admin']), 
  checkDatabase,
  async (req: Request, res: Response) => {
    try {
      const { equipmentItemId, startTime, endTime, excludeReservationId } = req.query;
      
      if (!equipmentItemId || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: equipmentItemId, startTime, endTime'
        });
      }

      const conflicts = await reservationService.checkConflicts(
        equipmentItemId as string,
        new Date(startTime as string),
        new Date(endTime as string),
        excludeReservationId as string
      );

      res.json({
        success: true,
        data: conflicts
      });
    } catch (error) {
      console.error('Error checking conflicts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check conflicts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;