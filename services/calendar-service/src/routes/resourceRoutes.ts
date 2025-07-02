import { Router } from 'express';
import { CachedResourceService } from '../services/CachedResourceService';
import { ResourceType, ResourceStatus } from '../entities';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateResourceDto, UpdateResourceDto, CheckResourceAvailabilityDto, CreateResourceBookingDto, ApproveBookingDto, CancelBookingDto } from '@hockey-hub/shared-lib';

const router = Router();
const resourceService = new CachedResourceService();

// Apply authentication to all routes
router.use(authenticate);

// Get all resources with filters
router.get('/', async (req, res) => {
  try {
    const {
      organizationId,
      type,
      status,
      location,
      minCapacity,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const filters = {
      organizationId: organizationId as string,
      type: type as ResourceType,
      status: status as ResourceStatus,
      location: location as string,
      minCapacity: minCapacity ? parseInt(minCapacity as string) : undefined,
      search: search as string,
    };

    const result = await resourceService.getResources(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
    });
  }
});

// Check resource availability
router.post('/check-availability', validationMiddleware(CheckResourceAvailabilityDto), async (req, res) => {
  try {
    const { resourceId, startTime, endTime, excludeBookingId } = req.body;

    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'resourceId, startTime, and endTime are required',
      });
    }

    const available = await resourceService.checkAvailability({
      resourceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      excludeBookingId,
    });

    res.json({
      success: true,
      available,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
    });
  }
});

// Get resource availability for date range
router.get('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const availability = await resourceService.getResourceAvailability(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability',
    });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  }
});

// Create resource
router.post('/', authorize(['equipment_manager', 'club_admin', 'admin']), validationMiddleware(CreateResourceDto), async (req, res) => {
  try {
    const resource = await resourceService.createResource(req.body);
    res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
    });
  }
});

// Update resource
router.put('/:id', authorize(['equipment_manager', 'club_admin', 'admin']), validationMiddleware(UpdateResourceDto), async (req, res) => {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.body);
    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
    });
  }
});

// Delete resource
router.delete('/:id', authorize(['equipment_manager', 'club_admin', 'admin']), async (req, res) => {
  try {
    await resourceService.deleteResource(req.params.id);
    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
    });
  }
});

// Create booking for resource
router.post('/:id/bookings', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(CreateResourceBookingDto), async (req, res) => {
  try {
    const { eventId, startTime, endTime, bookedBy, purpose } = req.body;

    if (!eventId || !startTime || !endTime || !bookedBy) {
      return res.status(400).json({
        success: false,
        message: 'eventId, startTime, endTime, and bookedBy are required',
      });
    }

    const booking = await resourceService.createBooking(
      req.params.id,
      eventId,
      new Date(startTime),
      new Date(endTime),
      bookedBy,
      purpose
    );

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
});

// Approve booking
router.post('/bookings/:bookingId/approve', authorize(['equipment_manager', 'club_admin', 'admin']), validationMiddleware(ApproveBookingDto), async (req, res) => {
  try {
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'approvedBy is required',
      });
    }

    const booking = await resourceService.approveBooking(
      req.params.bookingId,
      approvedBy
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
    });
  }
});

// Cancel booking
router.post('/bookings/:bookingId/cancel', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(CancelBookingDto), async (req, res) => {
  try {
    const { cancelledBy, reason } = req.body;

    if (!cancelledBy) {
      return res.status(400).json({
        success: false,
        message: 'cancelledBy is required',
      });
    }

    const booking = await resourceService.cancelBooking(
      req.params.bookingId,
      cancelledBy,
      reason
    );

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
});

export default router;