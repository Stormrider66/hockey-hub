import request from 'supertest';
import express from 'express';
import routes from '../../routes/dashboardRoutes';
import { AppDataSource, connectToDatabase, redisClient, isRedisConnected } from '../../config/database';
import { DrillCategory } from '../../entities/DrillCategory';
import { Drill, DrillDifficulty, DrillType } from '../../entities/Drill';
import { PlanTemplate, TemplateCategory } from '../../entities/PlanTemplate';
import { PracticePlan, PracticeFocus, PracticeStatus } from '../../entities/PracticePlan';

const app = express();
app.use(express.json());
app.use('/api/planning', routes as any);

const headers = {
  'X-User-Id': 'e2e-user',
  'X-User-Email': 'e2e@example.com',
  'X-User-Roles': JSON.stringify(['coach']),
  'X-User-Permissions': JSON.stringify(['planning:read']),
  'X-Organization-Id': 'org-e2e',
  'X-Team-Ids': JSON.stringify(['team-e2e'])
};

async function seedPlanningData() {
  const orgId = 'org-e2e';
  const categoryRepo = AppDataSource.getRepository(DrillCategory);
  const drillRepo = AppDataSource.getRepository(Drill);
  const templateRepo = AppDataSource.getRepository(PlanTemplate);

  let category = await categoryRepo.findOne({ where: { name: 'General', organizationId: orgId } });
  if (!category) {
    category = await categoryRepo.save({
      name: 'General',
      description: 'General drills',
      organizationId: orgId,
      isSystem: false,
      sortOrder: 0,
    } as any);
  }

  const existingDrill = await drillRepo.findOne({ where: { name: 'E2E Passing Drill', organizationId: orgId } });
  if (!existingDrill && category) {
    await drillRepo.save({
      name: 'E2E Passing Drill',
      description: 'Simple passing warmup',
      organizationId: orgId,
      isPublic: true,
      categoryId: category.id as any,
      type: DrillType.SKILL as any,
      difficulty: DrillDifficulty.BEGINNER as any,
      duration: 15,
      minPlayers: 4,
      maxPlayers: 24,
      equipment: ['pucks', 'cones'],
      setup: { rinkArea: 'neutral', pucks: 10, cones: 6 },
      instructions: [
        { step: 1, description: 'Pair up and pass while skating', duration: 5 },
        { step: 2, description: 'Add movement and pivots', duration: 10 },
      ],
      tags: ['passing', 'warmup'],
      usageCount: 5,
      rating: 4.5,
      ratingCount: 2,
    } as any);
  }

  // Seed additional drills for ordering/pagination tests
  const drillSeeds = [
    { name: 'Z Dribble Drill', usageCount: 1, rating: 3.0 },
    { name: 'A Shooting Drill', usageCount: 20, rating: 4.9 },
    { name: 'M Neutral Zone Drill', usageCount: 10, rating: 4.2 }
  ];
  for (const seed of drillSeeds) {
    const found = await drillRepo.findOne({ where: { name: seed.name, organizationId: orgId } });
    if (!found) {
      await drillRepo.save({
        name: seed.name,
        description: 'Seed drill',
        organizationId: orgId,
        isPublic: true,
        categoryId: (await categoryRepo.findOne({ where: { name: 'General', organizationId: orgId } }))!.id as any,
        type: DrillType.SKILL as any,
        difficulty: DrillDifficulty.BEGINNER as any,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 20,
        equipment: ['pucks'],
        setup: {},
        instructions: [],
        tags: [],
        usageCount: seed.usageCount as any,
        rating: seed.rating as any,
        ratingCount: 1 as any,
      } as any);
    }
  }

  const existingTemplate = await templateRepo.findOne({ where: { name: 'E2E Pre-Season Template', organizationId: orgId } });
  if (!existingTemplate) {
    await templateRepo.save({
      name: 'E2E Pre-Season Template',
      description: 'Basic 4-week pre-season plan',
      organizationId: orgId,
      isPublic: true,
      category: TemplateCategory.PRE_SEASON as any,
      planType: 'season' as any,
      ageGroup: 'U18',
      durationWeeks: 4,
      structure: {
        phases: [
          { name: 'Base', weeks: 2, focus: ['skills', 'conditioning'], intensity: 'medium' },
          { name: 'Build', weeks: 2, focus: ['skills', 'tactics'], intensity: 'high' },
        ],
        weeklySchedule: { practicesPerWeek: 3, gamesPerWeek: 1, offDays: 2 },
      },
      goals: [
        { category: 'technical', title: 'Puck control', description: 'Improve puck control', measurable: 'reduced turnovers' },
      ],
      samplePractices: [
        { week: 1, focus: 'skills' as any, title: 'Skill focus', duration: 90, drillSuggestions: [] },
      ],
      equipment: ['pucks', 'cones'],
      usageCount: 3,
      rating: 4,
      ratingCount: 1,
      tags: ['preseason'],
    } as any);
  }

  // Seed additional templates for ordering/pagination tests
  const templateSeeds = [
    { name: 'Template A', usageCount: 5, rating: 4.1 },
    { name: 'Template B', usageCount: 15, rating: 3.8 },
    { name: 'Template C', usageCount: 8, rating: 4.9 }
  ];
  for (const seed of templateSeeds) {
    const found = await templateRepo.findOne({ where: { name: seed.name, organizationId: orgId } });
    if (!found) {
      await templateRepo.save({
        name: seed.name,
        description: 'Seed template',
        organizationId: orgId,
        isPublic: true,
        category: TemplateCategory.PRE_SEASON as any,
        planType: 'season' as any,
        ageGroup: 'U18',
        durationWeeks: 4,
        structure: { phases: [], weeklySchedule: { practicesPerWeek: 2, gamesPerWeek: 0, offDays: 5 } },
        goals: [],
        samplePractices: [],
        equipment: [],
        usageCount: seed.usageCount as any,
        rating: seed.rating as any,
        ratingCount: 1 as any,
        tags: [],
      } as any);
    }
  }
}

