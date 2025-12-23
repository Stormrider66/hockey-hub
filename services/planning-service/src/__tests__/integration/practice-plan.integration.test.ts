/**
 * @file practice-plan.integration.test.ts
 * @description Comprehensive integration tests for Practice Plan APIs
 * Tests practice creation with segments, attendance tracking, evaluation updates,
 * duplicate functionality, and date/time validations
 */

import request from 'supertest';
import { Application } from 'express';
import { Connection, createConnection, getRepository } from 'typeorm';
import express from 'express';
import { PracticePlan, PracticeStatus, PracticeFocus } from '../../entities/PracticePlan';
import { Drill, DrillDifficulty, DrillType } from '../../entities/Drill';
import { DrillCategory } from '../../entities/DrillCategory';
import { TrainingPlan } from '../../entities/TrainingPlan';
import { PracticePlanController } from '../../controllers/coach/practice-plan.controller';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';

// Mock Logger
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    userId: 'coach-123',
    organizationId: 'org-123',
    role: 'COACH'
  };
  next();
};

describe('Practice Plan Integration Tests', () => {
  let app: Application;
  let connection: Connection;
  let repository: any;
  let drillRepository: any;
  let trainingPlanRepository: any;

  // Test data
  const testOrganizationId = 'org-123';
  const testCoachId = 'coach-123';
  const testTeamId = 'team-123';
  const otherCoachId = 'coach-456';

  const mockSections = [
    {
      id: 'section-1',
      name: 'Warm-up',
      duration: 15,
      drillIds: ['drill-1', 'drill-2'],
      notes: 'Focus on dynamic stretching',
      equipment: ['pucks', 'cones']
    },
    {
      id: 'section-2',
      name: 'Skill Development',
      duration: 30,
      drillIds: ['drill-3'],
      notes: 'Work on stickhandling',
      equipment: ['pucks', 'stickhandling balls']
    },
    {
      id: 'section-3',
      name: 'Scrimmage',
      duration: 20,
      drillIds: ['drill-4'],
      equipment: ['pucks']
    }
  ];

  const mockLineups = {
    forward1: ['player-1', 'player-2', 'player-3'],
    forward2: ['player-4', 'player-5', 'player-6'],
    forward3: ['player-7', 'player-8', 'player-9'],
    forward4: ['player-10', 'player-11', 'player-12'],
    defense1: ['player-13', 'player-14'],
    defense2: ['player-15', 'player-16'],
    defense3: ['player-17', 'player-18'],
    goalies: ['player-19', 'player-20'],
    scratched: ['player-21']
  };

  const mockAttendance = [
    { playerId: 'player-1', present: true },
    { playerId: 'player-2', present: true },
    { playerId: 'player-3', present: false, reason: 'Injury' },
    { playerId: 'player-4', present: true },
  ];

  const mockEvaluations = [
    { 
      playerId: 'player-1', 
      rating: 8, 
      notes: 'Excellent hustle and attitude', 
      areasOfImprovement: ['shooting accuracy'] 
    },
    { 
      playerId: 'player-2', 
      rating: 7, 
      notes: 'Good effort, needs work on positioning', 
      areasOfImprovement: ['defensive positioning', 'passing'] 
    }
  ];

  beforeAll(async () => {
    // Freeze time so fixed ISO dates in tests remain stable across real-world dates
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-01T00:00:00.000Z'));

    // Create in-memory database connection
    connection = await createConnection({
      // Use sqljs to avoid native sqlite3 dependency (works in pure JS)
      type: 'sqljs',
      autoSave: false,
      location: ':memory:',
      entities: [PracticePlan, Drill, DrillCategory, TrainingPlan],
      synchronize: true,
      logging: false,
    } as any);

    repository = getRepository(PracticePlan);
    drillRepository = getRepository(Drill);
    trainingPlanRepository = getRepository(TrainingPlan);

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    // Add routes (assuming these exist)
    app.post('/api/planning/practice-plans', PracticePlanController.create);
    app.get('/api/planning/practice-plans', PracticePlanController.list);
    app.get('/api/planning/practice-plans/:id', PracticePlanController.getById);
    app.put('/api/planning/practice-plans/:id', PracticePlanController.update);
    app.delete('/api/planning/practice-plans/:id', PracticePlanController.delete);
    app.post('/api/planning/practice-plans/:id/duplicate', PracticePlanController.duplicate);
    app.post('/api/planning/practice-plans/:id/attendance', PracticePlanController.updateAttendance);
    app.post('/api/planning/practice-plans/:id/evaluations', PracticePlanController.updateEvaluations);
    app.put('/api/planning/practice-plans/:id/status', PracticePlanController.updateStatus);

    // Error handler
    app.use((error: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: error.message });
    });
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    jest.useRealTimers();
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.clear();
    await drillRepository.clear();
    await trainingPlanRepository.clear();
  });

  describe('POST /api/planning/practice-plans', () => {
    it('should create a new practice plan', async () => {
      const practiceData = {
        title: 'Skills and Tactics Practice',
        description: 'Focus on individual skills and team tactics',
        teamId: testTeamId,
        date: '2024-02-15T10:00:00.000Z',
        duration: 90,
        primaryFocus: PracticeFocus.SKILLS,
        secondaryFocus: [PracticeFocus.TACTICS],
        location: 'Main Arena',
        rinkId: 'rink-1',
        sections: mockSections,
        objectives: ['Improve stickhandling', 'Practice power play'],
        equipment: ['pucks', 'cones', 'stickhandling balls'],
        lineups: mockLineups,
        notes: 'High intensity practice'
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: practiceData.title,
        description: practiceData.description,
        teamId: testTeamId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        duration: practiceData.duration,
        primaryFocus: practiceData.primaryFocus,
        status: PracticeStatus.PLANNED,
        location: practiceData.location,
        rinkId: practiceData.rinkId
      });

      expect(response.body.sections).toEqual(mockSections);
      expect(response.body.lineups).toEqual(mockLineups);
      expect(response.body.objectives).toEqual(practiceData.objectives);

      // Verify in database
      const saved = await repository.findOne({ where: { id: response.body.id } });
      expect(saved).toBeDefined();
      expect(saved.title).toBe(practiceData.title);
      expect(new Date(saved.date)).toEqual(new Date(practiceData.date));
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Invalid empty title
        teamId: 'invalid-uuid', // Invalid UUID format
        date: 'invalid-date', // Invalid date format
        duration: -5, // Invalid duration
        primaryFocus: 'invalid-focus', // Invalid enum
        sections: null // Missing required field
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(invalidData)
        .expect(400);

      // Check that no plan was created
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should create practice plan with training plan association', async () => {
      // Create a training plan first
      const trainingPlan = await trainingPlanRepository.save({
        name: 'Season Training Plan',
        organizationId: testOrganizationId,
        teamId: testTeamId,
        coachId: testCoachId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-01'),
        isActive: true
      });

      const practiceData = {
        title: 'Training Plan Practice',
        teamId: testTeamId,
        trainingPlanId: trainingPlan.id,
        date: '2024-02-15T10:00:00.000Z',
        duration: 60,
        primaryFocus: PracticeFocus.CONDITIONING,
        sections: mockSections.slice(0, 1)
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(201);

      expect(response.body.trainingPlanId).toBe(trainingPlan.id);

      // Verify relationship in database
      const saved = await repository.findOne({ where: { id: response.body.id } as any, relations: ['trainingPlan'] as any });
      expect(saved.trainingPlan.id).toBe(trainingPlan.id);
    });

    it('should validate date is not in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const practiceData = {
        title: 'Past Practice',
        teamId: testTeamId,
        date: pastDate.toISOString(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        sections: mockSections.slice(0, 1)
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(400);

      expect(response.body.error).toContain('date cannot be in the past');
    });

    it('should validate sections have valid structure', async () => {
      const invalidSections = [
        {
          // Missing required fields
          name: 'Invalid Section',
          duration: -10 // Invalid duration
        }
      ];

      const practiceData = {
        title: 'Invalid Sections Practice',
        teamId: testTeamId,
        date: '2024-02-15T10:00:00.000Z',
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        sections: invalidSections
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(400);

      expect(response.body.error).toContain('section');
    });
  });

  describe('GET /api/planning/practice-plans', () => {
    beforeEach(async () => {
      const testPlans = [
        {
          title: 'Morning Practice',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          date: new Date('2024-02-15T10:00:00.000Z'),
          duration: 90,
          primaryFocus: PracticeFocus.SKILLS,
          status: PracticeStatus.PLANNED,
          sections: mockSections,
          location: 'Arena A'
        },
        {
          title: 'Evening Practice',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          date: new Date('2024-02-15T19:00:00.000Z'),
          duration: 60,
          primaryFocus: PracticeFocus.TACTICS,
          status: PracticeStatus.COMPLETED,
          sections: mockSections.slice(0, 2),
          location: 'Arena B'
        },
        {
          title: 'Other Team Practice',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: 'team-456',
          date: new Date('2024-02-16T10:00:00.000Z'),
          duration: 60,
          primaryFocus: PracticeFocus.CONDITIONING,
          status: PracticeStatus.PLANNED,
          sections: mockSections.slice(0, 1)
        },
        {
          title: 'Cancelled Practice',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          date: new Date('2024-02-17T10:00:00.000Z'),
          duration: 60,
          primaryFocus: PracticeFocus.SKILLS,
          status: PracticeStatus.CANCELLED,
          sections: mockSections.slice(0, 1)
        }
      ];

      await repository.save(testPlans);
    });

    it('should return paginated practice plans', async () => {
      const response = await request(app)
        .get('/api/planning/practice-plans?page=1&pageSize=2')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          pageSize: 2,
          total: 4,
          totalPages: 2
        }
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by teamId', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans?teamId=${testTeamId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((plan: any) => plan.teamId === testTeamId)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans?status=${PracticeStatus.COMPLETED}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(PracticeStatus.COMPLETED);
    });

    it('should filter by primary focus', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans?primaryFocus=${PracticeFocus.SKILLS}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((plan: any) => plan.primaryFocus === PracticeFocus.SKILLS)).toBe(true);
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/planning/practice-plans?startDate=2024-02-15&endDate=2024-02-15')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((plan: any) => 
        plan.date.startsWith('2024-02-15')
      )).toBe(true);
    });

    it('should search by title and description', async () => {
      const response = await request(app)
        .get('/api/planning/practice-plans?search=morning')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Morning');
    });

    it('should order by date ASC by default', async () => {
      const response = await request(app)
        .get('/api/planning/practice-plans')
        .expect(200);

      const dates = response.body.data.map((plan: any) => new Date(plan.date));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeLessThanOrEqual(dates[i].getTime());
      }
    });

    it('should include attendance and evaluation summaries', async () => {
      // Update one practice with attendance and evaluations
      const [practice] = await repository.find({ take: 1 });
      practice.attendance = mockAttendance;
      practice.playerEvaluations = mockEvaluations;
      await repository.save(practice);

      const response = await request(app)
        .get('/api/planning/practice-plans')
        .expect(200);

      const practiceWithData = response.body.data.find((p: any) => p.id === practice.id);
      expect(practiceWithData.attendanceRate).toBeDefined();
      expect(practiceWithData.evaluationCount).toBeDefined();
    });
  });

  describe('GET /api/planning/practice-plans/:id', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Detailed Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date('2024-02-15T10:00:00.000Z'),
        duration: 90,
        primaryFocus: PracticeFocus.SKILLS,
        secondaryFocus: [PracticeFocus.TACTICS],
        status: PracticeStatus.PLANNED,
        sections: mockSections,
        objectives: ['Improve passing', 'Practice breakouts'],
        lineups: mockLineups,
        attendance: mockAttendance,
        playerEvaluations: mockEvaluations,
        notes: 'High intensity session',
        location: 'Main Arena'
      });
    });

    it('should return practice plan with all details', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans/${testPractice.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPractice.id,
        title: testPractice.title,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        primaryFocus: PracticeFocus.SKILLS,
        duration: 90
      });

      expect(response.body.sections).toEqual(mockSections);
      expect(response.body.lineups).toEqual(mockLineups);
      expect(response.body.attendance).toEqual(mockAttendance);
      expect(response.body.playerEvaluations).toEqual(mockEvaluations);
    });

    it('should include calculated fields', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans/${testPractice.id}`)
        .expect(200);

      expect(response.body.totalDuration).toBe(65); // Sum of section durations
      expect(response.body.attendanceRate).toBe(75); // 3 out of 4 present
      expect(response.body.drillCount).toBe(4); // Total drills across sections
      expect(response.body.evaluationCount).toBe(2); // Number of evaluations
    });

    it('should return 404 for non-existent practice', async () => {
      const response = await request(app)
        .get('/api/planning/practice-plans/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Practice plan not found');
    });

    it('should include related drill details when requested', async () => {
      const response = await request(app)
        .get(`/api/planning/practice-plans/${testPractice.id}?includeDrills=true`)
        .expect(200);

      expect(response.body.sections[0].drills).toBeDefined();
    });
  });

  describe('PUT /api/planning/practice-plans/:id', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Original Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date('2024-02-15T10:00:00.000Z'),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.PLANNED,
        sections: mockSections.slice(0, 1),
        notes: 'Original notes'
      });
    });

    it('should update practice plan', async () => {
      const updates = {
        title: 'Updated Practice',
        duration: 90,
        primaryFocus: PracticeFocus.TACTICS,
        secondaryFocus: [PracticeFocus.CONDITIONING],
        sections: mockSections,
        notes: 'Updated notes',
        objectives: ['New objective 1', 'New objective 2']
      };

      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPractice.id,
        title: updates.title,
        duration: updates.duration,
        primaryFocus: updates.primaryFocus,
        notes: updates.notes
      });

      expect(response.body.sections).toEqual(mockSections);
      expect(response.body.objectives).toEqual(updates.objectives);

      // Verify in database
      const updated = await repository.findOne({ where: { id: testPractice.id } });
      expect(updated.title).toBe(updates.title);
      expect(updated.duration).toBe(updates.duration);
    });

    it('should prevent updates to completed practices', async () => {
      // Mark practice as completed
      testPractice.status = PracticeStatus.COMPLETED;
      await repository.save(testPractice);

      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}`)
        .send({ title: 'Should not update' })
        .expect(400);

      expect(response.body.error).toContain('Cannot update completed practice');
    });

    it('should prevent changing date to past for planned practices', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}`)
        .send({ date: pastDate.toISOString() })
        .expect(400);

      expect(response.body.error).toContain('Cannot set date to past');
    });

    it('should enforce coach ownership', async () => {
      // Create practice by different coach
      const otherCoachPractice = await repository.save({
        title: 'Other Coach Practice',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        date: new Date('2024-02-16T10:00:00.000Z'),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.PLANNED,
        sections: mockSections.slice(0, 1)
      });

      const response = await request(app)
        .put(`/api/planning/practice-plans/${otherCoachPractice.id}`)
        .send({ title: 'Hacked Update' })
        .expect(404);

      expect(response.body.error).toBe('Practice plan not found or no permission to update');
    });
  });

  describe('POST /api/planning/practice-plans/:id/duplicate', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Original Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date('2024-02-15T10:00:00.000Z'),
        duration: 90,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.PLANNED,
        sections: mockSections,
        objectives: ['Original objective'],
        lineups: mockLineups,
        notes: 'Original practice notes'
      });
    });

    it('should duplicate practice plan', async () => {
      const duplicateData = {
        title: 'Duplicated Practice',
        date: '2024-02-16T10:00:00.000Z',
        teamId: 'team-456' // Different team
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/duplicate`)
        .send(duplicateData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: duplicateData.title,
        teamId: duplicateData.teamId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        duration: testPractice.duration,
        primaryFocus: testPractice.primaryFocus,
        status: PracticeStatus.PLANNED
      });

      expect(response.body.id).not.toBe(testPractice.id);
      expect(response.body.sections).toEqual(mockSections);
      expect(response.body.objectives).toEqual(['Original objective']);

      // Should not copy attendance or evaluations
      expect(response.body.attendance).toBeNull();
      expect(response.body.playerEvaluations).toBeNull();

      // Verify in database
      const duplicated = await repository.findOne({ where: { id: response.body.id } });
      expect(duplicated).toBeDefined();
      expect(duplicated.title).toBe(duplicateData.title);
    });

    it('should use default title when not provided', async () => {
      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/duplicate`)
        .send({ date: '2024-02-16T10:00:00.000Z' })
        .expect(201);

      expect(response.body.title).toBe('Original Practice (Copy)');
    });

    it('should validate duplicate data', async () => {
      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/duplicate`)
        .send({ date: 'invalid-date' })
        .expect(400);

      expect(response.body.error).toContain('valid date');
    });

    it('should return 404 for non-existent practice', async () => {
      const response = await request(app)
        .post('/api/planning/practice-plans/non-existent-id/duplicate')
        .send({ date: '2024-02-16T10:00:00.000Z' })
        .expect(404);

      expect(response.body.error).toBe('Practice plan not found');
    });
  });

  describe('POST /api/planning/practice-plans/:id/attendance', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Attendance Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.IN_PROGRESS,
        sections: mockSections.slice(0, 1)
      });
    });

    it('should update attendance', async () => {
      const attendanceData = {
        attendance: [
          { playerId: 'player-1', present: true },
          { playerId: 'player-2', present: false, reason: 'Sick' },
          { playerId: 'player-3', present: true },
          { playerId: 'player-4', present: false, reason: 'Family emergency' }
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/attendance`)
        .send(attendanceData)
        .expect(200);

      expect(response.body.attendance).toEqual(attendanceData.attendance);
      expect(response.body.attendanceRate).toBe(50); // 2 out of 4 present

      // Verify in database
      const updated = await repository.findOne({ where: { id: testPractice.id } });
      expect(updated.attendance).toEqual(attendanceData.attendance);
    });

    it('should validate attendance data structure', async () => {
      const invalidData = {
        attendance: [
          { playerId: 'player-1' }, // Missing present field
          { present: true }, // Missing playerId
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/attendance`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('attendance');
    });

    it('should prevent attendance updates for planned practices', async () => {
      testPractice.status = PracticeStatus.PLANNED;
      await repository.save(testPractice);

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/attendance`)
        .send({ attendance: mockAttendance })
        .expect(400);

      expect(response.body.error).toContain('cannot update attendance for planned practice');
    });

    it('should enforce coach ownership', async () => {
      const otherCoachPractice = await repository.save({
        title: 'Other Practice',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.IN_PROGRESS,
        sections: mockSections.slice(0, 1)
      });

      const response = await request(app)
        .post(`/api/planning/practice-plans/${otherCoachPractice.id}/attendance`)
        .send({ attendance: mockAttendance })
        .expect(404);

      expect(response.body.error).toBe('Practice plan not found or no permission to update');
    });
  });

  describe('POST /api/planning/practice-plans/:id/evaluations', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Evaluation Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.IN_PROGRESS,
        sections: mockSections.slice(0, 1),
        attendance: mockAttendance.filter(a => a.present) // Only present players
      });
    });

    it('should update player evaluations', async () => {
      const evaluationData = {
        evaluations: [
          { 
            playerId: 'player-1', 
            rating: 9, 
            notes: 'Outstanding performance today', 
            areasOfImprovement: ['continue current level'] 
          },
          { 
            playerId: 'player-2', 
            rating: 6, 
            notes: 'Needs improvement in several areas', 
            areasOfImprovement: ['passing accuracy', 'positioning', 'effort'] 
          }
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/evaluations`)
        .send(evaluationData)
        .expect(200);

      expect(response.body.playerEvaluations).toEqual(evaluationData.evaluations);

      // Verify in database
      const updated = await repository.findOne({ where: { id: testPractice.id } });
      expect(updated.playerEvaluations).toEqual(evaluationData.evaluations);
    });

    it('should validate evaluation ratings', async () => {
      const invalidData = {
        evaluations: [
          { playerId: 'player-1', rating: 11, notes: 'Too high rating' }, // Rating > 10
          { playerId: 'player-2', rating: -1, notes: 'Negative rating' }  // Rating < 0
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/evaluations`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('rating must be between 0 and 10');
    });

    it('should only allow evaluations for present players', async () => {
      const evaluationData = {
        evaluations: [
          { playerId: 'player-3', rating: 8, notes: 'Player was absent' } // Not present
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/evaluations`)
        .send(evaluationData)
        .expect(400);

      expect(response.body.error).toContain('can only evaluate players who were present');
    });

    it('should merge with existing evaluations', async () => {
      // Set initial evaluations
      testPractice.playerEvaluations = [
        { playerId: 'player-1', rating: 7, notes: 'Initial rating' }
      ];
      await repository.save(testPractice);

      const newEvaluations = {
        evaluations: [
          { playerId: 'player-1', rating: 8, notes: 'Updated rating' },
          { playerId: 'player-2', rating: 6, notes: 'New evaluation' }
        ]
      };

      const response = await request(app)
        .post(`/api/planning/practice-plans/${testPractice.id}/evaluations`)
        .send(newEvaluations)
        .expect(200);

      expect(response.body.playerEvaluations).toHaveLength(2);
      expect(response.body.playerEvaluations.find((e: any) => e.playerId === 'player-1').rating).toBe(8);
    });
  });

  describe('PUT /api/planning/practice-plans/:id/status', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Status Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.PLANNED,
        sections: mockSections.slice(0, 1)
      });
    });

    it('should update practice status', async () => {
      const statusUpdate = { status: PracticeStatus.IN_PROGRESS };

      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}/status`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.status).toBe(PracticeStatus.IN_PROGRESS);

      // Verify in database
      const updated = await repository.findOne({ where: { id: testPractice.id } });
      expect(updated.status).toBe(PracticeStatus.IN_PROGRESS);
    });

    it('should validate status transitions', async () => {
      // Try to go directly from PLANNED to COMPLETED
      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}/status`)
        .send({ status: PracticeStatus.COMPLETED })
        .expect(400);

      expect(response.body.error).toContain('invalid status transition');
    });

    it('should prevent status changes for cancelled practices', async () => {
      testPractice.status = PracticeStatus.CANCELLED;
      await repository.save(testPractice);

      const response = await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}/status`)
        .send({ status: PracticeStatus.IN_PROGRESS })
        .expect(400);

      expect(response.body.error).toContain('Cannot change status of cancelled practice');
    });

    it('should auto-update timestamps on status changes', async () => {
      const startTime = Date.now();

      await request(app)
        .put(`/api/planning/practice-plans/${testPractice.id}/status`)
        .send({ status: PracticeStatus.IN_PROGRESS })
        .expect(200);

      const updated = await repository.findOne({ where: { id: testPractice.id } });
      expect(updated.metadata?.startedAt).toBeDefined();
      expect(new Date(updated.metadata.startedAt).getTime()).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe('DELETE /api/planning/practice-plans/:id', () => {
    let testPractice: any;

    beforeEach(async () => {
      testPractice = await repository.save({
        title: 'Practice to Delete',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date('2024-02-20T10:00:00.000Z'),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.PLANNED,
        sections: mockSections.slice(0, 1)
      });
    });

    it('should delete planned practice', async () => {
      const response = await request(app)
        .delete(`/api/planning/practice-plans/${testPractice.id}`)
        .expect(204);

      // Verify deletion
      const deleted = await repository.findOne({ where: { id: testPractice.id } });
      expect(deleted).toBeNull();
    });

    it('should prevent deletion of completed practices', async () => {
      testPractice.status = PracticeStatus.COMPLETED;
      await repository.save(testPractice);

      const response = await request(app)
        .delete(`/api/planning/practice-plans/${testPractice.id}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete completed practice');
    });

    it('should prevent deletion of in-progress practices', async () => {
      testPractice.status = PracticeStatus.IN_PROGRESS;
      await repository.save(testPractice);

      const response = await request(app)
        .delete(`/api/planning/practice-plans/${testPractice.id}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete practice in progress');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large practice plans efficiently', async () => {
      const largeSectionSet = Array.from({ length: 50 }, (_, i) => ({
        id: `section-${i}`,
        name: `Section ${i}`,
        duration: 5,
        drillIds: [`drill-${i}`, `drill-${i+1}`],
        notes: `Section ${i} notes`
      }));

      const largeLineups = {
        ...mockLineups,
        forward1: Array.from({ length: 20 }, (_, i) => `player-${i}`),
        forward2: Array.from({ length: 20 }, (_, i) => `player-${i+20}`)
      };

      const practiceData = {
        title: 'Large Practice',
        teamId: testTeamId,
        date: '2024-02-15T10:00:00.000Z',
        duration: 250,
        primaryFocus: PracticeFocus.SKILLS,
        sections: largeSectionSet,
        lineups: largeLineups
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      expect(response.body.sections).toHaveLength(50);
    });

    it('should handle concurrent attendance updates', async () => {
      const practice = await repository.save({
        title: 'Concurrent Practice',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILLS,
        status: PracticeStatus.IN_PROGRESS,
        sections: mockSections.slice(0, 1)
      });

      // Simulate concurrent attendance updates
      const updatePromises = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .post(`/api/planning/practice-plans/${practice.id}/attendance`)
          .send({
            attendance: [
              { playerId: `player-${i}`, present: true },
              { playerId: `player-${i+10}`, present: false, reason: 'Test' }
            ]
          })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // At least one update should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should validate section duration consistency', async () => {
      const inconsistentSections = [
        { id: 'section-1', name: 'Section 1', duration: 30, drillIds: ['drill-1'] },
        { id: 'section-2', name: 'Section 2', duration: 40, drillIds: ['drill-2'] }
      ];

      const practiceData = {
        title: 'Inconsistent Practice',
        teamId: testTeamId,
        date: '2024-02-15T10:00:00.000Z',
        duration: 60, // Total duration less than sum of sections (70)
        primaryFocus: PracticeFocus.SKILLS,
        sections: inconsistentSections
      };

      const response = await request(app)
        .post('/api/planning/practice-plans')
        .send(practiceData)
        .expect(400);

      expect(response.body.error).toContain('total duration does not match section durations');
    });
  });
});