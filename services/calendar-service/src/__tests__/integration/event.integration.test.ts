import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { Event } from '../../entities/Event';
import { EventParticipant } from '../../entities/EventParticipant';
import { Resource } from '../../entities/Resource';
import { ResourceBooking } from '../../entities/ResourceBooking';
import { RecurringEvent } from '../../entities/RecurringEvent';
import { eventRoutes } from '../../routes/eventRoutes';

describe('Calendar Service Event Management Integration', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [Event, EventParticipant, Resource, ResourceBooking, RecurringEvent];
  const { getDataSource, getRepository } = setupTestDatabase('calendar-service', entities);

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['event.create', 'event.view', 'event.update', 'event.delete'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['event.view', 'event.rsvp'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['event.view:child', 'event.rsvp:child'],
    childIds: ['player-123'],
  });

  const clubAdmin = createTestUser({
    id: 'admin-123',
    role: 'club-admin',
    email: 'admin@example.com',
    organizationId: 'org-123',
    permissions: ['event.create', 'event.view', 'event.update', 'event.delete', 'event.approve'],
  });

  beforeAll(async () => {
    dataSource = getDataSource();
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Apply auth middleware
    app.use(authMiddleware);
    
    // Mount routes
    app.use('/api/events', eventRoutes);
    
    // Error handler
    app.use(errorHandler);

    // Seed test data
    await seedTestData();
  });

  async function seedTestData() {
    const eventRepo = getRepository(Event);
    const resourceRepo = getRepository(Resource);
    const participantRepo = getRepository(EventParticipant);
    
    // Create resources
    await resourceRepo.save([
      {
        id: 'resource-1',
        name: 'Ice Rink A',
        type: 'facility',
        capacity: 50,
        organizationId: 'org-123',
        isActive: true,
      },
      {
        id: 'resource-2',
        name: 'Meeting Room 1',
        type: 'room',
        capacity: 20,
        organizationId: 'org-123',
        isActive: true,
      },
      {
        id: 'resource-3',
        name: 'Team Bus',
        type: 'vehicle',
        capacity: 30,
        organizationId: 'org-123',
        isActive: true,
      },
    ]);
    
    // Create test events
    const events = await eventRepo.save([
      {
        id: 'event-1',
        title: 'Team Practice',
        type: 'practice',
        startTime: new Date('2025-07-03T16:00:00Z'),
        endTime: new Date('2025-07-03T18:00:00Z'),
        location: 'Ice Rink A',
        description: 'Regular team practice',
        createdBy: 'coach-123',
        organizationId: 'org-123',
        teamId: 'team-123',
        status: 'confirmed',
        visibility: 'team',
        requiresRSVP: true,
        maxParticipants: 25,
      },
      {
        id: 'event-2',
        title: 'Away Game vs Rivals',
        type: 'game',
        startTime: new Date('2025-07-05T19:00:00Z'),
        endTime: new Date('2025-07-05T21:30:00Z'),
        location: 'Rival Arena',
        description: 'Important league game',
        createdBy: 'coach-123',
        organizationId: 'org-123',
        teamId: 'team-123',
        status: 'confirmed',
        visibility: 'public',
        requiresRSVP: true,
        transportationRequired: true,
      },
      {
        id: 'event-3',
        title: 'Team Meeting',
        type: 'meeting',
        startTime: new Date('2025-07-04T10:00:00Z'),
        endTime: new Date('2025-07-04T11:00:00Z'),
        location: 'Meeting Room 1',
        createdBy: 'coach-123',
        organizationId: 'org-123',
        teamId: 'team-123',
        status: 'pending',
        visibility: 'team',
      },
      {
        id: 'event-4',
        title: 'Private Training',
        type: 'training',
        startTime: new Date('2025-07-06T09:00:00Z'),
        endTime: new Date('2025-07-06T10:00:00Z'),
        location: 'Gym',
        createdBy: 'coach-456',
        organizationId: 'org-123',
        teamId: 'team-456',
        status: 'confirmed',
        visibility: 'private',
      },
    ]);

    // Create participants
    await participantRepo.save([
      {
        id: 'participant-1',
        eventId: 'event-1',
        userId: 'player-123',
        role: 'participant',
        status: 'confirmed',
        rsvpResponse: 'yes',
        rsvpDate: new Date('2025-07-01'),
      },
      {
        id: 'participant-2',
        eventId: 'event-2',
        userId: 'player-123',
        role: 'participant',
        status: 'invited',
        rsvpResponse: 'pending',
      },
      {
        id: 'participant-3',
        eventId: 'event-1',
        userId: 'coach-123',
        role: 'organizer',
        status: 'confirmed',
        rsvpResponse: 'yes',
      },
    ]);

    // Create resource bookings
    const bookingRepo = getRepository(ResourceBooking);
    await bookingRepo.save([
      {
        id: 'booking-1',
        resourceId: 'resource-1',
        eventId: 'event-1',
        startTime: new Date('2025-07-03T16:00:00Z'),
        endTime: new Date('2025-07-03T18:00:00Z'),
        status: 'confirmed',
      },
      {
        id: 'booking-2',
        resourceId: 'resource-2',
        eventId: 'event-3',
        startTime: new Date('2025-07-04T10:00:00Z'),
        endTime: new Date('2025-07-04T11:00:00Z'),
        status: 'pending',
      },
    ]);
  }

  describe('POST /api/events', () => {
    it('should allow coach to create team event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const eventData = {
        title: 'New Practice Session',
        type: 'practice',
        startTime: '2025-07-08T16:00:00Z',
        endTime: '2025-07-08T18:00:00Z',
        location: 'Ice Rink B',
        description: 'Focus on power play tactics',
        teamId: 'team-123',
        requiresRSVP: true,
        maxParticipants: 20,
        resources: ['resource-1'],
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.createdBy).toBe(coach.id);
      expect(response.body.status).toBe('pending'); // Needs approval
      expect(response.body.bookings).toHaveLength(1);

      // Verify in database
      const eventRepo = getRepository(Event);
      const savedEvent = await eventRepo.findOne({
        where: { id: response.body.id },
        relations: ['bookings'],
      });
      expect(savedEvent).toBeDefined();
    });

    it('should check for resource conflicts', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const conflictingEvent = {
        title: 'Conflicting Practice',
        type: 'practice',
        startTime: '2025-07-03T17:00:00Z', // Overlaps with event-1
        endTime: '2025-07-03T19:00:00Z',
        location: 'Ice Rink A',
        resources: ['resource-1'], // Same resource
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(conflictingEvent)
        .expect(409);

      expect(response.body.error).toContain('Resource conflict');
      expect(response.body.conflicts).toBeDefined();
    });

    it('should create recurring events', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const recurringEventData = {
        title: 'Weekly Team Practice',
        type: 'practice',
        startTime: '2025-07-10T16:00:00Z',
        endTime: '2025-07-10T18:00:00Z',
        location: 'Ice Rink A',
        teamId: 'team-123',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: ['thursday'],
          endDate: '2025-08-31',
        },
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(recurringEventData)
        .expect(201);

      expect(response.body.recurringEventId).toBeDefined();
      expect(response.body.instances).toBeDefined();
      expect(response.body.instances.length).toBeGreaterThan(1);
    });

    it('should validate event data', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const invalidData = {
        title: '', // Empty title
        type: 'invalid-type',
        startTime: '2025-07-08T18:00:00Z',
        endTime: '2025-07-08T16:00:00Z', // End before start
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Validation');
      expect(response.body.details).toBeDefined();
    });

    it('should enforce permissions for event creation', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const eventData = {
        title: 'Player Created Event',
        type: 'practice',
        startTime: '2025-07-08T16:00:00Z',
        endTime: '2025-07-08T18:00:00Z',
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/events', () => {
    it('should return events based on user permissions', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // Player should see team and public events, but not private ones
      const events = response.body.data;
      expect(events.some((e: any) => e.visibility === 'team')).toBe(true);
      expect(events.some((e: any) => e.visibility === 'public')).toBe(true);
      expect(events.every((e: any) => e.visibility !== 'private' || e.teamId === player.teamId)).toBe(true);
    });

    it('should support date range filtering', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events?startDate=2025-07-03&endDate=2025-07-05')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const events = response.body.data;
      events.forEach((event: any) => {
        const eventDate = new Date(event.startTime);
        expect(eventDate >= new Date('2025-07-03')).toBe(true);
        expect(eventDate <= new Date('2025-07-06')).toBe(true); // End of day
      });
    });

    it('should filter by event type', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events?type=practice')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const events = response.body.data;
      expect(events.every((e: any) => e.type === 'practice')).toBe(true);
    });

    it('should show parent their children events', async () => {
      const token = createTestToken(parent, JWT_SECRET);

      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should see events where their child is a participant
      const events = response.body.data;
      expect(events.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details with participants', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events/event-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('event-1');
      expect(response.body.participants).toBeDefined();
      expect(response.body.bookings).toBeDefined();
      expect(response.body.rsvpStats).toBeDefined();
    });

    it('should include RSVP statistics', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events/event-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const { rsvpStats } = response.body;
      expect(rsvpStats.total).toBeDefined();
      expect(rsvpStats.yes).toBeDefined();
      expect(rsvpStats.no).toBeDefined();
      expect(rsvpStats.maybe).toBeDefined();
      expect(rsvpStats.pending).toBeDefined();
    });

    it('should prevent access to private events', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/events/event-4') // Private event from different team
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access');
    });

    it('should return 404 for non-existent event', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/events/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should allow organizer to update event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const updateData = {
        title: 'Updated Practice Session',
        description: 'Focus on defensive plays',
        maxParticipants: 30,
      };

      const response = await request(app)
        .put('/api/events/event-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxParticipants).toBe(updateData.maxParticipants);
    });

    it('should prevent unauthorized updates', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const updateData = {
        title: 'Unauthorized Update',
      };

      const response = await request(app)
        .put('/api/events/event-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should validate time changes for conflicts', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const updateData = {
        startTime: '2025-07-05T19:00:00Z', // Conflicts with event-2
        endTime: '2025-07-05T21:00:00Z',
      };

      const response = await request(app)
        .put('/api/events/event-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(409);

      expect(response.body.error).toContain('Time conflict');
    });
  });

  describe('POST /api/events/:id/rsvp', () => {
    it('should allow players to RSVP', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const rsvpData = {
        response: 'yes',
        note: 'Looking forward to it',
      };

      const response = await request(app)
        .post('/api/events/event-2/rsvp')
        .set('Authorization', `Bearer ${token}`)
        .send(rsvpData)
        .expect(200);

      expect(response.body.rsvpResponse).toBe('yes');
      expect(response.body.note).toBe(rsvpData.note);
    });

    it('should allow parents to RSVP for children', async () => {
      const token = createTestToken(parent, JWT_SECRET);
      const rsvpData = {
        response: 'no',
        note: 'Has a dentist appointment',
        childId: 'player-123',
      };

      const response = await request(app)
        .post('/api/events/event-2/rsvp')
        .set('Authorization', `Bearer ${token}`)
        .send(rsvpData)
        .expect(200);

      expect(response.body.userId).toBe('player-123');
      expect(response.body.rsvpResponse).toBe('no');
      expect(response.body.rsvpBy).toBe(parent.id);
    });

    it('should update existing RSVP', async () => {
      const token = createTestToken(player, JWT_SECRET);
      
      // First RSVP
      await request(app)
        .post('/api/events/event-2/rsvp')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: 'maybe' });

      // Update RSVP
      const response = await request(app)
        .post('/api/events/event-2/rsvp')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: 'yes' })
        .expect(200);

      expect(response.body.rsvpResponse).toBe('yes');
      expect(response.body.previousResponse).toBe('maybe');
    });

    it('should enforce max participants limit', async () => {
      const token = createTestToken(player, JWT_SECRET);
      
      // Assuming event is at capacity
      const eventRepo = getRepository(Event);
      await eventRepo.update('event-1', { currentParticipants: 25 }); // Max is 25

      const response = await request(app)
        .post('/api/events/event-1/rsvp')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: 'yes' })
        .expect(400);

      expect(response.body.error).toContain('Event is full');
    });
  });

  describe('POST /api/events/:id/cancel', () => {
    it('should allow organizer to cancel event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const cancelData = {
        reason: 'Facility maintenance',
        notifyParticipants: true,
      };

      const response = await request(app)
        .post('/api/events/event-3/cancel')
        .set('Authorization', `Bearer ${token}`)
        .send(cancelData)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancellationReason).toBe(cancelData.reason);
      expect(response.body.cancelledBy).toBe(coach.id);
    });

    it('should prevent cancelling past events', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      
      // Create a past event
      const eventRepo = getRepository(Event);
      const pastEvent = await eventRepo.save({
        id: 'past-event',
        title: 'Past Event',
        type: 'practice',
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-02'),
        createdBy: coach.id,
        organizationId: 'org-123',
        teamId: 'team-123',
      });

      const response = await request(app)
        .post(`/api/events/${pastEvent.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Too late' })
        .expect(400);

      expect(response.body.error).toContain('Cannot cancel past event');
    });
  });

  describe('POST /api/events/:id/approve', () => {
    it('should allow admin to approve pending events', async () => {
      const token = createTestToken(clubAdmin, JWT_SECRET);

      const response = await request(app)
        .post('/api/events/event-3/approve')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(response.body.approvedBy).toBe(clubAdmin.id);
      expect(response.body.approvedAt).toBeDefined();
    });

    it('should confirm resource bookings on approval', async () => {
      const token = createTestToken(clubAdmin, JWT_SECRET);

      await request(app)
        .post('/api/events/event-3/approve')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check if resource booking was confirmed
      const bookingRepo = getRepository(ResourceBooking);
      const booking = await bookingRepo.findOne({
        where: { eventId: 'event-3' },
      });
      
      expect(booking?.status).toBe('confirmed');
    });

    it('should require admin permissions for approval', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .post('/api/events/event-3/approve')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/events/conflicts', () => {
    it('should check for scheduling conflicts', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .post('/api/events/conflicts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startTime: '2025-07-03T17:00:00Z',
          endTime: '2025-07-03T19:00:00Z',
          resources: ['resource-1'],
          teamId: 'team-123',
        })
        .expect(200);

      expect(response.body.hasConflicts).toBe(true);
      expect(response.body.conflicts).toBeDefined();
      expect(response.body.conflicts.resources).toHaveLength(1);
      expect(response.body.conflicts.participants).toBeDefined();
    });

    it('should check participant availability', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .post('/api/events/conflicts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startTime: '2025-07-05T19:00:00Z',
          endTime: '2025-07-05T21:00:00Z',
          participants: ['player-123'],
        })
        .expect(200);

      expect(response.body.hasConflicts).toBe(true);
      expect(response.body.conflicts.participants).toContain('player-123');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should allow soft deletion of events', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .delete('/api/events/event-3')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify soft delete
      const eventRepo = getRepository(Event);
      const deletedEvent = await eventRepo.findOne({
        where: { id: 'event-3' },
        withDeleted: true,
      });
      
      expect(deletedEvent?.deletedAt).toBeDefined();
    });

    it('should clean up associated data on deletion', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      await request(app)
        .delete('/api/events/event-3')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check if bookings were cancelled
      const bookingRepo = getRepository(ResourceBooking);
      const booking = await bookingRepo.findOne({
        where: { eventId: 'event-3' },
      });
      
      expect(booking?.status).toBe('cancelled');
    });
  });
});