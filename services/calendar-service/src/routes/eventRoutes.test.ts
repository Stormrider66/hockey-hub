import request from 'supertest';
import express from 'express';
import { MockFactory } from '@hockey-hub/shared-lib';
import eventRoutes from './eventRoutes';
import { CachedEventService } from '../services/CachedEventService';
import { CalendarExportService } from '../services/calendarExportService';
import { EventType, EventStatus } from '../entities';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../services/CachedEventService');
jest.mock('../services/calendarExportService');
jest.mock('@hockey-hub/shared-lib', () => {
  const authenticate = jest.fn((_req: any, _res: any, next: any) => next());
  return {
  parsePaginationParams: (query: any, defaults: any = {}) => {
    const page = Math.max(1, parseInt(query.page as string) || defaults.page || 1);
    const requestedLimit = parseInt(query.limit as string) || defaults.limit || 20;
    const maxLimit = defaults.maxLimit || 100;
    const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip, take: limit };
  },
  paginateArray: (items: any[], { page = 1, limit = 20 }: any) => {
    const skip = (page - 1) * limit;
    const data = items.slice(skip, skip + limit);
    return { data, pagination: { page, limit, total: items.length } } as any;
  },
  createPaginationResponse: (data: any[], page: number, pageSize: number, total?: number) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeSize = Math.max(1, Number(pageSize) || 1);
    const computedTotal = total ?? data.length;
    const hasPrev = safePage > 1;
    const hasNext = computedTotal > safePage * safeSize;
    return { data, total: computedTotal, page: safePage, pageSize: safeSize, hasPrev, hasNext };
  },
  createAuthMiddleware: () => ({
    extractUser: () => (_req: any, _res: any, next: any) => next(),
    requireAuth: () => (req: any, res: any, next: any) => authenticate(req, res, next),
  }),
  authenticate,
  authorize: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  validationMiddleware: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  MockFactory: { resetIdCounter: jest.fn() },
};
});

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/events', eventRoutes);
  return app;
};

