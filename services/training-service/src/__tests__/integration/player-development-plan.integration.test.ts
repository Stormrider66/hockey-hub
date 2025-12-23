import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { 
  PlayerDevelopmentPlan, 
  CurrentLevel, 
  DevelopmentGoal, 
  WeeklyPlan, 
  Milestone, 
  ParentCommunication,
  ExternalResource
} from '../../entities/PlayerDevelopmentPlan';
import { playerDevelopmentPlanRoutes } from '../../routes/coach/player-development-plan.routes';

describe('Player Development Plan Integration Tests', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [PlayerDevelopmentPlan];
  const { getDataSource } = setupTestDatabase('training-service-dev-plans', entities, { inMemory: true });

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['development-plan.create', 'development-plan.view', 'development-plan.update', 'development-plan.delete'],
  });

  const developmentCoach = createTestUser({
    id: 'dev-coach-456',
    role: 'development-coach',
    email: 'dev.coach@example.com',
    organizationId: 'org-123',
    permissions: ['development-plan.create', 'development-plan.view', 'development-plan.update', 'development-plan.view.all'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['development-plan.view:own'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['development-plan.view:child'],
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
    app.use('/api/development-plans', playerDevelopmentPlanRoutes);
    app.use(errorHandler);

    if (dataSource) {
      await seedTestData();
    }
  });

  async function seedTestData() {
    const ds = getDataSource();
    if (!ds) return;

    const planRepo = ds.getRepository(PlayerDevelopmentPlan);
    
    const currentLevel: CurrentLevel = {
      overallRating: 75,
      strengths: ['Vision', 'Passing', 'Hockey IQ'],
      weaknesses: ['Slapshot Power', 'Defensive Positioning'],
      recentEvaluation: 'eval-123'
    };

    const goals: DevelopmentGoal[] = [
      {
        id: 'goal-1',
        category: 'technical',
        skill: 'Slapshot Power',
        currentLevel: 6,
        targetLevel: 8,
        deadline: new Date('2025-04-01'),
        specificActions: [
          'Weight training 3x per week',
          'Shot practice with focus on follow-through',
          'Video analysis of NHL power shooters'
        ],
        measurementMethod: 'Shot velocity measurement',
        progress: 25,
        status: 'in_progress'
      },
      {
        id: 'goal-2',
        category: 'tactical',
        skill: 'Defensive Positioning',
        currentLevel: 5,
        targetLevel: 7,
        deadline: new Date('2025-03-15'),
        specificActions: [
          'Position-specific drills',
          'Video review of positioning mistakes',
          'Shadow defensive specialist in practice'
        ],
        measurementMethod: 'Coach evaluation during games',
        progress: 40,
        status: 'in_progress'
      }
    ];

    const weeklyPlan: WeeklyPlan[] = [
      {
        week: 1,
        focus: ['Shot technique', 'Defensive reads'],
        drills: ['drill-power-shot-1', 'drill-gap-control-1'],
        targetMetrics: { shotVelocity: 85, positioningScore: 7 }
      },
      {
        week: 2,
        focus: ['Power development', 'Game situations'],
        drills: ['drill-power-shot-2', 'drill-defensive-scenarios'],
        targetMetrics: { shotVelocity: 87, positioningScore: 7.2 },
        actualMetrics: { shotVelocity: 86, positioningScore: 7.1 }
      }
    ];

    const milestones: Milestone[] = [
      {
        date: new Date('2025-02-15'),
        description: 'Shot velocity improvement',
        metric: 'Shot velocity (km/h)',
        target: 88,
        achieved: 86,
        status: 'achieved'
      },
      {
        date: new Date('2025-03-01'),
        description: 'Defensive positioning evaluation',
        metric: 'Coach rating (1-10)',
        target: 7,
        status: 'pending'
      }
    ];

    const parentComms: ParentCommunication[] = [
      {
        date: new Date('2025-01-15'),
        method: 'meeting',
        summary: 'Discussed development goals and timeline',
        nextFollowUp: new Date('2025-02-15')
      }
    ];

    const resources: ExternalResource[] = [
      {
        type: 'video',
        name: 'NHL Power Shot Analysis',
        url: 'https://example.com/video/power-shot',
        assignedDate: new Date('2025-01-10')
      }
    ];

    await planRepo.save([
      {
        id: 'plan-1',
        playerId: 'player-123',
        coachId: 'coach-123',
        seasonId: 'season-2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-05-31'),
        currentLevel,
        goals,
        weeklyPlan,
        milestones,
        parentCommunication: parentComms,
        externalResources: resources,
        status: 'active',
        notes: 'Player is motivated and showing good progress'
      },
      {
        id: 'plan-2',
        playerId: 'player-456',
        coachId: 'coach-123',
        seasonId: 'season-2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-05-31'),
        currentLevel: { ...currentLevel, overallRating: 68 },
        goals: goals.slice(0, 1),
        weeklyPlan: weeklyPlan.slice(0, 1),
        milestones: milestones.slice(0, 1),
        status: 'active'
      }
    ]);
  }

  describe('POST /api/development-plans', () => {
    it('should allow coach to create development plan', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const planData = {
        playerId: 'player-789',
        seasonId: 'season-2025',
        startDate: '2025-01-01',
        endDate: '2025-05-31',
        currentLevel: {
          overallRating: 70,
          strengths: ['Speed', 'Agility'],
          weaknesses: ['Shot accuracy', 'Face-offs'],
          recentEvaluation: 'eval-456'
        },
        goals: [
          {
            category: 'technical',
            skill: 'Shot Accuracy',
            currentLevel: 5,
            targetLevel: 8,
            deadline: '2025-03-31',
            specificActions: ['Accuracy drills daily', 'Target practice'],
            measurementMethod: 'Shooting accuracy percentage',
            progress: 0,
            status: 'not_started'
          }
        ],
        milestones: [
          {
            date: '2025-02-28',
            description: 'Mid-season accuracy test',
            metric: 'Shooting accuracy %',
            target: 75,
            status: 'pending'
          }
        ]
      };

      const response = await request(app)
        .post('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .send(planData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.playerId).toBe(planData.playerId);
      expect(response.body.coachId).toBe(coach.id);
      expect(response.body.status).toBe('active');
      expect(response.body.goals).toHaveLength(1);
      expect(response.body.goals[0].id).toBeDefined();
    });

    it('should validate goal deadlines are realistic', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const planData = {
        playerId: 'player-validation',
        seasonId: 'season-2025',
        startDate: '2025-01-01',
        endDate: '2025-05-31',
        goals: [
          {
            category: 'technical',
            skill: 'Shot Accuracy',
            currentLevel: 5,
            targetLevel: 8,
            deadline: '2025-01-02', // Too soon
            specificActions: ['Practice'],
            measurementMethod: 'Test'
          }
        ]
      };

      const response = await request(app)
        .post('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .send(planData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('deadline must allow sufficient development time');
    });

    it('should prevent unauthorized users from creating plans', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const planData = {
        playerId: 'player-123',
        seasonId: 'season-2025'
      };

      const response = await request(app)
        .post('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .send(planData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/development-plans', () => {
    it('should allow coach to view their team plans', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((p: any) => p.coachId === coach.id)).toBe(true);
    });

    it('should allow filtering by status', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans?status=active')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const plans = response.body.data;
      expect(plans.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should allow player to view only their own plan', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const plans = response.body.data;
      expect(plans.every((p: any) => p.playerId === player.id)).toBe(true);
    });

    it('should allow parent to view child plans', async () => {
      const token = createTestToken(parent, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const plans = response.body.data;
      expect(plans.every((p: any) => parent.childIds?.includes(p.playerId))).toBe(true);
    });
  });

  describe('PUT /api/development-plans/:id/progress', () => {
    it('should allow coach to update goal progress', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const progressData = {
        goalId: 'goal-1',
        progress: 50,
        actualMetrics: { shotVelocity: 88 },
        notes: 'Good improvement in technique'
      };

      const response = await request(app)
        .put('/api/development-plans/plan-1/progress')
        .set('Authorization', `Bearer ${token}`)
        .send(progressData)
        .expect(200);

      const updatedGoal = response.body.goals.find((g: any) => g.id === 'goal-1');
      expect(updatedGoal.progress).toBe(50);
    });

    it('should allow recording milestone achievements', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const milestoneData = {
        milestoneDate: '2025-02-15',
        achieved: 86,
        status: 'achieved',
        notes: 'Exceeded expectations'
      };

      const response = await request(app)
        .put('/api/development-plans/plan-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send(milestoneData)
        .expect(200);

      const milestone = response.body.milestones.find((m: any) => 
        new Date(m.date).toDateString() === new Date('2025-02-15').toDateString()
      );
      expect(milestone.achieved).toBe(86);
      expect(milestone.status).toBe('achieved');
    });

    it('should track weekly plan completion', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const weeklyData = {
        week: 2,
        actualMetrics: { shotVelocity: 87, positioningScore: 7.3 },
        completed: true,
        notes: 'Strong week, all drills completed'
      };

      const response = await request(app)
        .put('/api/development-plans/plan-1/weekly')
        .set('Authorization', `Bearer ${token}`)
        .send(weeklyData)
        .expect(200);

      const week = response.body.weeklyPlan.find((w: any) => w.week === 2);
      expect(week.actualMetrics.shotVelocity).toBe(87);
      expect(week.completed).toBe(true);
    });
  });

  describe('POST /api/development-plans/:id/communication', () => {
    it('should allow coach to log parent communication', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const commData = {
        method: 'email',
        summary: 'Shared progress update and upcoming focus areas',
        nextFollowUp: '2025-03-01'
      };

      const response = await request(app)
        .post('/api/development-plans/plan-1/communication')
        .set('Authorization', `Bearer ${token}`)
        .send(commData)
        .expect(201);

      expect(response.body.parentCommunication).toBeDefined();
      const lastComm = response.body.parentCommunication[response.body.parentCommunication.length - 1];
      expect(lastComm.method).toBe('email');
      expect(lastComm.summary).toBe(commData.summary);
    });

    it('should automatically schedule follow-ups based on communication type', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const commData = {
        method: 'meeting',
        summary: 'In-person discussion about development progress'
      };

      const response = await request(app)
        .post('/api/development-plans/plan-1/communication')
        .set('Authorization', `Bearer ${token}`)
        .send(commData)
        .expect(201);

      const lastComm = response.body.parentCommunication[response.body.parentCommunication.length - 1];
      expect(lastComm.nextFollowUp).toBeDefined();
      
      // Meeting should schedule follow-up in 2 weeks
      const followUpDate = new Date(lastComm.nextFollowUp);
      const commDate = new Date(lastComm.date);
      const daysDiff = (followUpDate.getTime() - commDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(14, 1);
    });
  });

  describe('PUT /api/development-plans/:id/status', () => {
    it('should allow coach to change plan status', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const statusData = {
        status: 'paused',
        reason: 'Player injury - will resume after recovery'
      };

      const response = await request(app)
        .put('/api/development-plans/plan-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe('paused');
      expect(response.body.notes).toContain(statusData.reason);
    });

    it('should validate status transitions', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const statusData = {
        status: 'completed'
      };

      // Try to complete plan with incomplete goals
      const response = await request(app)
        .put('/api/development-plans/plan-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(400);

      expect(response.body.error).toContain('Cannot complete plan with incomplete goals');
    });
  });

  describe('POST /api/development-plans/:id/resources', () => {
    it('should allow coach to assign external resources', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const resourceData = {
        type: 'course',
        name: 'Advanced Shot Techniques Online Course',
        url: 'https://example.com/course/shot-techniques',
        deadline: '2025-03-15'
      };

      const response = await request(app)
        .post('/api/development-plans/plan-1/resources')
        .set('Authorization', `Bearer ${token}`)
        .send(resourceData)
        .expect(201);

      expect(response.body.externalResources).toBeDefined();
      const lastResource = response.body.externalResources[response.body.externalResources.length - 1];
      expect(lastResource.type).toBe('course');
      expect(lastResource.name).toBe(resourceData.name);
    });

    it('should track resource completion', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const completionData = {
        resourceName: 'NHL Power Shot Analysis',
        completedDate: '2025-01-20',
        playerFeedback: 'Very helpful, learned about follow-through technique'
      };

      const response = await request(app)
        .put('/api/development-plans/plan-1/resources/complete')
        .set('Authorization', `Bearer ${token}`)
        .send(completionData)
        .expect(200);

      const resource = response.body.externalResources.find((r: any) => r.name === completionData.resourceName);
      expect(resource.completedDate).toBeDefined();
      expect(resource.playerFeedback).toBe(completionData.playerFeedback);
    });
  });

  describe('GET /api/development-plans/analytics', () => {
    it('should provide plan progress analytics', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans/analytics?teamId=team-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.overallProgress).toBeDefined();
      expect(response.body.goalCompletionRates).toBeDefined();
      expect(response.body.milestoneAchievements).toBeDefined();
      expect(response.body.playerRankings).toBeDefined();
    });

    it('should provide individual player progress tracking', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans/analytics/player/player-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.progressHistory).toBeDefined();
      expect(response.body.goalTrends).toBeDefined();
      expect(response.body.milestoneTimeline).toBeDefined();
      expect(response.body.parentEngagement).toBeDefined();
    });
  });

  describe('Event Publishing', () => {
    it('should publish plan created event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const planData = {
        playerId: 'player-event-test',
        seasonId: 'season-2025',
        goals: []
      };

      await request(app)
        .post('/api/development-plans')
        .set('Authorization', `Bearer ${token}`)
        .send(planData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('development-plan.created', expect.objectContaining({
        playerId: planData.playerId,
        coachId: coach.id
      }));
    });

    it('should publish milestone achieved event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const milestoneData = {
        milestoneDate: '2025-02-15',
        achieved: 90,
        status: 'achieved'
      };

      await request(app)
        .put('/api/development-plans/plan-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send(milestoneData)
        .expect(200);

      expect(mockPublisher).toHaveBeenCalledWith('milestone.achieved', expect.objectContaining({
        planId: 'plan-1',
        playerId: 'player-123',
        achieved: 90
      }));
    });
  });

  describe('Database Transactions', () => {
    it('should handle concurrent progress updates', async () => {
      const token1 = createTestToken(coach, JWT_SECRET);
      const token2 = createTestToken(developmentCoach, JWT_SECRET);

      const progressData1 = { goalId: 'goal-1', progress: 60 };
      const progressData2 = { goalId: 'goal-2', progress: 70 };

      // Simulate concurrent updates
      const [response1, response2] = await Promise.all([
        request(app)
          .put('/api/development-plans/plan-1/progress')
          .set('Authorization', `Bearer ${token1}`)
          .send(progressData1),
        request(app)
          .put('/api/development-plans/plan-1/progress')
          .set('Authorization', `Bearer ${token2}`)
          .send(progressData2)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify both updates were applied
      const verifyResponse = await request(app)
        .get('/api/development-plans/plan-1')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const goal1 = verifyResponse.body.goals.find((g: any) => g.id === 'goal-1');
      const goal2 = verifyResponse.body.goals.find((g: any) => g.id === 'goal-2');
      
      expect(goal1.progress).toBe(60);
      expect(goal2.progress).toBe(70);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should link to evaluation system', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans/plan-1/linked-evaluations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.recentEvaluation).toBeDefined();
      expect(response.body.evaluationHistory).toBeDefined();
      expect(response.body.progressCorrelation).toBeDefined();
    });

    it('should integrate with training session system', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/development-plans/plan-1/related-sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.plannedSessions).toBeDefined();
      expect(response.body.completedSessions).toBeDefined();
      expect(response.body.skillAlignment).toBeDefined();
    });
  });
});