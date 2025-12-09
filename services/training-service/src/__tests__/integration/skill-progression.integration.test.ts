import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { 
  SkillProgressionTracking, 
  SkillMeasurement, 
  Benchmarks, 
  DrillHistory 
} from '../../entities/SkillProgressionTracking';
import skillProgressionRoutes from '../../routes/coach/skill-progression.routes';

describe('Skill Progression Integration Tests', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [SkillProgressionTracking];
  const { getDataSource } = setupTestDatabase('training-service-skills', entities, { inMemory: true });

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['skill-progression.create', 'skill-progression.view', 'skill-progression.update', 'skill-progression.delete'],
  });

  const skillsCoach = createTestUser({
    id: 'skills-coach-456',
    role: 'skills-coach',
    email: 'skills.coach@example.com',
    organizationId: 'org-123',
    permissions: ['skill-progression.create', 'skill-progression.view', 'skill-progression.update', 'skill-progression.view.all'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['skill-progression.view:own'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['skill-progression.view:child'],
    childIds: ['player-123'],
  });

  beforeAll(async () => {
    try {
      dataSource = getDataSource();
    } catch {
      // Test DB not configured
    }
    
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use('/api/skill-progression', skillProgressionRoutes);
    app.use(errorHandler);

    if (dataSource) {
      await seedTestData();
    }
  });

  async function seedTestData() {
    const ds = getDataSource();
    if (!ds) return;

    const skillRepo = ds.getRepository(SkillProgressionTracking);
    
    const measurements: SkillMeasurement[] = [
      {
        date: new Date('2024-12-01'),
        value: 82,
        unit: 'km/h',
        testConditions: 'Controlled environment, fresh legs',
        evaluatorId: 'coach-123',
        notes: 'Baseline measurement for shot velocity',
        videoReference: 'https://example.com/video/shot-test-1.mp4'
      },
      {
        date: new Date('2025-01-15'),
        value: 85,
        unit: 'km/h',
        testConditions: 'After 6 weeks of training',
        evaluatorId: 'coach-123',
        notes: 'Noticeable improvement in technique',
        videoReference: 'https://example.com/video/shot-test-2.mp4'
      },
      {
        date: new Date('2025-01-22'),
        value: 87,
        unit: 'km/h',
        testConditions: 'Post-practice measurement',
        evaluatorId: 'skills-coach-456',
        notes: 'Continued improvement, good follow-through'
      }
    ];

    const benchmarks: Benchmarks = {
      ageGroup: 'U18',
      elite: 95,
      above_average: 88,
      average: 82,
      below_average: 76
    };

    const drillHistory: DrillHistory[] = [
      {
        date: new Date('2025-01-10'),
        drillId: 'drill-shot-accuracy-1',
        drillName: 'Target Practice - 5 Holes',
        performance: 8.5,
        notes: '17/20 targets hit'
      },
      {
        date: new Date('2025-01-17'),
        drillId: 'drill-shot-accuracy-2',
        drillName: 'Moving Target Practice',
        performance: 7.2,
        notes: '14/20 moving targets hit'
      },
      {
        date: new Date('2025-01-20'),
        drillId: 'drill-shot-power-1',
        drillName: 'Power Shot Development',
        performance: 8.8,
        notes: 'Improved follow-through technique'
      }
    ];

    await skillRepo.save([
      {
        id: 'skill-1',
        playerId: 'player-123',
        coachId: 'coach-123',
        skill: 'Wrist Shot Velocity',
        category: 'Shooting',
        measurements,
        benchmarks,
        drillHistory,
        currentLevel: 87,
        targetLevel: 92,
        improvementRate: 2.1, // 2.1% improvement per month
        startDate: new Date('2024-12-01')
      },
      {
        id: 'skill-2',
        playerId: 'player-123',
        coachId: 'coach-123',
        skill: 'Shot Accuracy',
        category: 'Shooting',
        measurements: [
          {
            date: new Date('2024-12-01'),
            value: 65,
            unit: 'percentage',
            testConditions: 'Stationary targets',
            evaluatorId: 'coach-123',
            notes: 'Baseline accuracy test'
          },
          {
            date: new Date('2025-01-15'),
            value: 72,
            unit: 'percentage',
            testConditions: 'Stationary targets',
            evaluatorId: 'coach-123',
            notes: 'Good improvement in aim'
          }
        ],
        benchmarks: {
          ageGroup: 'U18',
          elite: 90,
          above_average: 82,
          average: 75,
          below_average: 68
        },
        currentLevel: 72,
        targetLevel: 85,
        improvementRate: 4.3,
        startDate: new Date('2024-12-01')
      },
      {
        id: 'skill-3',
        playerId: 'player-456',
        coachId: 'coach-123',
        skill: 'Skating Speed',
        category: 'Skating',
        measurements: [
          {
            date: new Date('2025-01-01'),
            value: 28.5,
            unit: 'km/h',
            testConditions: '40-meter sprint',
            evaluatorId: 'coach-123',
            notes: 'Good acceleration'
          }
        ],
        benchmarks: {
          ageGroup: 'U18',
          elite: 32,
          above_average: 30,
          average: 28,
          below_average: 26
        },
        currentLevel: 28.5,
        targetLevel: 31,
        startDate: new Date('2025-01-01')
      }
    ]);
  }

  describe('POST /api/skill-progression', () => {
    it('should allow coach to create skill tracking', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const skillData = {
        playerId: 'player-new',
        skill: 'Slapshot Power',
        category: 'Shooting',
        initialMeasurement: {
          value: 75,
          unit: 'km/h',
          testConditions: 'Controlled environment',
          notes: 'Baseline measurement'
        },
        targetLevel: 85,
        benchmarks: {
          ageGroup: 'U18',
          elite: 92,
          above_average: 85,
          average: 78,
          below_average: 70
        }
      };

      const response = await request(app)
        .post('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .send(skillData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.playerId).toBe(skillData.playerId);
      expect(response.body.coachId).toBe(coach.id);
      expect(response.body.skill).toBe(skillData.skill);
      expect(response.body.measurements).toHaveLength(1);
      expect(response.body.currentLevel).toBe(skillData.initialMeasurement.value);
    });

    it('should validate measurement values are realistic', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const skillData = {
        playerId: 'player-test',
        skill: 'Shot Velocity',
        category: 'Shooting',
        initialMeasurement: {
          value: 200, // Unrealistic speed
          unit: 'km/h',
          testConditions: 'Test'
        }
      };

      const response = await request(app)
        .post('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .send(skillData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('measurement value appears unrealistic');
    });

    it('should prevent unauthorized users from creating skill tracking', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const skillData = {
        playerId: 'player-123',
        skill: 'Test Skill',
        category: 'Test'
      };

      const response = await request(app)
        .post('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .send(skillData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/skill-progression/:id/measurements', () => {
    it('should allow coach to record new measurement', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const measurementData = {
        value: 89,
        unit: 'km/h',
        testConditions: 'After power training session',
        notes: 'Significant improvement in form',
        videoReference: 'https://example.com/video/progress-test.mp4'
      };

      const response = await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(201);

      expect(response.body.measurements).toHaveLength(4);
      const newMeasurement = response.body.measurements[3];
      expect(newMeasurement.value).toBe(89);
      expect(newMeasurement.evaluatorId).toBe(coach.id);
      expect(response.body.currentLevel).toBe(89);
    });

    it('should automatically calculate improvement rate', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const measurementData = {
        value: 90,
        unit: 'km/h',
        testConditions: 'Regular test'
      };

      const response = await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(201);

      expect(response.body.improvementRate).toBeDefined();
      expect(response.body.improvementRate).toBeGreaterThan(0);
    });

    it('should validate measurement progression is realistic', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const measurementData = {
        value: 120, // Unrealistic jump from 87 to 120
        unit: 'km/h',
        testConditions: 'Test'
      };

      const response = await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('unrealistic improvement');
    });
  });

  describe('POST /api/skill-progression/:id/drills', () => {
    it('should allow linking drill performance to skill progression', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const drillData = {
        drillId: 'drill-new-power',
        drillName: 'Advanced Power Development',
        performance: 9.2,
        notes: 'Excellent technique improvement',
        sessionId: 'session-123'
      };

      const response = await request(app)
        .post('/api/skill-progression/skill-1/drills')
        .set('Authorization', `Bearer ${token}`)
        .send(drillData)
        .expect(201);

      expect(response.body.drillHistory).toBeDefined();
      const newDrill = response.body.drillHistory[response.body.drillHistory.length - 1];
      expect(newDrill.drillName).toBe(drillData.drillName);
      expect(newDrill.performance).toBe(drillData.performance);
    });

    it('should correlate drill performance with skill measurements', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/skill-1/performance-correlation')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.drillCorrelation).toBeDefined();
      expect(response.body.effectiveDrills).toBeDefined();
      expect(response.body.improvementTrends).toBeDefined();
    });
  });

  describe('GET /api/skill-progression', () => {
    it('should allow coach to view team skill progressions', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((s: any) => s.coachId === coach.id)).toBe(true);
    });

    it('should allow filtering by skill category', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression?category=Shooting')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const skills = response.body.data;
      expect(skills.every((s: any) => s.category === 'Shooting')).toBe(true);
    });

    it('should allow player to view only their own progressions', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const skills = response.body.data;
      expect(skills.every((s: any) => s.playerId === player.id)).toBe(true);
    });

    it('should show progress trends in response', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/skill-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.progressTrend).toBeDefined();
      expect(response.body.timeToTarget).toBeDefined();
      expect(response.body.benchmarkComparison).toBeDefined();
    });
  });

  describe('GET /api/skill-progression/analytics', () => {
    it('should provide team skill development analytics', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/analytics?teamId=team-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.teamAverages).toBeDefined();
      expect(response.body.improvementRates).toBeDefined();
      expect(response.body.skillDistribution).toBeDefined();
      expect(response.body.benchmarkComparisons).toBeDefined();
      expect(response.body.topPerformers).toBeDefined();
    });

    it('should identify players needing additional support', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/analytics/at-risk')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.slowProgressPlayers).toBeDefined();
      expect(response.body.stagnantSkills).toBeDefined();
      expect(response.body.recommendedInterventions).toBeDefined();
    });

    it('should show benchmark comparisons across age groups', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/benchmarks?ageGroup=U18&skill=Wrist Shot Velocity')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.benchmarks).toBeDefined();
      expect(response.body.playerRankings).toBeDefined();
      expect(response.body.improvementOpportunities).toBeDefined();
    });
  });

  describe('PUT /api/skill-progression/:id/targets', () => {
    it('should allow coach to adjust target levels', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const targetData = {
        targetLevel: 95,
        reason: 'Player showing exceptional progress, raising target',
        timeline: 'End of season'
      };

      const response = await request(app)
        .put('/api/skill-progression/skill-1/targets')
        .set('Authorization', `Bearer ${token}`)
        .send(targetData)
        .expect(200);

      expect(response.body.targetLevel).toBe(95);
      expect(response.body.targetAdjustmentHistory).toBeDefined();
    });

    it('should recalculate improvement rate needed for new target', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const targetData = {
        targetLevel: 90,
        timeline: '2025-05-31'
      };

      const response = await request(app)
        .put('/api/skill-progression/skill-1/targets')
        .set('Authorization', `Bearer ${token}`)
        .send(targetData)
        .expect(200);

      expect(response.body.requiredImprovementRate).toBeDefined();
      expect(response.body.feasibilityAssessment).toBeDefined();
    });
  });

  describe('GET /api/skill-progression/comparisons', () => {
    it('should allow comparing multiple players on same skill', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/comparisons?skill=Wrist Shot Velocity&playerIds=player-123,player-456')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.playerComparisons).toBeDefined();
      expect(response.body.progressionCharts).toBeDefined();
      expect(response.body.relativeBenchmarks).toBeDefined();
    });

    it('should show peer group performance for individual player', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/skill-1/peer-comparison')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.peerGroup).toBeDefined();
      expect(response.body.ranking).toBeDefined();
      expect(response.body.improvementVsPeers).toBeDefined();
    });
  });

  describe('Event Publishing', () => {
    it('should publish skill measurement recorded event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const measurementData = {
        value: 88,
        unit: 'km/h',
        testConditions: 'Event test'
      };

      await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('skill-measurement.recorded', expect.objectContaining({
        skillId: 'skill-1',
        playerId: 'player-123',
        newValue: 88,
        improvement: expect.any(Number)
      }));
    });

    it('should publish target achieved event when reached', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      // Record measurement that reaches target
      const measurementData = {
        value: 92, // Matches target level
        unit: 'km/h',
        testConditions: 'Target achievement test'
      };

      await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('skill-target.achieved', expect.objectContaining({
        skillId: 'skill-1',
        playerId: 'player-123',
        skill: 'Wrist Shot Velocity',
        targetValue: 92
      }));
    });
  });

  describe('Cache Integration', () => {
    it('should cache skill progression data', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { 
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn()
      };
      app.locals.cache = mockCache;

      await request(app)
        .get('/api/skill-progression')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('skill-progression:coach:coach-123')
      );
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should invalidate cache after new measurements', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { del: jest.fn() };
      app.locals.cache = mockCache;

      const measurementData = { value: 88, unit: 'km/h' };

      await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(measurementData)
        .expect(201);

      expect(mockCache.del).toHaveBeenCalledWith(
        expect.stringContaining('skill-progression:player:player-123')
      );
    });
  });

  describe('Database Transactions', () => {
    it('should handle concurrent measurement recordings', async () => {
      const token1 = createTestToken(coach, JWT_SECRET);
      const token2 = createTestToken(skillsCoach, JWT_SECRET);

      const measurement1 = { value: 88, unit: 'km/h', notes: 'Coach test' };
      const measurement2 = { value: 89, unit: 'km/h', notes: 'Skills coach test' };

      // Simulate concurrent measurements (would normally not happen, but tests edge case)
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/skill-progression/skill-1/measurements')
          .set('Authorization', `Bearer ${token1}`)
          .send(measurement1),
        request(app)
          .post('/api/skill-progression/skill-2/measurements')
          .set('Authorization', `Bearer ${token2}`)
          .send(measurement2)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });

    it('should rollback on measurement validation failure', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      
      // Get current measurement count
      const beforeResponse = await request(app)
        .get('/api/skill-progression/skill-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      const initialCount = beforeResponse.body.measurements.length;

      // Try to record invalid measurement
      const invalidMeasurement = {
        value: 150, // Unrealistic
        unit: 'km/h',
        testConditions: 'Test'
      };

      await request(app)
        .post('/api/skill-progression/skill-1/measurements')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidMeasurement)
        .expect(400);

      // Verify no measurement was added
      const afterResponse = await request(app)
        .get('/api/skill-progression/skill-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(afterResponse.body.measurements.length).toBe(initialCount);
    });
  });

  describe('Cross-Service References', () => {
    it('should link skill progression to training sessions', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/skill-1/training-sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.relatedSessions).toBeDefined();
      expect(response.body.skillSpecificDrills).toBeDefined();
      expect(response.body.progressCorrelation).toBeDefined();
    });

    it('should integrate with evaluation system', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/skill-progression/skill-1/evaluation-correlation')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.evaluationScores).toBeDefined();
      expect(response.body.objectiveVsSubjective).toBeDefined();
      expect(response.body.consistencyAnalysis).toBeDefined();
    });
  });
});