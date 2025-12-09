import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { PlayerEvaluation, TechnicalSkills, TacticalSkills, PhysicalAttributes, MentalAttributes, DevelopmentPriority } from '../../entities/PlayerEvaluation';
import playerEvaluationRoutes from '../../routes/coach/player-evaluation.routes';

describe('Player Evaluation Integration Tests', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [PlayerEvaluation];
  const { getDataSource } = setupTestDatabase('training-service-evaluations', entities, { inMemory: true });

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['evaluation.create', 'evaluation.view', 'evaluation.update', 'evaluation.delete'],
  });

  const headCoach = createTestUser({
    id: 'head-coach-456',
    role: 'head-coach',
    email: 'head.coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['evaluation.create', 'evaluation.view', 'evaluation.update', 'evaluation.delete', 'evaluation.view.all'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['evaluation.view:own'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['evaluation.view:child'],
    childIds: ['player-123'],
  });

  const unauthorizedCoach = createTestUser({
    id: 'other-coach-789',
    role: 'coach',
    email: 'other@example.com',
    organizationId: 'org-456',
    teamId: 'team-456',
    permissions: ['evaluation.create', 'evaluation.view', 'evaluation.update'],
  });

  beforeAll(async () => {
    try {
      dataSource = getDataSource();
    } catch {
      // Test DB not configured, skip DB operations
    }
    
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use('/api/evaluations', playerEvaluationRoutes);
    app.use(errorHandler);

    if (dataSource) {
      await seedTestData();
    }
  });

  async function seedTestData() {
    const ds = getDataSource();
    if (!ds) return;

    const evaluationRepo = ds.getRepository(PlayerEvaluation);
    
    const sampleTechnical: TechnicalSkills = {
      skating: { forward: 8, backward: 7, acceleration: 8, agility: 7, speed: 9, balance: 8, edgeWork: 7 },
      puckHandling: { carrying: 8, protection: 7, deking: 8, receiving: 9, inTraffic: 7 },
      shooting: { wristShot: 8, slapShot: 6, snapshot: 9, backhand: 7, accuracy: 8, release: 9, power: 7 },
      passing: { forehand: 9, backhand: 7, saucer: 8, accuracy: 9, timing: 8, vision: 9 }
    };

    const sampleTactical: TacticalSkills = {
      offensive: { positioning: 8, spacing: 7, timing: 8, creativity: 9, finishing: 7 },
      defensive: { positioning: 7, gapControl: 6, stickPosition: 8, bodyPosition: 7, anticipation: 8 },
      transition: { breakouts: 8, rushes: 9, tracking: 7, backchecking: 7 }
    };

    const samplePhysical: PhysicalAttributes = {
      strength: 7, speed: 9, endurance: 8, flexibility: 6, balance: 8, coordination: 9
    };

    const sampleMental: MentalAttributes = {
      hockeyIQ: 9, competitiveness: 8, workEthic: 9, coachability: 8, leadership: 7,
      teamwork: 9, discipline: 8, confidence: 7, focusUnderPressure: 8
    };

    const samplePriorities: DevelopmentPriority[] = [
      { priority: 1, skill: 'Slapshot Power', targetImprovement: '15% increase', timeline: '3 months' },
      { priority: 2, skill: 'Defensive Positioning', targetImprovement: 'Better gap control', timeline: '2 months' }
    ];

    await evaluationRepo.save([
      {
        id: 'eval-1',
        playerId: 'player-123',
        coachId: 'coach-123',
        teamId: 'team-123',
        evaluationDate: new Date('2025-01-15'),
        type: 'midseason',
        technicalSkills: sampleTechnical,
        tacticalSkills: sampleTactical,
        physicalAttributes: samplePhysical,
        mentalAttributes: sampleMental,
        strengths: 'Excellent vision and passing ability',
        areasForImprovement: 'Needs to improve slapshot power and defensive positioning',
        coachComments: 'Talented player with high hockey IQ',
        developmentPriorities: samplePriorities,
        overallRating: 82,
        potential: 'Elite'
      },
      {
        id: 'eval-2',
        playerId: 'player-456',
        coachId: 'coach-123',
        teamId: 'team-123',
        evaluationDate: new Date('2025-01-10'),
        type: 'preseason',
        technicalSkills: { ...sampleTechnical, shooting: { ...sampleTechnical.shooting, power: 5 } },
        tacticalSkills: sampleTactical,
        physicalAttributes: samplePhysical,
        mentalAttributes: sampleMental,
        developmentPriorities: samplePriorities,
        overallRating: 75,
        potential: 'High'
      }
    ]);
  }

  describe('POST /api/evaluations', () => {
    it('should allow coach to create player evaluation', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const evaluationData = {
        playerId: 'player-789',
        teamId: 'team-123',
        evaluationDate: '2025-01-20',
        type: 'monthly',
        technicalSkills: {
          skating: { forward: 7, backward: 6, acceleration: 7, agility: 6, speed: 8, balance: 7, edgeWork: 6 },
          puckHandling: { carrying: 7, protection: 6, deking: 7, receiving: 8, inTraffic: 6 },
          shooting: { wristShot: 7, slapShot: 5, snapshot: 8, backhand: 6, accuracy: 7, release: 8, power: 6 },
          passing: { forehand: 8, backhand: 6, saucer: 7, accuracy: 8, timing: 7, vision: 8 }
        },
        tacticalSkills: {
          offensive: { positioning: 7, spacing: 6, timing: 7, creativity: 8, finishing: 6 },
          defensive: { positioning: 6, gapControl: 5, stickPosition: 7, bodyPosition: 6, anticipation: 7 },
          transition: { breakouts: 7, rushes: 8, tracking: 6, backchecking: 6 }
        },
        physicalAttributes: { strength: 6, speed: 8, endurance: 7, flexibility: 5, balance: 7, coordination: 8 },
        mentalAttributes: {
          hockeyIQ: 8, competitiveness: 7, workEthic: 8, coachability: 7, leadership: 6,
          teamwork: 8, discipline: 7, confidence: 6, focusUnderPressure: 7
        },
        strengths: 'Good speed and hockey sense',
        areasForImprovement: 'Needs to improve defensive positioning and slapshot',
        developmentPriorities: [
          { priority: 1, skill: 'Gap Control', targetImprovement: 'Better positioning', timeline: '2 months' }
        ],
        overallRating: 72
      };

      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send(evaluationData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.playerId).toBe(evaluationData.playerId);
      expect(response.body.coachId).toBe(coach.id);
      expect(response.body.overallRating).toBe(evaluationData.overallRating);
    });

    it('should validate skill ratings are within 1-10 range', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const invalidData = {
        playerId: 'player-789',
        teamId: 'team-123',
        evaluationDate: '2025-01-20',
        type: 'monthly',
        technicalSkills: {
          skating: { forward: 11, backward: 6, acceleration: 7, agility: 6, speed: 8, balance: 7, edgeWork: 6 },
          // ... other skills
        }
      };

      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('rating must be between 1 and 10');
    });

    it('should prevent unauthorized coaches from creating evaluations', async () => {
      const token = createTestToken(unauthorizedCoach, JWT_SECRET);
      const evaluationData = {
        playerId: 'player-123',
        teamId: 'team-123',
        evaluationDate: '2025-01-20',
        type: 'monthly'
      };

      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send(evaluationData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should create team-wide evaluations in bulk', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkData = {
        teamId: 'team-123',
        evaluationDate: '2025-01-25',
        type: 'game',
        playerIds: ['player-123', 'player-456', 'player-789'],
        template: {
          technicalSkills: {
            skating: { forward: 7, backward: 6, acceleration: 7, agility: 6, speed: 8, balance: 7, edgeWork: 6 },
            puckHandling: { carrying: 7, protection: 6, deking: 7, receiving: 8, inTraffic: 6 },
            shooting: { wristShot: 7, slapShot: 5, snapshot: 8, backhand: 6, accuracy: 7, release: 8, power: 6 },
            passing: { forehand: 8, backhand: 6, saucer: 7, accuracy: 8, timing: 7, vision: 8 }
          }
        }
      };

      const response = await request(app)
        .post('/api/evaluations/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkData)
        .expect(201);

      expect(response.body.created).toBe(3);
      expect(response.body.evaluations).toHaveLength(3);
    });
  });

  describe('GET /api/evaluations', () => {
    it('should allow coach to view team evaluations', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((e: any) => e.teamId === coach.teamId)).toBe(true);
    });

    it('should allow filtering by evaluation type', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations?type=midseason')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const evaluations = response.body.data;
      expect(evaluations.every((e: any) => e.type === 'midseason')).toBe(true);
    });

    it('should allow filtering by date range', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations?startDate=2025-01-01&endDate=2025-01-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const evaluations = response.body.data;
      evaluations.forEach((evaluation: any) => {
        const evalDate = new Date(evaluation.evaluationDate);
        expect(evalDate >= new Date('2025-01-01')).toBe(true);
        expect(evalDate <= new Date('2025-01-31')).toBe(true);
      });
    });

    it('should support comparison features for multiple players', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations/compare?playerIds=player-123,player-456&skills=skating,shooting')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.comparison).toBeDefined();
      expect(response.body.comparison.players).toHaveLength(2);
      expect(response.body.comparison.skillsCompared).toContain('skating');
      expect(response.body.comparison.skillsCompared).toContain('shooting');
    });

    it('should allow player to view only own evaluations', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const evaluations = response.body.data;
      expect(evaluations.every((e: any) => e.playerId === player.id)).toBe(true);
    });

    it('should allow parent to view child evaluations', async () => {
      const token = createTestToken(parent, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const evaluations = response.body.data;
      expect(evaluations.every((e: any) => parent.childIds?.includes(e.playerId))).toBe(true);
    });
  });

  describe('GET /api/evaluations/:id', () => {
    it('should return detailed evaluation with all skill breakdowns', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('eval-1');
      expect(response.body.technicalSkills).toBeDefined();
      expect(response.body.technicalSkills.skating).toBeDefined();
      expect(response.body.tacticalSkills).toBeDefined();
      expect(response.body.physicalAttributes).toBeDefined();
      expect(response.body.mentalAttributes).toBeDefined();
      expect(response.body.developmentPriorities).toBeDefined();
    });

    it('should prevent unauthorized access to evaluations', async () => {
      const token = createTestToken(unauthorizedCoach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access denied');
    });
  });

  describe('PUT /api/evaluations/:id', () => {
    it('should allow coach to update evaluation', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const updateData = {
        overallRating: 85,
        coachComments: 'Significant improvement in recent games',
        strengths: 'Excellent vision, passing, and improved slapshot power'
      };

      const response = await request(app)
        .put('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.overallRating).toBe(85);
      expect(response.body.coachComments).toBe(updateData.coachComments);
      expect(response.body.strengths).toBe(updateData.strengths);
    });

    it('should prevent updating evaluations from other teams', async () => {
      const token = createTestToken(unauthorizedCoach, JWT_SECRET);
      const updateData = { overallRating: 90 };

      const response = await request(app)
        .put('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('DELETE /api/evaluations/:id', () => {
    it('should allow coach to delete evaluation', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .delete('/api/evaluations/eval-2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');
    });

    it('should prevent deletion by unauthorized users', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .delete('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/evaluations/analytics', () => {
    it('should provide team evaluation analytics', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations/analytics?teamId=team-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.teamAverages).toBeDefined();
      expect(response.body.skillDistribution).toBeDefined();
      expect(response.body.improvementTrends).toBeDefined();
      expect(response.body.potentialBreakdown).toBeDefined();
    });

    it('should provide individual player progression analytics', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/evaluations/analytics/player/player-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.progressionHistory).toBeDefined();
      expect(response.body.skillTrends).toBeDefined();
      expect(response.body.strengthsEvolution).toBeDefined();
      expect(response.body.improvementAreas).toBeDefined();
    });
  });

  describe('Event Publishing', () => {
    it('should publish evaluation created event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const evaluationData = {
        playerId: 'player-new',
        teamId: 'team-123',
        evaluationDate: '2025-01-22',
        type: 'practice',
        overallRating: 78
      };

      // Mock event publisher
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send(evaluationData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('evaluation.created', expect.objectContaining({
        playerId: evaluationData.playerId,
        coachId: coach.id,
        overallRating: evaluationData.overallRating
      }));
    });

    it('should publish evaluation updated event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const updateData = { overallRating: 90 };

      await request(app)
        .put('/api/evaluations/eval-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(mockPublisher).toHaveBeenCalledWith('evaluation.updated', expect.objectContaining({
        evaluationId: 'eval-1',
        changes: expect.any(Object)
      }));
    });
  });

  describe('Cache Integration', () => {
    it('should invalidate cache after evaluation creation', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { del: jest.fn() };
      app.locals.cache = mockCache;

      const evaluationData = {
        playerId: 'player-cache-test',
        teamId: 'team-123',
        evaluationDate: '2025-01-23',
        type: 'monthly',
        overallRating: 80
      };

      await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .send(evaluationData)
        .expect(201);

      expect(mockCache.del).toHaveBeenCalledWith(
        expect.stringContaining('evaluations:team:team-123')
      );
      expect(mockCache.del).toHaveBeenCalledWith(
        expect.stringContaining('evaluations:player:player-cache-test')
      );
    });

    it('should use cached results for repeated requests', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { 
        get: jest.fn().mockResolvedValue(JSON.stringify([])),
        set: jest.fn()
      };
      app.locals.cache = mockCache;

      await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('evaluations:team:team-123')
      );
    });
  });

  describe('Database Transactions', () => {
    it('should rollback on bulk creation failure', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkData = {
        teamId: 'team-123',
        evaluationDate: '2025-01-25',
        type: 'game',
        playerIds: ['player-valid', 'invalid-player-id'],
        template: {} // Invalid template
      };

      const response = await request(app)
        .post('/api/evaluations/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      
      // Verify no partial creations
      const verifyResponse = await request(app)
        .get('/api/evaluations?playerId=player-valid')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const newEvals = verifyResponse.body.data.filter((e: any) => 
        e.evaluationDate === '2025-01-25'
      );
      expect(newEvals).toHaveLength(0);
    });
  });
});