import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppError, NotFoundError } from '../../src/errors/serviceErrors';

// Mock the RBAC service so every permission check passes
jest.mock('../../src/services/authzService', () => ({
  checkPlayerAccess: jest.fn().mockResolvedValue(true),
  checkTeamAccess: jest.fn().mockResolvedValue(true),
}));

// NEW: Mock the auth middleware so requireAuth / requireRole become no-ops
jest.mock('../../src/middleware/authMiddleware', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock jsonwebtoken so verify returns decoded mock user regardless of token
jest.mock('jsonwebtoken', () => ({
  verify: () => ({
    id: 'mock-user-id',
    email: 'mock.user@example.com',
    roles: ['admin'],
    organizationId: 'mock-org-id',
    preferredLanguage: 'en',
  }),
}));

// Ensure env var exists for auth middleware
process.env.JWT_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----';

// Mock auth middleware for testing purposes
// This bypasses actual JWT validation and sets a mock user
const mockAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    // Set a default mock user or allow overriding via test setup
    // IMPORTANT: Adjust the mock user structure based on what controllers expect
    req.user = {
        id: 'mock-user-id', // Example UUID
        organizationId: 'mock-org-id', // Example UUID
        roles: ['admin'], // Example roles (adjust as needed per test)
        email: 'mock.user@example.com', // Add mock email
        preferredLanguage: 'en', // Add mock language
        teamIds: ['mock-team-id'] // Example team IDs
    } as any;

    // NEW: inject a fake bearer token so extractAuthToken() succeeds
    req.headers.authorization = 'Bearer test-token';
    next();
};

