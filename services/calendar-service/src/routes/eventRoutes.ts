import { Router } from 'express';
import { CachedEventService } from '../services/CachedEventService';
import { CalendarExportService } from '../services/calendarExportService';
import { EventType, EventStatus, ParticipantStatus } from '../entities';
import { parsePaginationParams, paginateArray, authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateEventDto, UpdateEventDto, CreateRecurringEventDto, CheckConflictsDto, UpdateParticipantStatusDto, BulkAddParticipantsDto } from '@hockey-hub/shared-lib';

const router = Router();
const eventService = new CachedEventService();

// Apply authentication to all routes
router.use(authenticate);

// Get all events with filters
router.get('/', async (req, res) => {
  try {
    const {
      organizationId,
      teamId,
      type,
      status,
      startDate,
      endDate,
      participantId,
      createdBy,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const filters = {
      organizationId: organizationId as string,
      teamId: teamId as string,
      type: type as EventType,
      status: status as EventStatus,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      participantId: participantId as string,
      createdBy: createdBy as string,
      search: search as string,
    };

    const result = await eventService.getEvents(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
});

// Get upcoming events for a user with pagination
router.get('/upcoming', async (req, res) => {
  try {
    const { userId, organizationId, days = '7' } = req.query;

    if (!userId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'userId and organizationId are required',
      });
    }
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });

    const events = await eventService.getUpcomingEvents(
      userId as string,
      organizationId as string,
      parseInt(days as string)
    );
    
    // Apply pagination to the results
    const result = paginateArray(events, paginationParams);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
    });
  }
});

// Get events by date range
router.get('/date-range', async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'organizationId, startDate, and endDate are required',
      });
    }

    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 50, // Larger default for date ranges
      maxLimit: 200
    });

    const events = await eventService.getEventsByDateRange(
      organizationId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    // Apply pagination to the results
    const result = paginateArray(events, paginationParams);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
});

// Check for conflicts
router.post('/check-conflicts', validationMiddleware(CheckConflictsDto), async (req, res) => {
  try {
    const { startTime, endTime, participantIds, excludeEventId } = req.body;

    if (!startTime || !endTime || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        message: 'startTime, endTime, and participantIds array are required',
      });
    }

    const conflicts = await eventService.checkConflicts(
      new Date(startTime),
      new Date(endTime),
      participantIds,
      excludeEventId
    );

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check conflicts',
    });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(404).json({
      success: false,
      message: 'Event not found',
    });
  }
});

// Create event
router.post('/', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(CreateEventDto), async (req, res) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
});

// Create recurring event
router.post('/recurring', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(CreateRecurringEventDto), async (req, res) => {
  try {
    const event = await eventService.createRecurringEvent(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error creating recurring event:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create recurring event',
    });
  }
});

// Get recurring event instances
router.get('/:id/instances', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const instances = await eventService.getRecurringEventInstances(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    console.error('Error fetching recurring instances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recurring instances',
    });
  }
});

// Update recurring event instance
router.put('/:id/instances/:instanceDate', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(UpdateEventDto), async (req, res) => {
  try {
    const { updateType = 'single' } = req.query;
    const updates = req.body;

    const result = await eventService.updateRecurringEventInstance(
      req.params.id,
      new Date(req.params.instanceDate),
      updates,
      updateType as 'single' | 'future' | 'all'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating recurring instance:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update recurring instance',
    });
  }
});

// Delete recurring event instance
router.delete('/:id/instances/:instanceDate', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), async (req, res) => {
  try {
    const { deleteType = 'single' } = req.query;

    await eventService.deleteRecurringEventInstance(
      req.params.id,
      new Date(req.params.instanceDate),
      deleteType as 'single' | 'future' | 'all'
    );

    res.json({
      success: true,
      message: `Recurring instance ${deleteType === 'single' ? 'deleted' : deleteType === 'future' ? 'and future instances deleted' : 'series deleted'} successfully`,
    });
  } catch (error) {
    console.error('Error deleting recurring instance:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete recurring instance',
    });
  }
});

// Update event
router.put('/:id', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(UpdateEventDto), async (req, res) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
});

// Delete event
router.delete('/:id', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
});

