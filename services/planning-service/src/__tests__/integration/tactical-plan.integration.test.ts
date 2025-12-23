/**
 * @file tactical-plan.integration.test.ts
 * @description Comprehensive integration tests for Tactical Plan APIs
 * Tests CRUD operations, search, filtering, authorization, bulk operations, and data validation
 */

import request from 'supertest';
import { Application } from 'express';
import { Connection, createConnection, getRepository, In } from 'typeorm';
import express from 'express';
import { TacticalPlan, TacticalCategory, FormationType, PlayerPositionType, ZoneType } from '../../entities/TacticalPlan';
import { TacticalPlanController } from '../../controllers/coach/tactical-plan.controller';
import { Formation } from '../../entities/Formation';
import { PlaybookPlay } from '../../entities/PlaybookPlay';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { authMiddleware } from '@hockey-hub/shared-lib/dist/middleware/auth.middleware';

// Mock Logger
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    userId: '22222222-2222-4222-8222-222222222222',
    organizationId: '11111111-1111-4111-8111-111111111111',
    role: 'COACH'
  };
  next();
};

describe('Tactical Plan Integration Tests', () => {
  let app: Application;
  let connection: Connection;
  let repository: any;

  // Test data
  const testOrganizationId = '11111111-1111-4111-8111-111111111111';
  const testCoachId = '22222222-2222-4222-8222-222222222222';
  const testTeamId = '33333333-3333-4333-8333-333333333333';
  const otherCoachId = '44444444-4444-4444-8444-444444444444';
  const otherTeamId = '55555555-5555-4555-8555-555555555555';
  const otherOrganizationId = '66666666-6666-4666-8666-666666666666';

  const mockFormation = {
    type: FormationType.EVEN_STRENGTH,
    zones: {
      offensive: [
        { position: PlayerPositionType.LW, x: 100, y: 200, zone: ZoneType.OFFENSIVE, playerId: 'player-1' },
        { position: PlayerPositionType.C, x: 150, y: 200, zone: ZoneType.OFFENSIVE, playerId: 'player-2' }
      ],
      neutral: [],
      defensive: [
        { position: PlayerPositionType.LD, x: 100, y: 100, zone: ZoneType.DEFENSIVE, playerId: 'player-3' }
      ]
    }
  };

  const mockPlayerAssignments = [
    {
      playerId: 'player-1',
      position: 'LW',
      responsibilities: ['Forecheck hard', 'Support down low'],
      alternatePosition: 'RW'
    },
    {
      playerId: 'player-2',
      position: 'C',
      responsibilities: ['Win faceoffs', 'Support defense'],
    }
  ];

  beforeAll(async () => {
    // Create in-memory database connection
    connection = await createConnection({
      // Use sqljs to avoid native sqlite3 dependency (works in pure JS)
      type: 'sqljs',
      autoSave: false,
      location: ':memory:',
      // Include related entities used by relations to avoid metadata errors
      entities: [TacticalPlan, Formation, PlaybookPlay],
      synchronize: true,
      logging: false,
    } as any);

    repository = getRepository(TacticalPlan);

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    // Add routes
    app.post('/api/planning/tactical-plans', TacticalPlanController.create);
    app.get('/api/planning/tactical-plans', TacticalPlanController.list);
    app.get('/api/planning/tactical-plans/search', TacticalPlanController.search);
    app.get('/api/planning/tactical-plans/:id', TacticalPlanController.getById);
    app.put('/api/planning/tactical-plans/:id', TacticalPlanController.update);
    app.delete('/api/planning/tactical-plans/:id', TacticalPlanController.delete);
    app.post('/api/planning/tactical-plans/bulk', TacticalPlanController.bulk);

    // Error handler
    app.use((error: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: error.message });
    });
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.clear();
  });

  describe('POST /api/planning/tactical-plans', () => {
    it('should create a new tactical plan', async () => {
      const createData = {
        name: 'Aggressive Forecheck',
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        description: 'High-pressure forechecking system',
        triggers: [
          { situation: 'Opponent dumps puck', action: 'F1 pressure, F2 support' }
        ]
      };

      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send(createData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: createData.name,
        teamId: createData.teamId,
        category: createData.category,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        isActive: true,
        description: createData.description
      });

      expect(response.body.formation).toEqual(createData.formation);
      expect(response.body.playerAssignments).toEqual(createData.playerAssignments);
      expect(response.body.triggers).toEqual(createData.triggers);

      // Verify in database
      const saved = await repository.findOne({ where: { id: response.body.id } });
      expect(saved).toBeDefined();
      expect(saved.name).toBe(createData.name);
      expect(saved.legacyFormation).toEqual(createData.formation);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Invalid empty name
        teamId: 'invalid-uuid', // Invalid UUID format
        category: 'invalid-category', // Invalid enum
        formation: null, // Missing required field
        playerAssignments: null // Missing required field
      };

      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send(invalidData)
        .expect(400);

      // Check that no plan was created
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Simulate repository failure without tearing down the shared in-memory connection
      const repo = getRepository(TacticalPlan);
      const saveSpy = jest.spyOn(repo, 'save').mockRejectedValueOnce(new Error('Simulated database failure'));

      const createData = {
        name: 'Test Plan',
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments
      };

      await request(app)
        .post('/api/planning/tactical-plans')
        .send(createData)
        .expect(500);

      saveSpy.mockRestore();
    });
  });

  describe('GET /api/planning/tactical-plans', () => {
    beforeEach(async () => {
      // Create test plans
      const testPlans = [
        {
          name: 'Offensive System 1',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          description: 'Primary offensive system',
          isActive: true
        },
        {
          name: 'Defensive System 1',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.DEFENSIVE,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          description: 'Primary defensive system',
          isActive: true
        },
        {
          name: 'Transition System',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: otherTeamId,
          category: TacticalCategory.TRANSITION,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          isActive: true
        },
        {
          name: 'Inactive System',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          isActive: false // This should not appear in results
        }
      ];

      await repository.save(testPlans);
    });

    it('should return paginated tactical plans', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans?page=1&pageSize=2')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        page: 1,
        pageSize: 2,
        total: 3, // Should exclude inactive plan
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((plan: any) => plan.isActive)).toBe(true);
    });

    it('should filter by teamId', async () => {
      const response = await request(app)
        .get(`/api/planning/tactical-plans?teamId=${testTeamId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((plan: any) => plan.teamId === testTeamId)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/planning/tactical-plans?category=${TacticalCategory.OFFENSIVE}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe(TacticalCategory.OFFENSIVE);
    });

    it('should search by name and description', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans?search=defensive')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Defensive');
    });

    it('should combine filters', async () => {
      const response = await request(app)
        .get(`/api/planning/tactical-plans?teamId=${testTeamId}&category=${TacticalCategory.OFFENSIVE}&search=system`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Offensive System 1');
    });

    it('should order by updatedAt DESC', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans')
        .expect(200);

      const dates = response.body.data.map((plan: any) => new Date(plan.updatedAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('GET /api/planning/tactical-plans/search', () => {
    beforeEach(async () => {
      await repository.save([
        {
          name: 'Power Play Setup',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.SPECIAL_TEAMS,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          description: 'Umbrella power play formation',
          isActive: true
        },
        {
          name: 'Penalty Kill',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.SPECIAL_TEAMS,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          description: 'Aggressive penalty kill system',
          isActive: true
        }
      ]);
    });

    it('should search tactical plans', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans/search?q=power')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toContain('Power');
    });

    it('should search in description', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans/search?q=umbrella')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].description).toMatch(/umbrella/i);
    });

    it('should limit search results to 50', async () => {
      // Create many plans
      const manyPlans = Array.from({ length: 60 }, (_, i) => ({
        name: `Test Plan ${i}`,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        description: 'Test plan description',
        isActive: true
      }));

      await repository.save(manyPlans);

      const response = await request(app)
        .get('/api/planning/tactical-plans/search?q=test')
        .expect(200);

      expect(response.body).toHaveLength(50);
    });
  });

  describe('GET /api/planning/tactical-plans/:id', () => {
    let testPlan: any;

    beforeEach(async () => {
      testPlan = await repository.save({
        name: 'Test Plan',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        legacyFormation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });
    });

    it('should return a tactical plan by ID', async () => {
      const response = await request(app)
        .get(`/api/planning/tactical-plans/${testPlan.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPlan.id,
        name: testPlan.name,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId
      });
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/api/planning/tactical-plans/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found');
    });

    it('should return 404 for inactive plan', async () => {
      const inactivePlan = await repository.save({
        name: 'Inactive Plan',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: false
      });

      const response = await request(app)
        .get(`/api/planning/tactical-plans/${inactivePlan.id}`)
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found');
    });
  });

  describe('PUT /api/planning/tactical-plans/:id', () => {
    let testPlan: any;

    beforeEach(async () => {
      testPlan = await repository.save({
        name: 'Original Plan',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        legacyFormation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        description: 'Original description',
        isActive: true
      });
    });

    it('should update a tactical plan', async () => {
      const updates = {
        name: 'Updated Plan',
        description: 'Updated description',
        category: TacticalCategory.DEFENSIVE
      };

      const response = await request(app)
        .put(`/api/planning/tactical-plans/${testPlan.id}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPlan.id,
        name: updates.name,
        description: updates.description,
        category: updates.category
      });

      // Verify in database
      const updated = await repository.findOne({ where: { id: testPlan.id } });
      expect(updated.name).toBe(updates.name);
      expect(updated.description).toBe(updates.description);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .put('/api/planning/tactical-plans/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found or no permission to update');
    });

    it('should enforce coach ownership', async () => {
      // Create plan by different coach
      const otherCoachPlan = await repository.save({
        name: 'Other Coach Plan',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      const response = await request(app)
        .put(`/api/planning/tactical-plans/${otherCoachPlan.id}`)
        .send({ name: 'Hacked Update' })
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found or no permission to update');
    });
  });

  describe('DELETE /api/planning/tactical-plans/:id', () => {
    let testPlan: any;

    beforeEach(async () => {
      testPlan = await repository.save({
        name: 'Plan to Delete',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        legacyFormation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });
    });

    it('should soft delete a tactical plan', async () => {
      const response = await request(app)
        .delete(`/api/planning/tactical-plans/${testPlan.id}`)
        .expect(204);

      // Verify soft deletion
      const deleted = await repository.findOne({ where: { id: testPlan.id } });
      expect(deleted.isActive).toBe(false);

      // Should not appear in active plans list
      const listResponse = await request(app)
        .get('/api/planning/tactical-plans')
        .expect(200);

      expect(listResponse.body.data.find((plan: any) => plan.id === testPlan.id)).toBeUndefined();
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .delete('/api/planning/tactical-plans/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found or no permission to delete');
    });

    it('should enforce coach ownership for deletion', async () => {
      const otherCoachPlan = await repository.save({
        name: 'Other Coach Plan',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      const response = await request(app)
        .delete(`/api/planning/tactical-plans/${otherCoachPlan.id}`)
        .expect(404);

      expect(response.body.error).toBe('Tactical plan not found or no permission to delete');

      // Plan should still be active
      const stillActive = await repository.findOne({ where: { id: otherCoachPlan.id } });
      expect(stillActive.isActive).toBe(true);
    });
  });

  describe('POST /api/planning/tactical-plans/bulk', () => {
    let testPlans: any[];

    beforeEach(async () => {
      testPlans = await repository.save([
        {
          name: 'Plan 1',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          legacyFormation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          isActive: true
        },
        {
          name: 'Plan 2',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          category: TacticalCategory.DEFENSIVE,
          legacyFormation: mockFormation,
          playerAssignments: mockPlayerAssignments,
          isActive: true
        }
      ]);
    });

    it('should bulk delete tactical plans', async () => {
      const planIds = testPlans.map(plan => plan.id);

      const response = await request(app)
        .post('/api/planning/tactical-plans/bulk')
        .send({ action: 'delete', planIds })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        affectedCount: planIds.length
      });

      // Verify soft deletion
      const deletedPlans = await repository.find({
        where: { id: In(planIds) }
      });

      expect(deletedPlans.every((plan: any) => !plan.isActive)).toBe(true);
    });

    it('should bulk duplicate tactical plans', async () => {
      const planIds = testPlans.map(plan => plan.id);

      const response = await request(app)
        .post('/api/planning/tactical-plans/bulk')
        .send({ action: 'duplicate', planIds })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        affectedCount: planIds.length
      });

      // Verify duplicates were created
      const allPlans = await repository.find();
      const duplicates = allPlans.filter((plan: any) => plan.name.includes('(Copy)'));
      expect(duplicates).toHaveLength(testPlans.length);
    });

    it('should only affect coach-owned plans', async () => {
      // Create plan by another coach
      const otherCoachPlan = await repository.save({
        name: 'Other Coach Plan',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      const planIds = [...testPlans.map(plan => plan.id), otherCoachPlan.id];

      await request(app)
        .post('/api/planning/tactical-plans/bulk')
        .send({ action: 'delete', planIds })
        .expect(200);

      // Other coach's plan should remain active
      const otherPlan = await repository.findOne({ where: { id: otherCoachPlan.id } });
      expect(otherPlan.isActive).toBe(true);

      // Current coach's plans should be inactive
      for (const plan of testPlans) {
        const deleted = await repository.findOne({ where: { id: plan.id } });
        expect(deleted.isActive).toBe(false);
      }
    });

    it('should handle invalid bulk action', async () => {
      const response = await request(app)
        .post('/api/planning/tactical-plans/bulk')
        .send({ action: 'invalid', planIds: [testPlans[0].id] })
        .expect(400);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication', async () => {
      // Create app without auth middleware
      const unauthedApp = express();
      unauthedApp.use(express.json());
      unauthedApp.post('/api/planning/tactical-plans', TacticalPlanController.create);

      await request(unauthedApp)
        .post('/api/planning/tactical-plans')
        .send({
          name: 'Test Plan',
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments
        })
        .expect(401);
    });

    it('should isolate data by organization', async () => {
      // Create plan for different organization
      const otherOrgPlan = await repository.save({
        name: 'Other Org Plan',
        organizationId: otherOrganizationId,
        coachId: otherCoachId,
        teamId: otherTeamId,
        category: TacticalCategory.OFFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      const response = await request(app)
        .get('/api/planning/tactical-plans')
        .expect(200);

      // Should not see other org's plans
      expect(response.body.data.find((plan: any) => plan.organizationId === otherOrganizationId)).toBeUndefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many plans
      const largePlanSet = Array.from({ length: 1000 }, (_, i) => ({
        name: `Performance Plan ${i}`,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: i % 2 === 0 ? testTeamId : otherTeamId,
        category: i % 4 === 0 ? TacticalCategory.OFFENSIVE : TacticalCategory.DEFENSIVE,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        description: `Performance test plan number ${i}`,
        isActive: true
      }));

      await repository.save(largePlanSet);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/planning/tactical-plans?page=1&pageSize=100')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.data).toHaveLength(100);
      expect(response.body.total).toBe(1000);
    });

    it('should handle complex search queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/planning/tactical-plans/search?q=performance')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.length).toBeLessThanOrEqual(50); // Respects limit
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate formation structure', async () => {
      const invalidFormation = {
        type: 'INVALID_TYPE',
        zones: null // Invalid structure
      };

      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send({
          name: 'Test Plan',
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: invalidFormation,
          playerAssignments: mockPlayerAssignments
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate player assignments structure', async () => {
      const invalidAssignments = [
        {
          // Missing required fields
          position: 'LW'
        }
      ];

      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send({
          name: 'Test Plan',
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: mockFormation,
          playerAssignments: invalidAssignments
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate enum values', async () => {
      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send({
          name: 'Test Plan',
          teamId: testTeamId,
          category: 'INVALID_CATEGORY', // Invalid enum value
          formation: mockFormation,
          playerAssignments: mockPlayerAssignments
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player assignments', async () => {
      const response = await request(app)
        .post('/api/planning/tactical-plans')
        .send({
          name: 'Empty Assignments Plan',
          teamId: testTeamId,
          category: TacticalCategory.OFFENSIVE,
          formation: mockFormation,
          playerAssignments: []
        })
        .expect(201);

      expect(response.body.playerAssignments).toEqual([]);
    });

    it('should handle special characters in search', async () => {
      await repository.save({
        name: 'Special !@#$%^&*() Plan',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        legacyFormation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      const response = await request(app)
        .get('/api/planning/tactical-plans/search?q=!@#$%')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should handle concurrent updates gracefully', async () => {
      const plan = await repository.save({
        name: 'Concurrent Plan',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        category: TacticalCategory.OFFENSIVE,
        legacyFormation: mockFormation,
        playerAssignments: mockPlayerAssignments,
        isActive: true
      });

      // Simulate concurrent updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put(`/api/planning/tactical-plans/${plan.id}`)
          .send({ name: `Updated Plan ${i}` })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // At least one update should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});