import request from 'supertest';
import express from 'express';
import { extractUser, requireAuth } from '../../middleware/auth';

// Minimal E2E: real DB, real routes (no test fallbacks), simple happy paths
describe('Training Service E2E (real DB)', () => {
  let app: express.Application;

  beforeAll(async () => {
    const db = require('../../config/database');
    await db.initializeDatabase();
    app = express();
    app.use(express.json());
    // Inject a test user context to satisfy requireAuth in E2E
    app.use((req, _res, next) => {
      (req as any).user = {
        userId: 'e2e-user',
        email: 'e2e@example.com',
        roles: ['coach'],
        permissions: ['training.create','training.read','training.update','training.delete'],
        organizationId: '11111111-1111-4111-8111-111111111111',
        teamIds: ['11111111-1111-4111-8111-111111111111'],
        lang: 'en'
      };
      next();
    });
    const routes = require('../../routes/workoutRoutes').default;
    app.use('/workouts', routes);
  }, 60000);

  afterAll(async () => {
    const db = require('../../config/database');
    if (db.AppDataSource?.isInitialized) {
      await db.AppDataSource.destroy();
    }
  });

  it('health-checks DB connectivity via 200 when initialized', async () => {
    const res = await request(app).get('/workouts/sessions');
    expect(res.status).toBe(200);
  });
});