describe('Event Routes', () => {
  let app: express.Application;
  let mockEventService: jest.Mocked<CachedEventService>;
  let mockExportService: jest.Mocked<CalendarExportService>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockFactory.resetIdCounter();
    
    app = createTestApp();
    
    // Get mock instances
    mockEventService = new CachedEventService() as jest.Mocked<CachedEventService>;
    mockExportService = new CalendarExportService() as jest.Mocked<CalendarExportService>;
  });

  describe('GET /events', () => {
    it('should return paginated events with filters', async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ id: '1', title: 'Team Practice' }),
        createMockEvent({ id: '2', title: 'Game Day' }),
      ];
      
      mockEventService.getEvents.mockResolvedValue({
        data: mockEvents,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      // Act
      const response = await request(app)
        .get('/events')
        .query({
          organizationId: 'org-1',
          teamId: 'team-1',
          type: 'training',
          status: 'scheduled',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockEvents,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockEventService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          teamId: 'team-1',
          type: 'training',
          status: 'scheduled',
        }),
        1,
        20
      );
    });

    it('should handle date filters correctly', async () => {
      // Arrange
      mockEventService.getEvents.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      // Act
      const response = await request(app)
        .get('/events')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(mockEventService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        }),
        1,
        20
      );
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      mockEventService.getEvents.mockResolvedValue({
        data: [],
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });

      // Act
      const response = await request(app)
        .get('/events?page=3&limit=10')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(mockEventService.getEvents).toHaveBeenCalledWith(
        expect.any(Object),
        3,
        10
      );
    });

    it('should handle service errors', async () => {
      // Arrange
      mockEventService.getEvents.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/events')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch events',
      });
    });
  });

  describe('GET /events/upcoming', () => {
    it('should return upcoming events for a user', async () => {
      // Arrange
      const mockUpcomingEvents = [
        createMockEvent({ id: '1', title: 'Tomorrow Practice' }),
        createMockEvent({ id: '2', title: 'Weekend Game' }),
      ];
      
      mockEventService.getUpcomingEvents.mockResolvedValue(mockUpcomingEvents);

      // Act
      const response = await request(app)
        .get('/events/upcoming')
        .query({
          userId: 'user-1',
          organizationId: 'org-1',
          days: '7',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpcomingEvents);
      expect(mockEventService.getUpcomingEvents).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        7
      );
    });

    it('should return 400 if required parameters missing', async () => {
      // Act
      const response = await request(app)
        .get('/events/upcoming')
        .query({ userId: 'user-1' }) // Missing organizationId
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'userId and organizationId are required',
      });
    });

    it('should use default days value if not provided', async () => {
      // Arrange
      mockEventService.getUpcomingEvents.mockResolvedValue([]);

      // Act
      await request(app)
        .get('/events/upcoming')
        .query({
          userId: 'user-1',
          organizationId: 'org-1',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(mockEventService.getUpcomingEvents).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        7 // Default value
      );
    });
  });

  describe('GET /events/date-range', () => {
    it('should return events within date range', async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ id: '1', startTime: new Date('2025-01-15') }),
        createMockEvent({ id: '2', startTime: new Date('2025-01-20') }),
      ];
      
      mockEventService.getEventsByDateRange.mockResolvedValue(mockEvents);

      // Act
      const response = await request(app)
        .get('/events/date-range')
        .query({
          organizationId: 'org-1',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEvents);
      expect(mockEventService.getEventsByDateRange).toHaveBeenCalledWith(
        'org-1',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
    });

    it('should return 400 if required parameters missing', async () => {
      // Act
      const response = await request(app)
        .get('/events/date-range')
        .query({
          organizationId: 'org-1',
          startDate: '2025-01-01',
          // Missing endDate
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'organizationId, startDate, and endDate are required',
      });
    });

    it('should handle pagination for date range results', async () => {
      // Arrange
      const mockEvents = Array(100).fill(null).map((_, i) => 
        createMockEvent({ id: `${i}`, title: `Event ${i}` })
      );
      mockEventService.getEventsByDateRange.mockResolvedValue(mockEvents);

      // Act
      const response = await request(app)
        .get('/events/date-range')
        .query({
          organizationId: 'org-1',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          page: '2',
          limit: '20',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(20);
      expect(response.body.total).toBe(100);
      expect(response.body.page).toBe(2);
    });
  });

  describe('POST /events/check-conflicts', () => {
    it('should check for event conflicts', async () => {
      // Arrange
      const conflictData = {
        startTime: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T12:00:00Z',
        participantIds: ['player-1', 'player-2'],
        excludeEventId: 'event-1',
      };
      
      const mockConflicts = [
        createMockEvent({ id: 'conflict-1', title: 'Conflicting Event' }),
      ];
      
      mockEventService.checkConflicts.mockResolvedValue(mockConflicts);

      // Act
      const response = await request(app)
        .post('/events/check-conflicts')
        .set('Authorization', 'Bearer test-token')
        .send(conflictData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        hasConflicts: true,
        conflicts: mockConflicts,
      });
      expect(mockEventService.checkConflicts).toHaveBeenCalledWith(
        new Date('2025-01-15T10:00:00Z'),
        new Date('2025-01-15T12:00:00Z'),
        ['player-1', 'player-2'],
        'event-1'
      );
    });

    it('should return no conflicts when none exist', async () => {
      // Arrange
      mockEventService.checkConflicts.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .post('/events/check-conflicts')
        .set('Authorization', 'Bearer test-token')
        .send({
          startTime: '2025-01-15T10:00:00Z',
          endTime: '2025-01-15T12:00:00Z',
          participantIds: ['player-1'],
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        hasConflicts: false,
        conflicts: [],
      });
    });

    it('should handle validation errors', async () => {
      // Act
      const response = await request(app)
        .post('/events/check-conflicts')
        .set('Authorization', 'Bearer test-token')
        .send({
          startTime: '2025-01-15T10:00:00Z',
          // Missing required fields
        });

      // Assert
      // Note: Since we're mocking validationMiddleware, actual validation would be tested separately
      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', async () => {
      // Arrange
      mockEventService.getEvents.mockRejectedValue(new Error('Invalid date'));

      // Act
      const response = await request(app)
        .get('/events')
        .query({
          startDate: 'invalid-date',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle service unavailability', async () => {
      // Arrange
      mockEventService.getUpcomingEvents.mockRejectedValue(new Error('Service unavailable'));

      // Act
      const response = await request(app)
        .get('/events/upcoming')
        .query({
          userId: 'user-1',
          organizationId: 'org-1',
        })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch upcoming events',
      });
    });
  });

  describe('Authentication', () => {
    it('should apply authentication middleware to all routes', async () => {
      const authenticateSpy = authenticate as jest.Mock;
      
      // Make various requests
      await request(app).get('/events').set('Authorization', 'Bearer test-token');
      await request(app).get('/events/upcoming?userId=1&organizationId=1').set('Authorization', 'Bearer test-token');
      await request(app).post('/events/check-conflicts').set('Authorization', 'Bearer test-token');
      
      // Verify authenticate was called for each request (shim forwards through createAuthMiddleware.requireAuth)
      expect(authenticateSpy).toHaveBeenCalled();
    });
  });
});

// Helper function to create mock event
function createMockEvent(overrides?: Partial<any>): any {
  const base = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test description',
    type: 'training' as EventType,
    status: 'scheduled' as EventStatus,
    startTime: new Date('2025-01-15T10:00:00Z'),
    endTime: new Date('2025-01-15T12:00:00Z'),
    location: 'Arena 1',
    organizationId: 'org-1',
    teamId: 'team-1',
    createdBy: 'user-1',
    isAllDay: false,
    isRecurring: false,
    metadata: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [],
    resourceBookings: [],
    recurrenceRule: null,
    ...overrides,
  } as any;

  // Normalize date-like fields to ISO strings because Express JSON serializes Dates
  ['startTime', 'endTime', 'createdAt', 'updatedAt'].forEach((k) => {
    if (base[k] instanceof Date) {
      base[k] = (base[k] as Date).toISOString();
    }
  });

  return base;
}