// Mock TypeORM DataSource globally before other imports
jest.mock('../../src/data-source', () => {
  const store: any[] = [];
  const fakeRepo = {
    create: (e: any) => ({ ...e }),
    save: jest.fn(async (e: any) => {
      const { v4: uuid } = require('uuid');
      const id = e.id || uuid();
      const existingIdx = store.findIndex(it=>it.id===id);
      const entity = { ...e, id };
      if(existingIdx!==-1){
        store[existingIdx]=entity;
      }else{
        store.push(entity);
      }
      return entity;
    }),
    find: jest.fn(async (criteria?: any) => {
      if (criteria && criteria.where) {
        const where = criteria.where;
        return store.filter((e) => Object.entries(where).every(([k, v]) => e[k] === v));
      }
      return store;
    }),
    findOne: jest.fn(async ({ where }: any) => store.find(e => e.id === where.id && (where.planId ? e.planId === where.planId : true)) || null),
    findOneBy: jest.fn(async (criteria: any) => store.find(e => e.id === criteria.id && (criteria.planId ? e.planId === criteria.planId : true)) || null),
    delete: jest.fn(async (criteria: any) => {
      const match = (e:any) => e.id === (typeof criteria === 'string' ? criteria : criteria.id) && (!criteria.planId || e.planId===criteria.planId);
      const index = store.findIndex(match);
      if (index !== -1) { store.splice(index,1); return { affected: 1 }; }
      return { affected: 0 };
    }),
    query: jest.fn(async () => {}),
    createQueryBuilder: jest.fn(() => {
      const qb: any = {
        _where: () => qb,
        _andWhere: () => qb,
        _orderBy: () => qb,
        _skip: () => qb,
        _take: () => qb,
      };
      ['where','andWhere','orderBy','skip','take'].forEach(fn=>{qb[fn]=jest.fn().mockReturnValue(qb);});
      qb.getManyAndCount = jest.fn().mockResolvedValue([store, store.length]);
      return qb;
    }),
    merge: (target: any, src: any) => Object.assign(target, src),
  };
  return {
    AppDataSource: {
      isInitialized: true,
      getRepository: jest.fn(() => fakeRepo),
      destroy: jest.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock DB pool to silence console logs
jest.mock('../../src/db', () => ({
  default: {
    query: jest.fn(),
    getClient: jest.fn(),
    pool: {},
  },
}));

// Importing for side-effects/typings only – renamed variable to avoid TS6133 unused warning
const { AppDataSource: _AppDataSource } = require('../../src/data-source');

// Re-import routes after mocks so they pick up stubbed modules
import seasonRoutes from '../../src/routes/seasonRoutes';
import teamGoalRoutes from '../../src/routes/teamGoalRoutes';
import playerGoalRoutes from '../../src/routes/playerGoalRoutes';
import developmentPlanRoutes from '../../src/routes/developmentPlanRoutes';

// Mock Season repository for integration tests
jest.mock('../../src/repositories/seasonRepository', () => {
  const { v4: uuid } = require('uuid');
  let seasonsStore: any[] = [];
  let phasesStore: any[] = [];

  return {
    findSeasons: jest.fn(async () => seasonsStore),
    countSeasons: jest.fn(async () => seasonsStore.length),
    findSeasonById: jest.fn(async (id: string) => seasonsStore.find(e => e.id === id) || null),
    createSeason: jest.fn(async (data: any) => {
      // Ensure status: 'planning' is always set, place it after spreading data
      const entity = { ...data, id: uuid(), status: 'planning' }; 
      seasonsStore.push(entity);
      console.log('[Mock CreateSeason] Input data:', data);
      console.log('[Mock CreateSeason] Stored entity:', entity);
      return entity;
    }),
    updateSeason: jest.fn(async (id: string, _orgId: string, data: any) => {
      const idx = seasonsStore.findIndex(e => e.id === id);
      if (idx === -1) return null;
      seasonsStore[idx] = { ...seasonsStore[idx], ...data };
      return seasonsStore[idx];
    }),
    deleteSeason: jest.fn(async (id: string, _orgId: string) => {
      const idx = seasonsStore.findIndex(e => e.id === id);
      if (idx === -1) return false;
      seasonsStore.splice(idx, 1);
      return true;
    }),
    findPhasesBySeasonId: jest.fn(async (seasonId: string) =>
      phasesStore.filter(p => p.seasonId === seasonId)
    ),
    findPhaseById: jest.fn(async (phaseId: string) => {
        const found = phasesStore.find(p => p.id === phaseId);
        if (found) return found;
        // If not present, return a generic phase within a large date range for tests
        return {
          id: phaseId,
          seasonId: 'dummy-season',
          organizationId: 'mock-org-id',
          name: 'Mock Phase',
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() + 86400000 * 30),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
    }),
    createPhase: jest.fn(async (data: any) => {
      const entity = { id: uuid(), ...data };
      phasesStore.push(entity);
      return entity;
    }),
    updatePhase: jest.fn(async (phaseId: string, data: any) => {
      const idx = phasesStore.findIndex(p => p.id === phaseId);
      if (idx === -1) return null;
      phasesStore[idx] = { ...phasesStore[idx], ...data };
      return phasesStore[idx];
    }),
    deletePhase: jest.fn(async (phaseId: string) => {
      const idx = phasesStore.findIndex(p => p.id === phaseId);
      if (idx === -1) return false;
      phasesStore.splice(idx, 1);
      return true;
    }),
  };
});

// Mock Goal repository for integration tests
jest.mock('../../src/repositories/goalRepository', () => {
  const { v4: uuid } = require('uuid');
  const teamGoalsStore: any[] = [];
  const playerGoalsStore: any[] = [];

  return {
    // --- TEAM GOALS ---
    findTeamGoals: jest.fn(async () => teamGoalsStore),
    countTeamGoals: jest.fn(async () => teamGoalsStore.length),
    findTeamGoalById: jest.fn(async (id: string) => teamGoalsStore.find(g => g.id === id) || null),
    createTeamGoal: jest.fn(async (data: any) => {
      const goal = { ...data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
      teamGoalsStore.push(goal);
      return goal;
    }),
    updateTeamGoal: jest.fn(async (id: string, _orgId: string, data: any) => {
      const idx = teamGoalsStore.findIndex(g => g.id === id);
      if (idx === -1) return null;
      teamGoalsStore[idx] = { ...teamGoalsStore[idx], ...data, updatedAt: new Date() };
      return teamGoalsStore[idx];
    }),
    deleteTeamGoal: jest.fn(async (id: string, _orgId: string) => {
      const idx = teamGoalsStore.findIndex(g => g.id === id);
      if (idx === -1) return false;
      teamGoalsStore.splice(idx, 1);
      return true;
    }),

    // --- PLAYER GOALS ---
    findPlayerGoals: jest.fn(async () => ({ goals: playerGoalsStore, total: playerGoalsStore.length })),
    countPlayerGoals: jest.fn(async () => playerGoalsStore.length),
    findPlayerGoalById: jest.fn(async (id: string) => playerGoalsStore.find(g => g.id === id) || null),
    createPlayerGoal: jest.fn(async (data: any) => {
      const goal = { ...data, id: uuid(), createdAt: new Date(), updatedAt: new Date() };
      playerGoalsStore.push(goal);
      return goal;
    }),
    updatePlayerGoal: jest.fn(async (id: string, _orgId: string, data: any) => {
      const idx = playerGoalsStore.findIndex(g => g.id === id);
      if (idx === -1) return null;
      playerGoalsStore[idx] = { ...playerGoalsStore[idx], ...data, updatedAt: new Date() };
      return playerGoalsStore[idx];
    }),
    deletePlayerGoal: jest.fn(async (id: string, _orgId: string) => {
      const idx = playerGoalsStore.findIndex(g => g.id === id);
      if (idx === -1) return false;
      playerGoalsStore.splice(idx, 1);
      return true;
    }),
  };
});

// Mock axios to avoid real HTTP requests in controllers
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { data: { organizationId: 'mock-org-id', organization: { id: 'mock-org-id' } } } }),
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock TrainingCycle repository for integration tests
jest.mock('../../src/repositories/trainingCycleRepository', () => {
  const { v4: uuid } = require('uuid');
  const cyclesStore: any[] = [];

  return {
    findCyclesByPhaseId: jest.fn(async (_phaseId: string) => cyclesStore),
    findCycleById: jest.fn(async (id: string) => cyclesStore.find(c => c.id === id) || null),
    createCycle: jest.fn(async (data: any) => {
      const cycle = { ...data, id: uuid() };
      cyclesStore.push(cycle);
      return cycle;
    }),
    updateCycle: jest.fn(async (id: string, _orgId: string, data: any) => {
      const idx = cyclesStore.findIndex(c => c.id === id);
      if (idx === -1) return null;
      cyclesStore[idx] = { ...cyclesStore[idx], ...data };
      return cyclesStore[idx];
    }),
    deleteCycle: jest.fn(async (id: string) => {
      const idx = cyclesStore.findIndex(c => c.id === id);
      if (idx === -1) return false;
      cyclesStore.splice(idx, 1);
      return true;
    }),
  };
});

export function setupTestApp(): express.Application {
    const app = express();

    // --- Middleware ---
    app.use(cors());
    app.use(express.json());

    // --- Health Check --- 
    // Replicate the health check from src/index.ts
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({ status: 'OK', service: 'Planning Service' });
    });

    // --- Mock Authentication --- 
    // Apply mock auth middleware before API routes
    app.use('/api/v1', mockAuthMiddleware);

    // --- API Routes ---
    // Mount routes
    app.use('/api/v1/seasons', seasonRoutes);
    app.use('/api/v1/team-goals', teamGoalRoutes);
    app.use('/api/v1/player-goals', playerGoalRoutes);
    app.use('/api/v1/development-plans', developmentPlanRoutes);

    // --- Error Handling Middleware ---
    // Replicate error handling from src/index.ts
    app.use((_req: Request, _res: Response, next: NextFunction) => {
        next(new NotFoundError('API endpoint not found'));
    });

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        if (err instanceof AppError) {
            console.error(`[TEST ERROR][${err.name}] (${err.statusCode}): ${err.message}`, err.details || '');
            return res.status(err.statusCode).json({
                error: true,
                message: err.message,
                code: err.code,
                details: err.details,
            });
        } else {
            console.error("[TEST ERROR][UnknownError] (500): " + err.message, err.stack);
            return res.status(500).json({
                error: true,
                message: 'An unexpected internal server error occurred.',
                code: 'INTERNAL_SERVER_ERROR',
            });
        }
    });

    return app;
} 