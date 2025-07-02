import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { TrainingSession } from '../../entities/TrainingSession';
import { Exercise } from '../../entities/Exercise';
import { SessionParticipant } from '../../entities/SessionParticipant';
import { PerformanceMetric } from '../../entities/PerformanceMetric';
import { sessionRoutes } from '../../routes/sessionRoutes';

describe('Training Service Session Endpoints Integration', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [TrainingSession, Exercise, SessionParticipant, PerformanceMetric];
  const { getDataSource, getRepository } = setupTestDatabase('training-service', entities);

  // Test users
  const physicalTrainer = createTestUser({
    id: 'trainer-123',
    role: 'physical-trainer',
    email: 'trainer@example.com',
    organizationId: 'org-123',
    permissions: ['training.create', 'training.view', 'training.update', 'training.delete'],
  });

  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['training.create', 'training.view', 'training.update'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['training.view:own', 'training.update:own'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['training.view:child'],
  });

  beforeAll(async () => {
    dataSource = getDataSource();
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Apply auth middleware
    app.use(authMiddleware);
    
    // Mount routes
    app.use('/api/sessions', sessionRoutes);
    
    // Error handler
    app.use(errorHandler);

    // Seed test data
    await seedTestData();
  });

  async function seedTestData() {
    const sessionRepo = getRepository(TrainingSession);
    const exerciseRepo = getRepository(Exercise);
    const participantRepo = getRepository(SessionParticipant);
    const metricRepo = getRepository(PerformanceMetric);
    
    // Create test sessions
    const sessions = await sessionRepo.save([
      {
        id: 'session-1',
        name: 'Morning Strength Training',
        type: 'strength',
        scheduledDate: new Date('2025-07-03T09:00:00Z'),
        duration: 60,
        location: 'Gym A',
        description: 'Upper body strength training',
        trainerId: 'trainer-123',
        teamId: 'team-123',
        organizationId: 'org-123',
        status: 'scheduled',
        maxParticipants: 20,
      },
      {
        id: 'session-2',
        name: 'Cardio Endurance',
        type: 'cardio',
        scheduledDate: new Date('2025-07-02T15:00:00Z'),
        duration: 45,
        location: 'Track',
        description: 'Interval running',
        trainerId: 'trainer-123',
        teamId: 'team-123',
        organizationId: 'org-123',
        status: 'completed',
        actualStartTime: new Date('2025-07-02T15:05:00Z'),
        actualEndTime: new Date('2025-07-02T15:50:00Z'),
      },
      {
        id: 'session-3',
        name: 'Recovery Session',
        type: 'recovery',
        scheduledDate: new Date('2025-07-04T14:00:00Z'),
        duration: 30,
        location: 'Recovery Room',
        trainerId: 'trainer-456',
        teamId: 'team-456',
        organizationId: 'org-123',
        status: 'scheduled',
      },
    ]);

    // Create exercises for sessions
    await exerciseRepo.save([
      {
        id: 'exercise-1',
        sessionId: 'session-1',
        name: 'Bench Press',
        category: 'strength',
        sets: 4,
        reps: 10,
        weight: 60,
        restTime: 90,
        order: 1,
      },
      {
        id: 'exercise-2',
        sessionId: 'session-1',
        name: 'Pull-ups',
        category: 'strength',
        sets: 3,
        reps: 12,
        restTime: 60,
        order: 2,
      },
      {
        id: 'exercise-3',
        sessionId: 'session-2',
        name: '400m Intervals',
        category: 'cardio',
        sets: 6,
        duration: 90,
        restTime: 120,
        order: 1,
      },
    ]);

    // Create participants
    await participantRepo.save([
      {
        id: 'participant-1',
        sessionId: 'session-1',
        playerId: 'player-123',
        status: 'confirmed',
        attendanceStatus: 'pending',
      },
      {
        id: 'participant-2',
        sessionId: 'session-2',
        playerId: 'player-123',
        status: 'confirmed',
        attendanceStatus: 'present',
        checkInTime: new Date('2025-07-02T15:03:00Z'),
      },
      {
        id: 'participant-3',
        sessionId: 'session-2',
        playerId: 'player-456',
        status: 'confirmed',
        attendanceStatus: 'present',
        checkInTime: new Date('2025-07-02T15:00:00Z'),
      },
    ]);

    // Create performance metrics
    await metricRepo.save([
      {
        id: 'metric-1',
        sessionId: 'session-2',
        playerId: 'player-123',
        exerciseId: 'exercise-3',
        metricType: 'time',
        value: 88.5,
        unit: 'seconds',
        notes: 'Good pace maintained',
      },
      {
        id: 'metric-2',
        sessionId: 'session-2',
        playerId: 'player-123',
        exerciseId: 'exercise-3',
        metricType: 'heart_rate',
        value: 165,
        unit: 'bpm',
      },
    ]);
  }

  describe('POST /api/sessions', () => {
    it('should allow physical trainer to create training session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const sessionData = {
        name: 'New Flexibility Session',
        type: 'flexibility',
        scheduledDate: '2025-07-05T10:00:00Z',
        duration: 45,
        location: 'Yoga Room',
        description: 'Flexibility and mobility work',
        teamId: 'team-123',
        maxParticipants: 15,
        exercises: [
          {
            name: 'Dynamic Stretching',
            category: 'warmup',
            duration: 10,
            order: 1,
          },
          {
            name: 'Yoga Flow',
            category: 'flexibility',
            duration: 30,
            order: 2,
          },
        ],
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(sessionData.name);
      expect(response.body.type).toBe(sessionData.type);
      expect(response.body.trainerId).toBe(physicalTrainer.id);
      expect(response.body.exercises).toHaveLength(2);

      // Verify in database
      const sessionRepo = getRepository(TrainingSession);
      const savedSession = await sessionRepo.findOne({
        where: { id: response.body.id },
        relations: ['exercises'],
      });
      expect(savedSession).toBeDefined();
      expect(savedSession?.exercises).toHaveLength(2);
    });

    it('should allow coach to create team training session', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const sessionData = {
        name: 'Team Practice',
        type: 'skill',
        scheduledDate: '2025-07-06T16:00:00Z',
        duration: 90,
        location: 'Ice Rink',
        description: 'Team tactics and drills',
        teamId: 'team-123',
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.trainerId).toBe(coach.id);
      expect(response.body.teamId).toBe(sessionData.teamId);
    });

    it('should reject session creation from unauthorized users', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const sessionData = {
        name: 'Player Session',
        type: 'strength',
        scheduledDate: '2025-07-05T10:00:00Z',
        duration: 60,
        location: 'Gym',
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should validate session data', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const invalidData = {
        name: 'Invalid Session',
        type: 'invalid-type',
        duration: -30, // Invalid duration
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Validation');
      expect(response.body.details).toBeDefined();
    });

    it('should check for scheduling conflicts', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const conflictingSession = {
        name: 'Conflicting Session',
        type: 'strength',
        scheduledDate: '2025-07-03T09:00:00Z', // Same time as session-1
        duration: 60,
        location: 'Gym A', // Same location
        teamId: 'team-123',
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(conflictingSession)
        .expect(409);

      expect(response.body.error).toContain('conflict');
    });
  });

  describe('GET /api/sessions', () => {
    it('should allow trainers to view all their sessions', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Should see sessions they created
      const sessions = response.body.data;
      expect(sessions.some((s: any) => s.trainerId === physicalTrainer.id)).toBe(true);
    });

    it('should allow coaches to view team sessions', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should see team sessions
      const sessions = response.body.data;
      expect(sessions.every((s: any) => s.teamId === coach.teamId || s.trainerId === coach.id)).toBe(true);
    });

    it('should allow players to view their assigned sessions', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should only see sessions they're participating in
      const sessions = response.body.data;
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should support date range filtering', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions?startDate=2025-07-02&endDate=2025-07-03')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const sessions = response.body.data;
      expect(sessions.length).toBeGreaterThan(0);
      
      // Check dates are within range
      sessions.forEach((session: any) => {
        const sessionDate = new Date(session.scheduledDate);
        expect(sessionDate >= new Date('2025-07-02')).toBe(true);
        expect(sessionDate <= new Date('2025-07-04')).toBe(true); // End of day
      });
    });

    it('should support filtering by type', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions?type=strength')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const sessions = response.body.data;
      expect(sessions.every((s: any) => s.type === 'strength')).toBe(true);
    });

    it('should support filtering by status', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions?status=completed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const sessions = response.body.data;
      expect(sessions.every((s: any) => s.status === 'completed')).toBe(true);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session details with exercises and participants', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/session-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('session-1');
      expect(response.body.exercises).toBeDefined();
      expect(response.body.exercises.length).toBe(2);
      expect(response.body.participants).toBeDefined();
      expect(response.body.participants.length).toBeGreaterThan(0);
    });

    it('should allow players to view sessions they participate in', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/session-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('session-1');
      
      // Should see their own participation status
      const myParticipation = response.body.participants.find((p: any) => p.playerId === player.id);
      expect(myParticipation).toBeDefined();
    });

    it('should prevent unauthorized access to other team sessions', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/session-3') // Different team
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access');
    });

    it('should return 404 for non-existent session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/sessions/:id', () => {
    it('should allow trainer to update their session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const updateData = {
        name: 'Updated Strength Training',
        duration: 75,
        maxParticipants: 25,
      };

      const response = await request(app)
        .put('/api/sessions/session-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.duration).toBe(updateData.duration);
      expect(response.body.maxParticipants).toBe(updateData.maxParticipants);
    });

    it('should prevent updating completed sessions', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const updateData = {
        name: 'Cannot Update Completed',
      };

      const response = await request(app)
        .put('/api/sessions/session-2') // Completed session
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toContain('Cannot update completed session');
    });

    it('should prevent unauthorized updates', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const updateData = {
        name: 'Unauthorized Update',
      };

      const response = await request(app)
        .put('/api/sessions/session-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/sessions/:id/start', () => {
    it('should allow trainer to start session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .post('/api/sessions/session-1/start')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('in_progress');
      expect(response.body.actualStartTime).toBeDefined();
    });

    it('should prevent starting already completed session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .post('/api/sessions/session-2/start')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toContain('already completed');
    });
  });

  describe('POST /api/sessions/:id/complete', () => {
    it('should allow trainer to complete session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      // First start the session
      await request(app)
        .post('/api/sessions/session-1/start')
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .post('/api/sessions/session-1/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Session completed successfully',
          summary: 'All participants performed well',
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.actualEndTime).toBeDefined();
      expect(response.body.notes).toBe('Session completed successfully');
    });
  });

  describe('POST /api/sessions/:id/participants', () => {
    it('should allow adding participants to session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const participantData = {
        playerIds: ['player-789', 'player-890'],
      };

      const response = await request(app)
        .post('/api/sessions/session-1/participants')
        .set('Authorization', `Bearer ${token}`)
        .send(participantData)
        .expect(201);

      expect(response.body.added).toBe(2);
      expect(response.body.participants).toBeDefined();
    });

    it('should enforce max participants limit', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      
      // Try to add too many participants
      const playerIds = Array.from({ length: 25 }, (_, i) => `player-${1000 + i}`);
      
      const response = await request(app)
        .post('/api/sessions/session-1/participants')
        .set('Authorization', `Bearer ${token}`)
        .send({ playerIds })
        .expect(400);

      expect(response.body.error).toContain('Maximum participants');
    });
  });

  describe('POST /api/sessions/:id/checkin', () => {
    it('should allow player to check in to session', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .post('/api/sessions/session-1/checkin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.attendanceStatus).toBe('present');
      expect(response.body.checkInTime).toBeDefined();
    });

    it('should prevent check-in if not a participant', async () => {
      const unauthorizedPlayer = createTestUser({
        id: 'player-999',
        role: 'player',
        organizationId: 'org-123',
      });
      const token = createTestToken(unauthorizedPlayer, JWT_SECRET);

      const response = await request(app)
        .post('/api/sessions/session-1/checkin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('Not a participant');
    });
  });

  describe('POST /api/sessions/:id/metrics', () => {
    it('should allow trainer to record performance metrics', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);
      const metricData = {
        playerId: 'player-123',
        exerciseId: 'exercise-1',
        metrics: [
          {
            metricType: 'weight',
            value: 65,
            unit: 'kg',
            notes: 'Increased from last session',
          },
          {
            metricType: 'reps',
            value: 12,
            unit: 'count',
          },
        ],
      };

      const response = await request(app)
        .post('/api/sessions/session-1/metrics')
        .set('Authorization', `Bearer ${token}`)
        .send(metricData)
        .expect(201);

      expect(response.body.metrics).toHaveLength(2);
      expect(response.body.metrics[0].playerId).toBe(metricData.playerId);
    });

    it('should allow players to self-report metrics', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const metricData = {
        exerciseId: 'exercise-1',
        metrics: [
          {
            metricType: 'rpe',
            value: 7,
            unit: 'scale',
            notes: 'Felt challenging but manageable',
          },
        ],
      };

      const response = await request(app)
        .post('/api/sessions/session-1/metrics')
        .set('Authorization', `Bearer ${token}`)
        .send(metricData)
        .expect(201);

      expect(response.body.metrics[0].playerId).toBe(player.id);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should allow trainer to cancel scheduled session', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .delete('/api/sessions/session-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Trainer unavailable' })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancellationReason).toBe('Trainer unavailable');
    });

    it('should prevent deletion of completed sessions', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .delete('/api/sessions/session-2')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete completed session');
    });
  });

  describe('GET /api/sessions/stats', () => {
    it('should provide session statistics for trainers', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalSessions).toBeDefined();
      expect(response.body.completedSessions).toBeDefined();
      expect(response.body.averageAttendance).toBeDefined();
      expect(response.body.byType).toBeDefined();
      expect(response.body.popularExercises).toBeDefined();
    });

    it('should allow filtering stats by date range', async () => {
      const token = createTestToken(physicalTrainer, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/stats?startDate=2025-07-01&endDate=2025-07-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.dateRange).toBeDefined();
      expect(response.body.totalSessions).toBeGreaterThanOrEqual(0);
    });

    it('should provide player-specific stats', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/sessions/stats/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalSessions).toBeDefined();
      expect(response.body.attendanceRate).toBeDefined();
      expect(response.body.performanceProgress).toBeDefined();
    });
  });
});