// Update participant status (RSVP)
router.post('/:id/participants/:participantId/status', validationMiddleware(UpdateParticipantStatusDto), async (req, res) => {
  try {
    const { status, responseMessage } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    const participant = await eventService.updateParticipantStatus(
      req.params.id,
      req.params.participantId,
      status as ParticipantStatus,
      responseMessage
    );

    res.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant status',
    });
  }
});

// Add participants to event
router.post('/:id/participants', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), validationMiddleware(BulkAddParticipantsDto), async (req, res) => {
  try {
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        message: 'participants array is required',
      });
    }

    const added = await eventService.addParticipants(req.params.id, participants);
    res.json({
      success: true,
      data: added,
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participants',
    });
  }
});

// Remove participant from event
router.delete('/:id/participants/:participantId', authorize(['coach', 'physical_trainer', 'medical_staff', 'equipment_manager', 'club_admin', 'admin']), async (req, res) => {
  try {
    await eventService.removeParticipant(req.params.id, req.params.participantId);
    res.json({
      success: true,
      message: 'Participant removed successfully',
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
    });
  }
});

// Export events
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const {
      organizationId,
      teamId,
      type,
      status,
      startDate,
      endDate,
      participantId,
      userId,
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    // Get events based on filters
    const filters = {
      organizationId: organizationId as string,
      teamId: teamId as string,
      type: type as EventType,
      status: status as EventStatus,
      startDate: startDate ? new Date(startDate as string) : new Date(),
      endDate: endDate ? new Date(endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
      participantId: participantId as string || userId as string,
    };

    const result = await eventService.getEvents(filters, 1, 1000); // Get up to 1000 events
    const events = result.data;

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'ics':
      case 'ical':
        content = CalendarExportService.generateICalendar(events);
        contentType = 'text/calendar';
        filename = 'hockey-hub-calendar.ics';
        break;

      case 'csv':
        content = CalendarExportService.generateCSV(events);
        contentType = 'text/csv';
        filename = 'hockey-hub-schedule.csv';
        break;

      case 'html':
      case 'pdf':
        content = CalendarExportService.generateHTML(events);
        contentType = 'text/html';
        filename = 'hockey-hub-schedule.html';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export format. Supported formats: ics, csv, html',
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Error exporting events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export events',
    });
  }
});

// Get calendar subscription URL
router.get('/subscribe', async (req, res) => {
  try {
    const {
      organizationId,
      teamId,
      userId,
      token,
    } = req.query;

    if (!organizationId || !token) {
      return res.status(400).json({
        success: false,
        message: 'organizationId and token are required',
      });
    }

    // In production, validate the token
    // For now, generate a subscription URL
    const baseUrl = process.env.API_BASE_URL || `http://localhost:3005`;
    const params = new URLSearchParams({
      organizationId: organizationId as string,
      ...(teamId && { teamId: teamId as string }),
      ...(userId && { userId: userId as string }),
      token: token as string,
    });

    const subscriptionUrl = `${baseUrl}/api/events/feed/ics?${params.toString()}`;

    res.json({
      success: true,
      data: {
        url: subscriptionUrl,
        instructions: {
          google: 'In Google Calendar: Other calendars > Add by URL > Paste this URL',
          apple: 'In Calendar app: File > New Calendar Subscription > Paste this URL',
          outlook: 'In Outlook: Add calendar > From internet > Paste this URL',
        },
      },
    });
  } catch (error) {
    console.error('Error generating subscription URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate subscription URL',
    });
  }
});

// Calendar feed endpoint (for subscriptions)
router.get('/feed/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const {
      organizationId,
      teamId,
      userId,
      token,
    } = req.query;

    if (!organizationId || !token) {
      return res.status(401).send('Unauthorized');
    }

    // In production, validate the token
    // For now, proceed with the export

    const filters = {
      organizationId: organizationId as string,
      teamId: teamId as string,
      participantId: userId as string,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year ahead
    };

    const result = await eventService.getEvents(filters, 1, 1000);
    const events = result.data;

    if (format.toLowerCase() === 'ics') {
      const content = CalendarExportService.generateICalendar(events);
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Cache-Control', 'max-age=300'); // Cache for 5 minutes
      res.send(content);
    } else {
      res.status(400).send('Unsupported format');
    }
  } catch (error) {
    console.error('Error generating calendar feed:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;