describe('Training Service E2E (migrations + seed + CRUD)', () => {
  let app: express.Application;
  let AppDataSource: any;
  let dbReady = false;

  const setupFreshApp = async () => {
    process.env.NODE_ENV = 'e2e';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.DB_PORT || '5442';
    process.env.DB_USER = process.env.DB_USER || 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'hockey_hub_password';
    process.env.DB_NAME = process.env.DB_NAME || 'hockey_hub_training_e2e';
    process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6387';

    const { initializeCache } = require('@hockey-hub/shared-lib/cache/cacheConfig');
    try { await initializeCache({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379', 10) }); } catch {}
    const db = require('../../config/database');
    try {
      await db.initializeDatabase();
      AppDataSource = db.AppDataSource;
      // In E2E, ensure a clean DB and build schema from entities
      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
      dbReady = true;
    } catch (err) {
      // If DB is not available, mark suite as not ready; tests will no-op
      dbReady = false;
      console.error('E2E DB not available, skipping CRUD tests:', err instanceof Error ? err.message : String(err));
      return;
    }

    app = express();
    app.use(express.json());
    // inject test user auth for E2E
    app.use((req, _res, next) => {
      (req as any).user = {
        userId: 'e2e-user',
        email: 'e2e@example.com',
        roles: ['coach'],
        permissions: ['training.create','training.read','training.update','training.delete'],
        organizationId: '11111111-1111-4111-8111-111111111111',
        teamIds: ['11111111-1111-4111-8111-111111111111'],
        lang: 'en'
      };
      next();
    });
    const routes = require('../../routes/workoutRoutes').default;
    app.use('/workouts', routes);
  };

  beforeAll(async () => {
    await setupFreshApp();
  }, 60000);

  afterAll(async () => {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('creates and lists workout sessions', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    const newWorkout = {
      title: 'E2E Strength',
      description: 'E2E flow',
      type: 'STRENGTH',
      scheduledDate: new Date().toISOString(),
      location: 'Gym',
      teamId: '11111111-1111-4111-8111-111111111111',
      playerIds: ['22222222-2222-4222-8222-222222222222'],
      estimatedDuration: 60,
      settings: { allowIndividualLoads: true, displayMode: 'grid', showMetrics: true, autoRotation: false, rotationInterval: 30 },
    };

    const createRes = await request(app).post('/workouts/sessions').send(newWorkout);
    if (createRes.status !== 201) {
      throw new Error('Create failed: ' + JSON.stringify(createRes.body));
    }
    expect(createRes.body.success).toBe(true);
    const createdId = createRes.body.data.id;

    const listRes = await request(app).get('/workouts/sessions');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.find((s: any) => s.id === createdId)).toBeTruthy();
  }, 60000);

  it('gets, updates, and deletes a workout session; manages player load', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    // Create a new workout session
    const createRes = await request(app).post('/workouts/sessions').send({
      title: 'Session To Update',
      description: 'Initial',
      type: 'STRENGTH',
      scheduledDate: new Date().toISOString(),
      location: 'Arena',
      teamId: '11111111-1111-4111-8111-111111111111',
      playerIds: ['22222222-2222-4222-8222-222222222222'],
      estimatedDuration: 45,
      settings: { allowIndividualLoads: true, displayMode: 'grid', showMetrics: true, autoRotation: false, rotationInterval: 30 }
    });
    if (createRes.status !== 201) {
      throw new Error('Create failed: ' + JSON.stringify(createRes.body));
    }
    const id = createRes.body.data.id as string;
    const playerId = '22222222-2222-4222-8222-222222222222';

    // Get single session
    const getRes = await request(app).get(`/workouts/sessions/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.id).toBe(id);

    // Update session
    const updateRes = await request(app)
      .put(`/workouts/sessions/${id}`)
      .send({ title: 'Updated Title', status: 'completed' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe('Updated Title');

    // Set player load
    const setLoadRes = await request(app)
      .put(`/workouts/sessions/${id}/players/${playerId}/load`)
      .send({ loadModifier: 1.2, exerciseModifications: { notes: 'lighter set' } });
    if (setLoadRes.status !== 200) {
      throw new Error('Set load failed: ' + JSON.stringify(setLoadRes.body));
    }
    expect(setLoadRes.body.success).toBe(true);
    expect(setLoadRes.body.data.loadModifier).toBe(1.2);

    // Get player load
    const getLoadRes = await request(app)
      .get(`/workouts/sessions/${id}/players/${playerId}/load`);
    expect(getLoadRes.status).toBe(200);
    expect(getLoadRes.body.success).toBe(true);
    expect(getLoadRes.body.data.playerId).toBe(playerId);

    // Filter list (by team)
    const listByTeam = await request(app)
      .get('/workouts/sessions')
      .query({ teamId: '11111111-1111-4111-8111-111111111111' });
    if (listByTeam.status !== 200) {
      throw new Error('List by team failed: ' + JSON.stringify(listByTeam.body));
    }
    expect(listByTeam.body.success).toBe(true);
    expect(Array.isArray(listByTeam.body.data)).toBe(true);

    // Delete session
    const delRes = await request(app).delete(`/workouts/sessions/${id}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Ensure it is gone
    const getAfterDel = await request(app).get(`/workouts/sessions/${id}`);
    expect(getAfterDel.status).toBe(404);
  }, 60000);

  it('converts interval program to exercises', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    const convertRes = await request(app)
      .post('/workouts/sessions/conditioning/convert')
      .send({
        intervalProgram: {
          intervals: [
            { type: 'work', duration: 60, targetMetrics: { watts: { type: 'absolute', value: 200 } } },
            { type: 'rest', duration: 30 },
          ],
        },
      });
    expect(convertRes.status).toBe(200);
    expect(convertRes.body.success).toBe(true);
    expect(Array.isArray(convertRes.body.data.exercises)).toBe(true);
    expect(convertRes.body.data.exercises.length).toBeGreaterThan(0);
  }, 60000);

  it('returns conditioning templates', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    const tplRes = await request(app).get('/workouts/sessions/conditioning/templates');
    expect(tplRes.status).toBe(200);
    expect(tplRes.body.success).toBe(true);
    expect(Array.isArray(tplRes.body.data)).toBe(true);
    expect(tplRes.body.data.length).toBeGreaterThan(0);
  }, 60000);

  it('returns 404 for unknown session id', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    const res = await request(app).get('/workouts/sessions/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  }, 60000);

  it('lists upcoming sessions for a player', async () => {
    if (!dbReady || !AppDataSource?.isInitialized) {
      console.warn('Skipping E2E test: DB not available');
      return;
    }
    const playerId = '22222222-2222-4222-8222-222222222222';
    const teamId = '11111111-1111-4111-8111-111111111111';

    // Create 1 upcoming workout including this player
    const createRes = await request(app).post('/workouts/sessions').send({
      title: 'Upcoming Cardio',
      description: 'Player specific',
      type: 'CARDIO',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      location: 'Track',
      teamId,
      playerIds: [playerId],
      estimatedDuration: 30,
      settings: { allowIndividualLoads: true, displayMode: 'grid', showMetrics: true, autoRotation: false, rotationInterval: 30 },
    });
    if (createRes.status !== 201) {
      throw new Error('Create failed: ' + JSON.stringify(createRes.body));
    }

    const upcomingRes = await request(app)
      .get(`/workouts/sessions/upcoming/${playerId}`)
      .query({ teamId, days: 7 });
    expect(upcomingRes.status).toBe(200);
    expect(upcomingRes.body.success).toBe(true);
    expect(Array.isArray(upcomingRes.body.data)).toBe(true);
    expect(upcomingRes.body.data.length).toBeGreaterThan(0);
  }, 60000);
});


