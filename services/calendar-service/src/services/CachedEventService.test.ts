import { CachedEventService } from './CachedEventService';
import { CachedEventRepository } from '../repositories/CachedEventRepository';
import { CalendarNotificationService } from './CalendarNotificationService';
import { AppDataSource } from '../config/database';
import { RedisCacheManager } from '@hockey-hub/shared-lib';
import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
  EventParticipant,
  ParticipantStatus,
  ParticipantType,
  ParticipantRole,
} from '../entities';

// Mock dependencies
jest.mock('../repositories/CachedEventRepository');
jest.mock('./CalendarNotificationService');
jest.mock('../config/database');
jest.mock('@hockey-hub/shared-lib');

describe('CachedEventService', () => {
  let service: CachedEventService;
  let mockEventRepository: jest.Mocked<CachedEventRepository>;
  let mockNotificationService: jest.Mocked<CalendarNotificationService>;
  let mockParticipantRepository: any;
  let mockCacheManager: jest.Mocked<RedisCacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock participant repository
    mockParticipantRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    
    // Mock AppDataSource
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockParticipantRepository);
    
    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    } as any;
    
    (RedisCacheManager.getInstance as jest.Mock).mockReturnValue(mockCacheManager);
    
    // Create service instance
    service = new CachedEventService();
    mockEventRepository = (service as any).eventRepository;
    mockNotificationService = (service as any).notificationService;
  });

  describe('createEvent', () => {
    it('should create event with participants and send notifications', async () => {
      // Arrange
      const eventData = {
        title: 'Team Practice',
        description: 'Regular practice session',
        type: EventType.TRAINING,
        startTime: new Date('2025-01-20T10:00:00Z'),
        endTime: new Date('2025-01-20T12:00:00Z'),
        location: 'Main Arena',
        organizationId: 'org-1',
        teamId: 'team-1',
        createdBy: 'coach-1',
        participants: [
          { userId: 'coach-1', role: ParticipantRole.REQUIRED },
          { userId: 'player-1', role: ParticipantRole.REQUIRED },
          { userId: 'player-2', role: ParticipantRole.OPTIONAL },
        ],
        metadata: { intensity: 'high' },
      };
      
      const createdEvent = createMockEvent({ id: 'event-1', ...eventData });
      const createdParticipants = eventData.participants.map((p, idx) => ({
        id: `participant-${idx}`,
        eventId: 'event-1',
        participantId: p.userId,
        participantType: ParticipantType.USER,
        role: p.role,
        status: p.userId === 'coach-1' ? ParticipantStatus.ACCEPTED : ParticipantStatus.PENDING,
        isOrganizer: p.userId === 'coach-1',
      }));
      
      mockEventRepository.create.mockReturnValue(createdEvent);
      mockEventRepository.save.mockResolvedValue(createdEvent);
      mockEventRepository.findOne.mockResolvedValue({
        ...createdEvent,
        participants: createdParticipants,
      } as any);
      
      mockParticipantRepository.create.mockImplementation(data => data);
      mockParticipantRepository.save.mockResolvedValue(createdParticipants);
      
      mockNotificationService.notifyEventCreated.mockResolvedValue(undefined);

      // Act
      const result = await service.createEvent(eventData);

      // Assert
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Team Practice',
          type: EventType.TRAINING,
          status: EventStatus.SCHEDULED,
          visibility: EventVisibility.TEAM,
        })
      );
      
      expect(mockParticipantRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            participantId: 'coach-1',
            isOrganizer: true,
            status: ParticipantStatus.ACCEPTED,
          }),
          expect.objectContaining({
            participantId: 'player-1',
            isOrganizer: false,
            status: ParticipantStatus.PENDING,
          }),
        ])
      );
      
      expect(mockNotificationService.notifyEventCreated).toHaveBeenCalledWith(
        createdEvent,
        createdParticipants
      );
      
      expect(result.participants).toHaveLength(3);
    });

    it('should handle notification errors gracefully', async () => {
      // Arrange
      const eventData = {
        title: 'Test Event',
        type: EventType.GAME,
        startTime: new Date(),
        endTime: new Date(),
        organizationId: 'org-1',
        createdBy: 'user-1',
        participants: [{ userId: 'user-1' }],
      };
      
      mockEventRepository.create.mockReturnValue({} as any);
      mockEventRepository.save.mockResolvedValue({ id: 'event-1' } as any);
      mockEventRepository.findOne.mockResolvedValue(createMockEvent());
      mockParticipantRepository.save.mockResolvedValue([]);
      
      // Simulate notification failure
      mockNotificationService.notifyEventCreated.mockRejectedValue(
        new Error('Notification service error')
      );
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await service.createEvent(eventData);

      // Assert
      expect(result).toBeDefined(); // Event creation should succeed
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send event created notifications:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should use default visibility if not provided', async () => {
      // Arrange
      const eventData = {
        title: 'Private Event',
        type: EventType.MEETING,
        startTime: new Date(),
        endTime: new Date(),
        organizationId: 'org-1',
        createdBy: 'user-1',
        // visibility not provided
      };
      
      mockEventRepository.create.mockReturnValue({} as any);
      mockEventRepository.save.mockResolvedValue({ id: 'event-1' } as any);
      mockEventRepository.findOne.mockResolvedValue(createMockEvent());

      // Act
      await service.createEvent(eventData);

      // Assert
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: EventVisibility.TEAM,
        })
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event and send notifications for changes', async () => {
      // Arrange
      const eventId = 'event-1';
      const existingEvent = createMockEvent({
        id: eventId,
        title: 'Old Title',
        startTime: new Date('2025-01-20T10:00:00Z'),
        location: 'Old Location',
        participants: [
          { id: 'p1', participantId: 'user-1' },
          { id: 'p2', participantId: 'user-2' },
        ],
      });
      
      const updateData = {
        title: 'New Title',
        startTime: new Date('2025-01-20T11:00:00Z'),
        location: 'New Location',
        updatedBy: 'coach-1',
      };
      
      mockEventRepository.findOne
        .mockResolvedValueOnce(existingEvent)
        .mockResolvedValueOnce({ ...existingEvent, ...updateData } as any);
      mockEventRepository.save.mockResolvedValue({ ...existingEvent, ...updateData });
      mockNotificationService.notifyEventUpdated.mockResolvedValue(undefined);

      // Act
      const result = await service.updateEvent(eventId, updateData);

      // Assert
      expect(mockEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: eventId,
          title: 'New Title',
          startTime: updateData.startTime,
          location: 'New Location',
        })
      );
      
      expect(mockNotificationService.notifyEventUpdated).toHaveBeenCalledWith(
        expect.any(Object),
        ['title', 'start_time', 'location']
      );
    });

    it('should throw error if event not found', async () => {
      // Arrange
      mockEventRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateEvent('non-existent', { title: 'New' }))
        .rejects.toThrow('Event not found');
    });

    it('should not send notifications if no significant changes', async () => {
      // Arrange
      const existingEvent = createMockEvent({
        id: 'event-1',
        metadata: { key: 'value' },
      });
      
      const updateData = {
        metadata: { key: 'updated' }, // Only metadata change
        updatedBy: 'user-1',
      };
      
      mockEventRepository.findOne.mockResolvedValue(existingEvent);
      mockEventRepository.save.mockResolvedValue({ ...existingEvent, ...updateData });

      // Act
      await service.updateEvent('event-1', updateData);

      // Assert
      expect(mockNotificationService.notifyEventUpdated).not.toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should return filtered and paginated events', async () => {
      // Arrange
      const filters = {
        organizationId: 'org-1',
        teamId: 'team-1',
        type: EventType.TRAINING,
        status: EventStatus.SCHEDULED,
      };
      
      const mockEvents = [
        createMockEvent({ id: '1' }),
        createMockEvent({ id: '2' }),
      ];
      
      mockEventRepository.findAndCount.mockResolvedValue([mockEvents, 10]);

      // Act
      const result = await service.getEvents(filters, 1, 20);

      // Assert
      expect(result).toEqual({
        data: mockEvents,
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      
      expect(mockEventRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-1',
          teamId: 'team-1',
          type: EventType.TRAINING,
          status: EventStatus.SCHEDULED,
        }),
        relations: ['participants', 'resourceBookings', 'recurrenceRule'],
        order: { startTime: 'ASC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle date range filters', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      mockEventRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.getEvents({ startDate, endDate }, 1, 10);

      // Assert
      expect(mockEventRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startTime: expect.any(Object), // TypeORM Between operator
        }),
        relations: expect.any(Array),
        order: expect.any(Object),
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events for a user', async () => {
      // Arrange
      const userId = 'user-1';
      const organizationId = 'org-1';
      const days = 7;
      
      const upcomingEvents = [
        createMockEvent({ id: '1', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        createMockEvent({ id: '2', startTime: new Date(Date.now() + 48 * 60 * 60 * 1000) }),
      ];
      
      mockEventRepository.getUpcomingEventsForUser.mockResolvedValue(upcomingEvents);

      // Act
      const result = await service.getUpcomingEvents(userId, organizationId, days);

      // Assert
      expect(result).toEqual(upcomingEvents);
      expect(mockEventRepository.getUpcomingEventsForUser).toHaveBeenCalledWith(
        userId,
        organizationId,
        days
      );
    });
  });

  describe('checkConflicts', () => {
    it('should check for scheduling conflicts', async () => {
      // Arrange
      const startTime = new Date('2025-01-20T10:00:00Z');
      const endTime = new Date('2025-01-20T12:00:00Z');
      const participantIds = ['player-1', 'player-2'];
      const excludeEventId = 'event-1';
      
      const conflictingEvents = [
        createMockEvent({ id: 'conflict-1', title: 'Conflicting Event' }),
      ];
      
      mockEventRepository.checkConflicts.mockResolvedValue(conflictingEvents);

      // Act
      const result = await service.checkConflicts(startTime, endTime, participantIds, excludeEventId);

      // Assert
      expect(result).toEqual(conflictingEvents);
      expect(mockEventRepository.checkConflicts).toHaveBeenCalledWith(
        startTime,
        endTime,
        participantIds,
        excludeEventId
      );
    });

    it('should return empty array when no conflicts', async () => {
      // Arrange
      mockEventRepository.checkConflicts.mockResolvedValue([]);

      // Act
      const result = await service.checkConflicts(
        new Date(),
        new Date(),
        ['player-1']
      );

      // Assert
      expect(result).toEqual([]);
    });
  });
});

// Helper function to create mock event
function createMockEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test description',
    type: EventType.TRAINING,
    status: EventStatus.SCHEDULED,
    startTime: new Date('2025-01-20T10:00:00Z'),
    endTime: new Date('2025-01-20T12:00:00Z'),
    location: 'Test Location',
    onlineUrl: null,
    visibility: EventVisibility.TEAM,
    organizationId: 'org-1',
    teamId: 'team-1',
    createdBy: 'user-1',
    maxParticipants: null,
    currentParticipants: 0,
    metadata: {},
    isAllDay: false,
    isRecurring: false,
    recurringEventId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUser: null as any,
    updatedByUser: null as any,
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    participants: [],
    resourceBookings: [],
    recurrenceRule: null,
    ...overrides,
  } as Event;
}