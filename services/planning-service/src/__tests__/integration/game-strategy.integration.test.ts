/**
 * @file game-strategy.integration.test.ts
 * @description Comprehensive integration tests for Game Strategy APIs
 * Tests strategy creation for games, lineup management, post-game analysis,
 * period adjustments, and opponent scouting functionality
 */

import request from 'supertest';
import { Application } from 'express';
import { Connection, createConnection, getRepository } from 'typeorm';
import express from 'express';
import { 
  GameStrategy, 
  LineCombo, 
  Matchup, 
  SpecialInstruction, 
  OpponentScouting,
  Lineups,
  PeriodAdjustment,
  PostGameAnalysis,
  PlayerPerformance,
  GoalAnalysis
} from '../../entities/GameStrategy';
import { GameStrategyController } from '../../controllers/coach/game-strategy.controller';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';

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

describe('Game Strategy Integration Tests', () => {
  let app: Application;
  let connection: Connection;
  let repository: any;

  // Test data
  const testOrganizationId = '11111111-1111-4111-8111-111111111111';
  const testCoachId = '22222222-2222-4222-8222-222222222222';
  const testTeamId = '33333333-3333-4333-8333-333333333333';
  const testGameId = '77777777-7777-4777-8777-777777777777';
  const testOpponentTeamId = '88888888-8888-4888-8888-888888888888';
  const otherCoachId = '44444444-4444-4444-8444-444444444444';
  const otherTeamId = '55555555-5555-4555-8555-555555555555';

  const mockEvenStrengthLines: LineCombo[] = [
    {
      name: 'First Line',
      forwards: ['player-1', 'player-2', 'player-3'],
      defense: ['player-13', 'player-14'],
      goalie: 'player-19',
      chemistry: 85,
      minutesPlayed: 0,
      plusMinus: 0
    },
    {
      name: 'Second Line',
      forwards: ['player-4', 'player-5', 'player-6'],
      defense: ['player-15', 'player-16'],
      goalie: 'player-19',
      chemistry: 75,
      minutesPlayed: 0,
      plusMinus: 0
    }
  ];

  const mockPowerPlayLines: LineCombo[] = [
    {
      name: 'PP1',
      forwards: ['player-1', 'player-2', 'player-4'],
      defense: ['player-13'],
      goalie: 'player-19',
      chemistry: 90,
      minutesPlayed: 0,
      plusMinus: 0
    }
  ];

  const mockPenaltyKillLines: LineCombo[] = [
    {
      name: 'PK1',
      forwards: ['player-7', 'player-8'],
      defense: ['player-15', 'player-16'],
      goalie: 'player-19',
      chemistry: 80,
      minutesPlayed: 0,
      plusMinus: 0
    }
  ];

  const mockLineups: Lineups = {
    even_strength: mockEvenStrengthLines,
    powerplay: mockPowerPlayLines,
    penalty_kill: mockPenaltyKillLines
  };

  const mockMatchups: Matchup[] = [
    {
      ourLine: 'First Line',
      opposingLine: 'McDavid Line',
      strategy: 'Heavy forecheck, pressure their defense'
    },
    {
      ourLine: 'Second Line',
      opposingLine: 'Checking Line',
      strategy: 'Play fast, create turnovers'
    }
  ];

  const mockSpecialInstructions: SpecialInstruction[] = [
    {
      playerId: 'player-1',
      instructions: ['Take faceoffs on PP', 'Lead by example']
    },
    {
      playerId: 'player-13',
      instructions: ['Quarterback the power play', 'Stay back on rushes']
    }
  ];

  const mockOpponentScouting: OpponentScouting = {
    strengths: ['Fast transition', 'Strong power play', 'Elite goaltending'],
    weaknesses: ['Slow defensive zone coverage', 'Penalty kill struggles'],
    keyPlayers: [
      {
        playerId: 'opp-player-1',
        name: 'Connor McDavid',
        tendencies: ['Drives wide on rushes', 'Looks for backdoor pass'],
        howToDefend: 'Force to outside, take away passing lanes'
      },
      {
        playerId: 'opp-player-2',
        name: 'Leon Draisaitl',
        tendencies: ['Strong net front presence', 'One-timer from left circle'],
        howToDefend: 'Body contact, stick on stick'
      }
    ],
    goalieTendencies: {
      gloveHigh: 15,
      gloveLow: 20,
      blockerHigh: 25,
      blockerLow: 15,
      fiveHole: 10,
      wraparound: 15
    }
  };

  const mockPeriodAdjustments: PeriodAdjustment[] = [
    {
      period: 2,
      adjustments: ['More shots from the point', 'Pressure their weak side D'],
      lineChanges: { 'Third Line': 'More ice time in offensive zone' }
    }
  ];

  const mockPostGameAnalysis: PostGameAnalysis = {
    goalsFor: [
      {
        time: '5:23',
        period: 1,
        scoredBy: 'player-1',
        assists: ['player-2', 'player-13'],
        situation: 'Even Strength',
        description: 'Beautiful passing play from behind the net',
        preventable: false
      }
    ],
    goalsAgainst: [
      {
        time: '12:45',
        period: 2,
        scoredBy: 'opp-player-1',
        assists: ['opp-player-2'],
        situation: 'Power Play',
        description: 'Deflection from point shot',
        preventable: true,
        notes: 'Need better box coverage'
      }
    ],
    whatWorked: ['First line created chances', 'Power play looked sharp'],
    whatDidntWork: ['Penalty kill needs work', 'Too many turnovers'],
    playerPerformance: [
      { playerId: 'player-1', rating: 9, notes: 'Excellent game, great leadership' },
      { playerId: 'player-2', rating: 7, notes: 'Solid game, good passing' }
    ]
  };

  beforeAll(async () => {
    // Create in-memory database connection
    connection = await createConnection({
      // Use sqljs to avoid native sqlite3 dependency (works in pure JS)
      type: 'sqljs',
      autoSave: false,
      location: ':memory:',
      entities: [GameStrategy],
      synchronize: true,
      logging: false,
    } as any);

    repository = getRepository(GameStrategy);

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    // Add routes (assuming these exist)
    app.post('/api/planning/game-strategies', GameStrategyController.create);
    app.get('/api/planning/game-strategies', GameStrategyController.list);
    app.get('/api/planning/game-strategies/:id', GameStrategyController.getById);
    app.put('/api/planning/game-strategies/:id', GameStrategyController.update);
    app.delete('/api/planning/game-strategies/:id', GameStrategyController.delete);
    app.post('/api/planning/game-strategies/:id/lineups', GameStrategyController.updateLineups);
    app.post('/api/planning/game-strategies/:id/period-adjustments', GameStrategyController.addPeriodAdjustment);
    app.post('/api/planning/game-strategies/:id/post-game-analysis', GameStrategyController.updatePostGameAnalysis);
    app.get('/api/planning/game-strategies/game/:gameId', GameStrategyController.getByGameId);

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

  describe('POST /api/planning/game-strategies', () => {
    it('should create a new game strategy', async () => {
      const strategyData = {
        gameId: testGameId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Edmonton Oilers',
        lineups: mockLineups,
        matchups: mockMatchups,
        specialInstructions: mockSpecialInstructions,
        opponentScouting: mockOpponentScouting,
        preGameSpeech: 'Play our game, stay disciplined',
        tags: ['regular-season', 'home-game']
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send(strategyData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        gameId: testGameId,
        teamId: testTeamId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Edmonton Oilers',
        gameCompleted: false,
        preGameSpeech: strategyData.preGameSpeech
      });

      expect(response.body.lineups).toEqual(mockLineups);
      expect(response.body.matchups).toEqual(mockMatchups);
      expect(response.body.specialInstructions).toEqual(mockSpecialInstructions);
      expect(response.body.opponentScouting).toEqual(mockOpponentScouting);
      expect(response.body.tags).toEqual(strategyData.tags);

      // Verify in database
      const saved = await repository.findOne({ where: { id: response.body.id } });
      expect(saved).toBeDefined();
      expect(saved.gameId).toBe(testGameId);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        gameId: '', // Invalid empty gameId
        teamId: 'invalid-uuid', // Invalid UUID format
        opponentTeamId: '', // Missing required field
        lineups: null // Missing required field
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send(invalidData)
        .expect(400);

      // Check that no strategy was created
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should validate lineup structure', async () => {
      const invalidLineups = {
        even_strength: [
          {
            name: 'Invalid Line',
            forwards: ['player-1'], // Too few forwards
            defense: [], // No defense
            chemistry: 150 // Invalid chemistry > 100
          }
        ],
        powerplay: [], // Missing power play lines
        penalty_kill: [] // Missing penalty kill lines
      };

      const strategyData = {
        gameId: testGameId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: invalidLineups
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send(strategyData)
        .expect(400);

      expect(response.body.error).toContain('lineup');
    });

    it('should prevent duplicate strategies for same game', async () => {
      // Create first strategy
      const firstStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });

      // Try to create second strategy for same game
      const strategyData = {
        gameId: testGameId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send(strategyData)
        .expect(409);

      expect(response.body.error).toContain('Strategy already exists for this game');
    });
  });

  describe('GET /api/planning/game-strategies', () => {
    beforeEach(async () => {
      const testStrategies = [
        {
          gameId: 'game-1',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          opponentTeamId: 'opp-1',
          opponentTeamName: 'Team A',
          lineups: mockLineups,
          gameCompleted: false,
          tags: ['regular-season', 'home']
        },
        {
          gameId: 'game-2',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: testTeamId,
          opponentTeamId: 'opp-2',
          opponentTeamName: 'Team B',
          lineups: mockLineups,
          gameCompleted: true,
          tags: ['regular-season', 'away'],
          postGameAnalysis: mockPostGameAnalysis
        },
        {
          gameId: 'game-3',
          organizationId: testOrganizationId,
          coachId: testCoachId,
          teamId: otherTeamId,
          opponentTeamId: 'opp-3',
          opponentTeamName: 'Team C',
          lineups: mockLineups,
          gameCompleted: false,
          tags: ['playoffs']
        }
      ];

      await repository.save(testStrategies);
    });

    it('should return paginated game strategies', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies?page=1&pageSize=2')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        page: 1,
        pageSize: 2,
        total: 3,
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by teamId', async () => {
      const response = await request(app)
        .get(`/api/planning/game-strategies?teamId=${testTeamId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((strategy: any) => strategy.teamId === testTeamId)).toBe(true);
    });

    it('should filter by gameCompleted status', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies?completed=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].gameCompleted).toBe(true);
    });

    it('should filter by opponent team', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies?opponentId=opp-1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].opponentTeamId).toBe('opp-1');
    });

    it('should search by opponent team name', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies?search=team%20a')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].opponentTeamName).toContain('Team A');
    });

    it('should filter by tags', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies?tags=playoffs')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tags).toContain('playoffs');
    });

    it('should include calculated statistics', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies')
        .expect(200);

      const strategyWithAnalysis = response.body.data.find((s: any) => s.gameCompleted);
      expect(strategyWithAnalysis.totalLineups).toBeDefined();
      expect(strategyWithAnalysis.averageChemistry).toBeDefined();
      expect(strategyWithAnalysis.teamAverageRating).toBeDefined();
    });
  });

  describe('GET /api/planning/game-strategies/:id', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Edmonton Oilers',
        lineups: mockLineups,
        matchups: mockMatchups,
        specialInstructions: mockSpecialInstructions,
        opponentScouting: mockOpponentScouting,
        periodAdjustments: mockPeriodAdjustments,
        preGameSpeech: 'Play hard and smart',
        gameCompleted: false,
        tags: ['regular-season', 'home']
      });
    });

    it('should return complete game strategy', async () => {
      const response = await request(app)
        .get(`/api/planning/game-strategies/${testStrategy.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testStrategy.id,
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Edmonton Oilers',
        preGameSpeech: 'Play hard and smart'
      });

      expect(response.body.lineups).toEqual(mockLineups);
      expect(response.body.matchups).toEqual(mockMatchups);
      expect(response.body.specialInstructions).toEqual(mockSpecialInstructions);
      expect(response.body.opponentScouting).toEqual(mockOpponentScouting);
      expect(response.body.periodAdjustments).toEqual(mockPeriodAdjustments);
    });

    it('should return 404 for non-existent strategy', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Game strategy not found');
    });

    it('should include calculated metrics', async () => {
      const response = await request(app)
        .get(`/api/planning/game-strategies/${testStrategy.id}`)
        .expect(200);

      expect(response.body.totalLineups).toBe(4); // 2 ES + 1 PP + 1 PK
      expect(response.body.averageChemistry).toBe(82.5); // Average of all line chemistries
      expect(response.body.playersInLineup).toEqual(expect.any(Array));
      expect(response.body.playersInLineup.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/planning/game-strategies/game/:gameId', () => {
    beforeEach(async () => {
      await repository.save({
        gameId: 'unique-game-id',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });
    });

    it('should return strategy for specific game', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies/game/unique-game-id')
        .expect(200);

      expect(response.body.gameId).toBe('unique-game-id');
      expect(response.body.organizationId).toBe(testOrganizationId);
    });

    it('should return 404 for non-existent game', async () => {
      const response = await request(app)
        .get('/api/planning/game-strategies/game/non-existent-game')
        .expect(404);

      expect(response.body.error).toBe('Game strategy not found');
    });
  });

  describe('PUT /api/planning/game-strategies/:id', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Original Team',
        lineups: mockLineups,
        gameCompleted: false,
        preGameSpeech: 'Original speech'
      });
    });

    it('should update game strategy', async () => {
      const updates = {
        opponentTeamName: 'Updated Team Name',
        preGameSpeech: 'Updated speech - play with heart',
        tags: ['updated-tag', 'test'],
        opponentScouting: mockOpponentScouting
      };

      const response = await request(app)
        .put(`/api/planning/game-strategies/${testStrategy.id}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testStrategy.id,
        opponentTeamName: updates.opponentTeamName,
        preGameSpeech: updates.preGameSpeech,
        tags: updates.tags
      });

      expect(response.body.opponentScouting).toEqual(mockOpponentScouting);

      // Verify in database
      const updated = await repository.findOne({ where: { id: testStrategy.id } });
      expect(updated.opponentTeamName).toBe(updates.opponentTeamName);
      expect(updated.preGameSpeech).toBe(updates.preGameSpeech);
    });

    it('should prevent updates to completed games', async () => {
      testStrategy.gameCompleted = true;
      await repository.save(testStrategy);

      const response = await request(app)
        .put(`/api/planning/game-strategies/${testStrategy.id}`)
        .send({ preGameSpeech: 'Should not update' })
        .expect(400);

      expect(response.body.error).toContain('Cannot update strategy for completed game');
    });

    it('should enforce coach ownership', async () => {
      const otherCoachStrategy = await repository.save({
        gameId: 'other-game',
        organizationId: testOrganizationId,
        coachId: otherCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Other Coach Team',
        lineups: mockLineups,
        gameCompleted: false
      });

      const response = await request(app)
        .put(`/api/planning/game-strategies/${otherCoachStrategy.id}`)
        .send({ preGameSpeech: 'Hacked update' })
        .expect(404);

      expect(response.body.error).toBe('Game strategy not found or no permission to update');
    });

    it('should validate lineup updates', async () => {
      const invalidLineups = {
        even_strength: [], // No lines
        powerplay: [],
        penalty_kill: []
      };

      const response = await request(app)
        .put(`/api/planning/game-strategies/${testStrategy.id}`)
        .send({ lineups: invalidLineups })
        .expect(400);

      expect(response.body.error).toContain('must have at least one even strength line');
    });
  });

  describe('POST /api/planning/game-strategies/:id/lineups', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });
    });

    it('should update specific lineup type', async () => {
      const newPowerPlayLines: LineCombo[] = [
        {
          name: 'Updated PP1',
          forwards: ['player-1', 'player-4', 'player-7'],
          defense: ['player-13'],
          goalie: 'player-19',
          chemistry: 95,
          minutesPlayed: 0,
          plusMinus: 0
        }
      ];

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/lineups`)
        .send({
          lineupType: 'powerplay',
          lines: newPowerPlayLines
        })
        .expect(200);

      expect(response.body.lineups.powerplay).toEqual(newPowerPlayLines);
      expect(response.body.lineups.even_strength).toEqual(mockEvenStrengthLines); // Should remain unchanged

      // Verify in database
      const updated = await repository.findOne({ where: { id: testStrategy.id } });
      expect(updated.lineups.powerplay).toEqual(newPowerPlayLines);
    });

    it('should validate lineup type', async () => {
      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/lineups`)
        .send({
          lineupType: 'invalid_type',
          lines: []
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid lineup type');
    });

    it('should validate line structure', async () => {
      const invalidLines = [
        {
          name: 'Invalid Line',
          forwards: ['player-1'], // Too few forwards
          defense: [], // No defense
          chemistry: -10 // Invalid chemistry
        }
      ];

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/lineups`)
        .send({
          lineupType: 'even_strength',
          lines: invalidLines
        })
        .expect(400);

      expect(response.body.error).toContain('line validation');
    });

    it('should calculate and update chemistry automatically', async () => {
      const linesWithoutChemistry = [
        {
          name: 'Auto Chemistry Line',
          forwards: ['player-1', 'player-2', 'player-3'],
          defense: ['player-13', 'player-14'],
          goalie: 'player-19'
        }
      ];

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/lineups`)
        .send({
          lineupType: 'even_strength',
          lines: linesWithoutChemistry,
          calculateChemistry: true
        })
        .expect(200);

      expect(response.body.lineups.even_strength[0].chemistry).toBeDefined();
      expect(response.body.lineups.even_strength[0].chemistry).toBeGreaterThan(0);
    });
  });

  describe('POST /api/planning/game-strategies/:id/period-adjustments', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });
    });

    it('should add period adjustment', async () => {
      const newAdjustment: PeriodAdjustment = {
        period: 2,
        adjustments: ['Play more physical', 'Take more shots from the point'],
        lineChanges: { 'Fourth Line': 'More energy shifts' }
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/period-adjustments`)
        .send(newAdjustment)
        .expect(200);

      expect(response.body.periodAdjustments).toHaveLength(1);
      expect(response.body.periodAdjustments[0]).toEqual(newAdjustment);

      // Verify in database
      const updated = await repository.findOne({ where: { id: testStrategy.id } });
      expect(updated.periodAdjustments).toHaveLength(1);
    });

    it('should update existing period adjustment', async () => {
      // Add initial adjustment
      testStrategy.periodAdjustments = [mockPeriodAdjustments[0]];
      await repository.save(testStrategy);

      const updatedAdjustment: PeriodAdjustment = {
        period: 2,
        adjustments: ['Completely different strategy'],
        lineChanges: { 'First Line': 'New role' }
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/period-adjustments`)
        .send(updatedAdjustment)
        .expect(200);

      expect(response.body.periodAdjustments).toHaveLength(1);
      expect(response.body.periodAdjustments[0].adjustments).toEqual(['Completely different strategy']);
    });

    it('should validate period number', async () => {
      const invalidAdjustment = {
        period: 5, // Invalid period
        adjustments: ['Test adjustment']
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/period-adjustments`)
        .send(invalidAdjustment)
        .expect(400);

      expect(response.body.error).toContain('Invalid period');
    });

    it('should prevent adjustments for completed games', async () => {
      testStrategy.gameCompleted = true;
      await repository.save(testStrategy);

      const adjustment: PeriodAdjustment = {
        period: 2,
        adjustments: ['Should not work']
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/period-adjustments`)
        .send(adjustment)
        .expect(400);

      expect(response.body.error).toContain('Cannot add adjustments to completed game');
    });
  });

  describe('POST /api/planning/game-strategies/:id/post-game-analysis', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: true
      });
    });

    it('should add complete post-game analysis', async () => {
      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send(mockPostGameAnalysis)
        .expect(200);

      expect(response.body.postGameAnalysis).toEqual(mockPostGameAnalysis);
      expect(response.body.hasPostGameAnalysis).toBe(true);
      expect(response.body.teamAverageRating).toBe(8); // Average of player ratings

      // Verify in database
      const updated = await repository.findOne({ where: { id: testStrategy.id } });
      expect(updated.postGameAnalysis).toEqual(mockPostGameAnalysis);
    });

    it('should add individual player performance', async () => {
      const playerPerformance: PlayerPerformance = {
        playerId: 'player-1',
        rating: 9,
        notes: 'Outstanding effort and skill'
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send({
          playerPerformance: [playerPerformance]
        })
        .expect(200);

      expect(response.body.postGameAnalysis.playerPerformance).toContainEqual(playerPerformance);
    });

    it('should add goal analysis', async () => {
      const goalFor: GoalAnalysis = {
        time: '3:45',
        period: 1,
        scoredBy: 'player-2',
        assists: ['player-1'],
        situation: 'Power Play',
        description: 'One-timer from the slot',
        preventable: false
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send({
          goalsFor: [goalFor]
        })
        .expect(200);

      expect(response.body.postGameAnalysis.goalsFor).toContainEqual(goalFor);
    });

    it('should prevent analysis for non-completed games', async () => {
      testStrategy.gameCompleted = false;
      await repository.save(testStrategy);

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send(mockPostGameAnalysis)
        .expect(400);

      expect(response.body.error).toContain('Can only add analysis to completed games');
    });

    it('should validate player ratings', async () => {
      const invalidPerformance = {
        playerPerformance: [
          { playerId: 'player-1', rating: 11, notes: 'Too high' }, // Rating > 10
          { playerId: 'player-2', rating: -1, notes: 'Negative' }  // Rating < 0
        ]
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send(invalidPerformance)
        .expect(400);

      expect(response.body.error).toContain('rating must be between 0 and 10');
    });

    it('should merge with existing analysis', async () => {
      // Set initial analysis
      const initialAnalysis = {
        goalsFor: [mockPostGameAnalysis.goalsFor[0]],
        goalsAgainst: [],
        whatWorked: ['Initial working item'],
        whatDidntWork: [],
        playerPerformance: [mockPostGameAnalysis.playerPerformance[0]]
      };

      testStrategy.postGameAnalysis = initialAnalysis;
      await repository.save(testStrategy);

      const additionalAnalysis = {
        goalsAgainst: mockPostGameAnalysis.goalsAgainst,
        whatWorked: ['Additional working item'],
        whatDidntWork: mockPostGameAnalysis.whatDidntWork,
        playerPerformance: [mockPostGameAnalysis.playerPerformance[1]]
      };

      const response = await request(app)
        .post(`/api/planning/game-strategies/${testStrategy.id}/post-game-analysis`)
        .send(additionalAnalysis)
        .expect(200);

      const analysis = response.body.postGameAnalysis;
      expect(analysis.goalsFor).toHaveLength(1);
      expect(analysis.goalsAgainst).toHaveLength(1);
      expect(analysis.whatWorked).toHaveLength(2);
      expect(analysis.playerPerformance).toHaveLength(2);
    });
  });

  describe('DELETE /api/planning/game-strategies/:id', () => {
    let testStrategy: any;

    beforeEach(async () => {
      testStrategy = await repository.save({
        gameId: testGameId,
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });
    });

    it('should delete game strategy', async () => {
      const response = await request(app)
        .delete(`/api/planning/game-strategies/${testStrategy.id}`)
        .expect(204);

      // Verify deletion
      const deleted = await repository.findOne({ where: { id: testStrategy.id } });
      expect(deleted).toBeNull();
    });

    it('should prevent deletion of completed games', async () => {
      testStrategy.gameCompleted = true;
      await repository.save(testStrategy);

      const response = await request(app)
        .delete(`/api/planning/game-strategies/${testStrategy.id}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete completed game strategy');
    });

    it('should return 404 for non-existent strategy', async () => {
      const response = await request(app)
        .delete('/api/planning/game-strategies/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Game strategy not found');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large lineups efficiently', async () => {
      const largeLineups: Lineups = {
        even_strength: Array.from({ length: 10 }, (_, i) => ({
          name: `Line ${i + 1}`,
          forwards: [`player-${i * 3 + 1}`, `player-${i * 3 + 2}`, `player-${i * 3 + 3}`],
          defense: [`player-${50 + i * 2 + 1}`, `player-${50 + i * 2 + 2}`],
          goalie: 'player-19',
          chemistry: 70 + Math.random() * 30,
          minutesPlayed: 0,
          plusMinus: 0
        })),
        powerplay: mockPowerPlayLines,
        penalty_kill: mockPenaltyKillLines
      };

      const strategyData = {
        gameId: '99999999-9999-4999-8999-999999999999',
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Large Test Team',
        lineups: largeLineups
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send(strategyData)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      expect(response.body.lineups.even_strength).toHaveLength(10);
    });

    it('should handle complex opponent scouting data', async () => {
      const complexScouting: OpponentScouting = {
        strengths: Array.from({ length: 20 }, (_, i) => `Strength ${i + 1}`),
        weaknesses: Array.from({ length: 15 }, (_, i) => `Weakness ${i + 1}`),
        keyPlayers: Array.from({ length: 12 }, (_, i) => ({
          playerId: `opp-player-${i + 1}`,
          name: `Opponent Player ${i + 1}`,
          tendencies: [`Tendency 1`, `Tendency 2`, `Tendency 3`],
          howToDefend: `Defense strategy for player ${i + 1}`
        })),
        goalieTendencies: {
          gloveHigh: 20,
          gloveLow: 25,
          blockerHigh: 20,
          blockerLow: 20,
          fiveHole: 5,
          wraparound: 10
        }
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send({
          gameId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          teamId: testTeamId,
          opponentTeamId: testOpponentTeamId,
          opponentTeamName: 'Complex Team',
          lineups: mockLineups,
          opponentScouting: complexScouting
        })
        .expect(201);

      expect(response.body.opponentScouting.keyPlayers).toHaveLength(12);
      expect(response.body.opponentScouting.strengths).toHaveLength(20);
    });

    it('should validate goalie tendencies sum to 100%', async () => {
      const invalidGoalieTendencies = {
        gloveHigh: 50,
        gloveLow: 50,
        blockerHigh: 50, // This makes total > 100%
        blockerLow: 20,
        fiveHole: 10,
        wraparound: 20
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send({
          gameId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          teamId: testTeamId,
          opponentTeamId: testOpponentTeamId,
          opponentTeamName: 'Test Team',
          lineups: mockLineups,
          opponentScouting: {
            ...mockOpponentScouting,
            goalieTendencies: invalidGoalieTendencies
          }
        })
        .expect(400);

      expect(response.body.error).toContain('goalie tendencies must sum to 100%');
    });

    it('should handle concurrent lineup updates', async () => {
      const strategy = await repository.save({
        gameId: 'concurrent-game',
        organizationId: testOrganizationId,
        coachId: testCoachId,
        teamId: testTeamId,
        opponentTeamId: testOpponentTeamId,
        opponentTeamName: 'Test Team',
        lineups: mockLineups,
        gameCompleted: false
      });

      // Simulate concurrent lineup updates
      const updatePromises = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .post(`/api/planning/game-strategies/${strategy.id}/lineups`)
          .send({
            lineupType: 'even_strength',
            lines: [{
              name: `Concurrent Line ${i}`,
              forwards: ['player-1', 'player-2', 'player-3'],
              defense: ['player-13', 'player-14'],
              goalie: 'player-19',
              chemistry: 80 + i
            }]
          })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // At least one update should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate player assignments in same lineup type', async () => {
      const duplicatePlayerLineups = {
        even_strength: [
          {
            name: 'Line 1',
            forwards: ['player-1', 'player-2', 'player-3'],
            defense: ['player-13', 'player-14'],
            goalie: 'player-19',
            chemistry: 80
          },
          {
            name: 'Line 2',
            forwards: ['player-1', 'player-4', 'player-5'], // player-1 appears twice
            defense: ['player-15', 'player-16'],
            goalie: 'player-19',
            chemistry: 75
          }
        ],
        powerplay: mockPowerPlayLines,
        penalty_kill: mockPenaltyKillLines
      };

      const response = await request(app)
        .post('/api/planning/game-strategies')
        .send({
          gameId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          teamId: testTeamId,
          opponentTeamId: testOpponentTeamId,
          opponentTeamName: 'Test Team',
          lineups: duplicatePlayerLineups
        })
        .expect(400);

      expect(response.body.error).toContain('duplicate player assignments');
    });
  });
});