import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import playerWellnessRoutes from './playerWellnessRoutes';

// Mock the middleware
jest.mock('../middleware/auth', () => ({
  extractUser: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', role: 'physical_trainer' };
    next();
  },
  requireAuth: (req: any, res: any, next: any) => next(),
  requirePhysicalTrainer: (req: any, res: any, next: any) => next(),
  requireAnyPermission: (permissions: string[]) => (req: any, res: any, next: any) => next(),
}));

// Mock the controller functions
jest.mock('../controllers/playerWellnessController', () => ({
  getTeamPlayerStatus: (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        teamId: req.query.teamId,
        teamName: 'Test Team',
        players: [],
        teamAverages: { readinessScore: 85 },
        alerts: { highRisk: [], injured: [], overloaded: [], wellnessDecline: [] }
      },
      mock: true
    });
  },
  getPlayerWellnessDetail: (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        playerId: req.params.playerId,
        playerName: 'Test Player',
        currentWellness: { sleep: 8, stress: 3, energy: 8, soreness: 4, mood: 8, submittedAt: new Date().toISOString() },
        wellnessHistory: [],
        trends: { overall: 'stable' },
        recommendations: []
      },
      mock: true
    });
  },
  getPlayerTrainingMetrics: (req: any, res: any) => {
    res.json({
      success: true,
      data: {
        playerId: req.params.playerId,
        playerName: 'Test Player',
        hrVariability: { current: 35, baseline: 38, trend: 'stable', readiness: 'ready', history: [] },
        powerOutput: { peak: 1200, average: 850, threshold: 800, trend: 'stable', history: [] },
        recovery: { score: 85, sleepHours: 8, restingHR: 50, trend: 'stable', recommendations: [], history: [] },
        trainingLoad: { acute: 500, chronic: 480, ratio: 1.04, status: 'normal', recommendations: [], history: [] },
        performance: { vo2Max: 55, lactateThreshold: 4.0, maxHR: 188, restingHR: 50, bodyComposition: { weight: 88, bodyFat: 8.5, muscleMass: 40 }, testResults: [] }
      },
      mock: true
    });
  },
  createWellnessEntry: (req: any, res: any) => {
    res.status(201).json({
      success: true,
      message: 'Wellness entry created successfully',
      mock: true
    });
  },
  updateTrainingMetrics: (req: any, res: any) => {
    res.json({
      success: true,
      message: 'Training metrics updated successfully',
      mock: true
    });
  },
  getBatchWellnessSummary: (req: any, res: any) => {
    res.json({
      success: true,
      data: req.body.playerIds.map((id: string) => ({
        playerId: id,
        playerName: `Test Player ${id}`,
        currentWellness: { sleep: 8, stress: 3, energy: 8, soreness: 4, mood: 8 },
        overallTrend: 'stable',
        alertLevel: 'normal'
      })),
      mock: true
    });
  }
}));

const app = express();
app.use(express.json());
app.use('/api/training', playerWellnessRoutes);

describe('Player Wellness Routes', () => {
  describe('GET /api/training/player-status', () => {
    it('should return team player status', async () => {
      const response = await request(app)
        .get('/api/training/player-status?teamId=team-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamId).toBe('team-1');
      expect(response.body.data.teamName).toBe('Test Team');
      expect(response.body.mock).toBe(true);
    });

    it('should return 400 when teamId is missing', async () => {
      const response = await request(app)
        .get('/api/training/player-status')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/training/player-wellness/:playerId', () => {
    it('should return player wellness details', async () => {
      const response = await request(app)
        .get('/api/training/player-wellness/player-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.playerId).toBe('player-1');
      expect(response.body.data.playerName).toBe('Test Player');
      expect(response.body.mock).toBe(true);
    });
  });

  describe('GET /api/training/player-metrics/:playerId', () => {
    it('should return player training metrics', async () => {
      const response = await request(app)
        .get('/api/training/player-metrics/player-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.playerId).toBe('player-1');
      expect(response.body.data.hrVariability).toBeDefined();
      expect(response.body.data.powerOutput).toBeDefined();
      expect(response.body.data.recovery).toBeDefined();
      expect(response.body.data.trainingLoad).toBeDefined();
      expect(response.body.mock).toBe(true);
    });
  });

  describe('POST /api/training/player-wellness', () => {
    it('should create wellness entry', async () => {
      const wellnessData = {
        playerId: 'player-1',
        sleep: 8,
        stress: 3,
        energy: 8,
        soreness: 4,
        mood: 8,
        notes: 'Feeling great today'
      };

      const response = await request(app)
        .post('/api/training/player-wellness')
        .send(wellnessData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wellness entry created successfully');
    });
  });

  describe('PUT /api/training/player-metrics', () => {
    it('should update training metrics', async () => {
      const metricsData = {
        playerId: 'player-1',
        hrVariability: 42,
        restingHR: 48,
        sleepHours: 8.5,
        trainingLoad: 520,
        notes: 'Excellent recovery metrics'
      };

      const response = await request(app)
        .put('/api/training/player-metrics')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Training metrics updated successfully');
    });
  });

  describe('POST /api/training/player-wellness/batch', () => {
    it('should return batch wellness summary', async () => {
      const batchData = {
        playerIds: ['player-1', 'player-2', 'player-3']
      };

      const response = await request(app)
        .post('/api/training/player-wellness/batch')
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].playerId).toBe('player-1');
      expect(response.body.data[0].currentWellness).toBeDefined();
    });
  });
});