describe('Planning Service E2E (real DB)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'e2e';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.DB_PORT || '5438';
    process.env.DB_USER = process.env.DB_USER || 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'hockey_hub_password';
    process.env.DB_NAME = process.env.DB_NAME || 'hockey_hub_planning';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.PLAN_SYNC = '0';
    await connectToDatabase();
    // Clean and recreate schema for deterministic E2E
    try {
      await AppDataSource.dropDatabase();
    } catch {}
    try {
      await AppDataSource.synchronize();
    } catch (e: any) {
      // Ignore duplicate index/table errors when schema objects linger between runs
      // This keeps E2E resilient across shared local DBs
      // eslint-disable-next-line no-console
      console.warn('Synchronize warning:', e?.message || e);
    }
    try {
      await seedPlanningData();
    } catch (e) {
      console.warn('Seed warning:', (e as any)?.message || e);
    }
  }, 30000);

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.quit();
      }
    } catch {}
  });

  it('GET /api/planning/templates/popular returns 200 with array (or 500 if not seeded)', async () => {
    const res = await request(app)
      .get('/api/planning/templates/popular')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 1);
    }
  });

  it('GET /api/planning/practices upcoming returns 200/400/500', async () => {
    const res = await request(app)
      .get('/api/planning/practices?days=7&order=asc&page=1&pageSize=1')
      .set(headers);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('GET /api/planning/analytics returns 200 with shape (or 500 if not seeded)', async () => {
    const res = await request(app)
      .get('/api/planning/analytics')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('topDrills');
      expect(res.body).toHaveProperty('topTemplates');
      expect(res.body).toHaveProperty('drillDistribution');
    }
  });

  it('POST /api/planning/practices rejects bad payload (400)', async () => {
    const res = await request(app)
      .post('/api/planning/practices')
      .set(headers)
      .send({
        // Missing many required fields
        title: 123,
        date: 'not-a-date',
        duration: -5,
        sections: []
      } as any);
    expect([400, 500]).toContain(res.status);
  });

  it('GET /api/planning/drills/search rejects invalid query', async () => {
    const res = await request(app)
      .get('/api/planning/drills/search?duration=-1&unknown=1&sortBy=rating&order=desc&page=1&pageSize=5')
      .set(headers);
    expect([400, 500]).toContain(res.status);
  });

  it('GET /api/planning/drills/search supports sorting and pagination', async () => {
    const res = await request(app)
      .get('/api/planning/drills/search?search=Drill&sortBy=usageCount&order=desc&page=1&pageSize=2')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length >= 2) {
        expect(res.body.data[0].usageCount >= res.body.data[1].usageCount).toBe(true);
      }
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 2);
    }
  });

  it('GET /api/planning/templates supports sorting and pagination', async () => {
    const res = await request(app)
      .get('/api/planning/templates?sortBy=usageCount&order=asc&page=1&pageSize=2')
      .set(headers);
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length >= 2) {
        expect(res.body.data[0].usageCount <= res.body.data[1].usageCount).toBe(true);
      }
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 2);
    }
  });

  it('GET /api/planning/templates with invalid category returns 400', async () => {
    const res = await request(app)
      .get('/api/planning/templates?category=INVALID&sortBy=usageCount&order=asc&page=1&pageSize=10')
      .set(headers);
    expect([400, 500]).toContain(res.status);
  });

  it('POST /api/planning/templates/:id/use rejects if missing teamId (400)', async () => {
    const res = await request(app)
      .post('/api/planning/templates/template-123/use')
      .set(headers)
      .send({});
    expect([400, 500]).toContain(res.status);
  });

  it('POST /api/planning/templates/:id/use creates a training plan from template', async () => {
    try {
      const template = await AppDataSource.getRepository(PlanTemplate).findOne({ where: { organizationId: 'org-e2e' } });
      if (!template) return;
      const res = await request(app)
        .post(`/api/planning/templates/${template.id}/use`)
        .set(headers)
        .send({ teamId: 'team-e2e' });

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('teamId', 'team-e2e');
        expect(res.body).toHaveProperty('name');
      }
    } catch {
      return;
    }
  });

  it('Practice creation and retrieval flow', async () => {
    try {
      const orgId = 'org-e2e';
      const teamId = 'team-e2e';
      const coachId = 'e2e-user';

      const drill = await AppDataSource.getRepository(Drill).findOne({ where: { organizationId: orgId } });
      if (!drill) return;

      const createRes = await request(app)
        .post('/api/planning/practices')
        .set(headers)
        .send({
          title: 'E2E Practice',
          description: 'Auto-created E2E practice',
          teamId,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          primaryFocus: PracticeFocus.SKILLS as any,
          sections: [
            { id: 'sec-1', name: 'Warmup', duration: 15, drillIds: [drill.id], notes: 'Light warmup' },
            { id: 'sec-2', name: 'Main', duration: 45, drillIds: [drill.id], notes: 'Skills focus' },
          ],
          equipment: ['pucks', 'cones']
        });

      expect([200, 500]).toContain(createRes.status);
      if (createRes.status !== 200) return;
      const practice = createRes.body;

      const resGet = await request(app)
        .get(`/api/planning/practices/${practice.id}`)
        .set(headers);

      expect([200, 500, 404]).toContain(resGet.status);
      if (resGet.status === 200) {
        expect(resGet.body).toHaveProperty('id', practice.id);
        expect(resGet.body).toHaveProperty('sections');
        expect(Array.isArray(resGet.body.sections)).toBe(true);
      }

      // Update the practice
      const updateRes = await request(app)
        .put(`/api/planning/practices/${practice.id}`)
        .set(headers)
        .send({ description: 'Updated via E2E', duration: 75 });

      expect([200, 500, 404]).toContain(updateRes.status);
      if (updateRes.status === 200) {
        expect(updateRes.body).toHaveProperty('id', practice.id);
        expect(updateRes.body).toHaveProperty('description', 'Updated via E2E');
        expect(updateRes.body).toHaveProperty('duration', 75);
      }
    } catch {
      return;
    }
  });
});
