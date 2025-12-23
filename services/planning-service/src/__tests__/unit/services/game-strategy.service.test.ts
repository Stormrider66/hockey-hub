import { GameStrategyService, CreateGameStrategyDto, UpdateGameStrategyDto } from '../../../services/GameStrategyService';
import { GameStrategy, Lineups, PostGameAnalysis, PeriodAdjustment, PlayerPerformance } from '../../../entities/GameStrategy';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('GameStrategyService', () => {
  let service: GameStrategyService;
  let mockRepository: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockLineups: Lineups = {
    even_strength: [
      {
        name: 'Line 1',
        forwards: ['player-1', 'player-2', 'player-3'],
        defense: ['player-4', 'player-5'],
        goalie: 'goalie-1',
        chemistry: 85
      }
    ],
    powerplay: [
      {
        name: 'PP1',
        forwards: ['player-1', 'player-2', 'player-6'],
        defense: ['player-4', 'player-7'],
        goalie: 'goalie-1',
        chemistry: 90
      }
    ],
    penalty_kill: [
      {
        name: 'PK1',
        forwards: ['player-8', 'player-9'],
        defense: ['player-4', 'player-5'],
        goalie: 'goalie-1',
        chemistry: 88
      }
    ],
    overtime: [
      {
        name: '3v3 Line',
        forwards: ['player-1', 'player-2'],
        defense: ['player-4'],
        goalie: 'goalie-1',
        chemistry: 92
      }
    ],
    extra_attacker: [
      {
        name: '6v5 Line',
        forwards: ['player-1', 'player-2', 'player-3', 'player-6'],
        defense: ['player-4', 'player-5'],
        goalie: null as any,
        chemistry: 80
      }
    ]
  };

  const mockGameStrategy: Partial<GameStrategy> = {
    id: 'game-strategy-1',
    organizationId: 'org-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    gameId: 'game-1',
    opponentTeamId: 'opponent-1',
    opponentTeamName: 'Rival Team',
    lineups: mockLineups,
    matchups: [{ playerId: 'player-1', opponent: 'opp-player-1', instruction: 'Shadow closely' }],
    specialInstructions: [{ situation: 'powerplay', instruction: 'Focus on net presence' }],
    preGameSpeech: 'Give it your all!',
    gameCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    getTeamAverageRating: jest.fn().mockReturnValue(7.5),
    addPeriodAdjustment: jest.fn(),
    addPlayerPerformance: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findByTeamAndSeason: jest.fn(),
      findByCoach: jest.fn(),
      findByOpponent: jest.fn(),
      searchGameStrategies: jest.fn(),
      getGameStrategyAnalytics: jest.fn(),
      invalidateByTags: jest.fn(),
      cacheQueryResult: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      getInstance: jest.fn()
    } as any;

    // Setup static mocks
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);
    // When EventBus is automocked by Jest, its static methods aren't guaranteed to exist.
    // Ensure getInstance is a jest.fn so tests can control the singleton.
    (EventBus as any).getInstance = (EventBus as any).getInstance || jest.fn();
    ((EventBus as any).getInstance as jest.Mock).mockReturnValue(mockEventBus);

    service = new GameStrategyService();
    
    // Replace repository instance
    (service as any).repository = mockRepository;
  });

  describe('createGameStrategy', () => {
    const createDto: CreateGameStrategyDto = {
      organizationId: 'org-1',
      coachId: 'coach-1',
      teamId: 'team-1',
      gameId: 'game-1',
      opponentTeamId: 'opponent-1',
      opponentTeamName: 'Rival Team',
      lineups: mockLineups,
      matchups: [{ playerId: 'player-1', opponent: 'opp-player-1', instruction: 'Shadow closely' }],
      preGameSpeech: 'Give it your all!',
      tags: ['home', 'rivalry']
    };

    it('should create a game strategy successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockGameStrategy);

      // Act
      const result = await service.createGameStrategy(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        gameCompleted: false
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('game-strategy.created', {
        gameStrategyId: mockGameStrategy.id,
        gameId: createDto.gameId,
        teamId: createDto.teamId,
        coachId: createDto.coachId,
        opponent: createDto.opponentTeamName,
        organizationId: createDto.organizationId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating game strategy',
        { gameId: createDto.gameId, opponent: createDto.opponentTeamName }
      );
      expect(result).toEqual(mockGameStrategy);
    });

    it('should validate lineup structure', async () => {
      // Arrange
      const invalidLineups: Lineups = {
        ...mockLineups,
        even_strength: [
          {
            name: '', // Invalid empty name
            forwards: ['player-1', 'player-2', 'player-3'],
            defense: ['player-4', 'player-5'],
            goalie: 'goalie-1',
            chemistry: 85
          }
        ]
      };
      const invalidCreateDto = { ...createDto, lineups: invalidLineups };

      // Act & Assert
      await expect(service.createGameStrategy(invalidCreateDto)).rejects.toThrow(
        'Line 1 in even_strength must have a name'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate chemistry ratings', async () => {
      // Arrange
      const invalidLineups: Lineups = {
        ...mockLineups,
        powerplay: [
          {
            name: 'PP1',
            forwards: ['player-1', 'player-2', 'player-6'],
            defense: ['player-4', 'player-7'],
            goalie: 'goalie-1',
            chemistry: 150 // Invalid chemistry > 100
          }
        ]
      };
      const invalidCreateDto = { ...createDto, lineups: invalidLineups };

      // Act & Assert
      await expect(service.createGameStrategy(invalidCreateDto)).rejects.toThrow(
        'Line 1 in powerplay chemistry must be between 0 and 100'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate player counts for lineup types', async () => {
      // Arrange
      const invalidLineups: Lineups = {
        ...mockLineups,
        penalty_kill: [
          {
            name: 'PK1',
            forwards: ['player-1', 'player-2', 'player-3'], // Too many forwards for PK (should be 2)
            defense: ['player-4', 'player-5'],
            goalie: 'goalie-1',
            chemistry: 85
          }
        ]
      };
      const invalidCreateDto = { ...createDto, lineups: invalidLineups };

      // Act & Assert
      await expect(service.createGameStrategy(invalidCreateDto)).rejects.toThrow(
        'penalty_kill lines should have 2 forwards'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createGameStrategy(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating game strategy',
        { error: error.message, data: createDto }
      );
    });
  });

  describe('updateGameStrategy', () => {
    const updateDto: UpdateGameStrategyDto = {
      preGameSpeech: 'Updated speech',
      gameCompleted: true,
      tags: ['updated']
    };

    it('should update a game strategy successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      mockRepository.save.mockResolvedValue({ ...mockGameStrategy, ...updateDto });

      // Act
      const result = await service.updateGameStrategy('game-strategy-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'game-strategy-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockGameStrategy.teamId}`,
        `coach:${mockGameStrategy.coachId}`,
        `organization:${mockGameStrategy.organizationId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('game-strategy.updated', {
        gameStrategyId: 'game-strategy-1',
        gameId: mockGameStrategy.gameId,
        teamId: mockGameStrategy.teamId,
        coachId: mockGameStrategy.coachId,
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockGameStrategy, ...updateDto });
    });

    it('should throw error when game strategy not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateGameStrategy('invalid-id', updateDto))
        .rejects.toThrow('Game strategy not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate lineups when provided in update', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      const invalidLineups: Lineups = {
        ...mockLineups,
        overtime: [
          {
            name: 'OT Line',
            forwards: ['player-1', 'player-2', 'player-3'], // Too many for 3v3
            defense: ['player-4'],
            goalie: 'goalie-1',
            chemistry: 85
          }
        ]
      };
      const updateWithInvalidLineups = { lineups: invalidLineups };

      // Act & Assert
      await expect(service.updateGameStrategy('game-strategy-1', updateWithInvalidLineups))
        .rejects.toThrow('overtime lines should have 2 forwards');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle update errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateGameStrategy('game-strategy-1', updateDto))
        .rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating game strategy',
        { error: error.message, id: 'game-strategy-1', data: updateDto }
      );
    });
  });

  describe('deleteGameStrategy', () => {
    it('should delete a game strategy successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      mockRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.deleteGameStrategy('game-strategy-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'game-strategy-1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockGameStrategy);
      expect(mockEventBus.publish).toHaveBeenCalledWith('game-strategy.deleted', {
        gameStrategyId: 'game-strategy-1',
        gameId: mockGameStrategy.gameId,
        teamId: mockGameStrategy.teamId,
        coachId: mockGameStrategy.coachId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Game strategy deleted successfully',
        { id: 'game-strategy-1' }
      );
    });

    it('should throw error when game strategy not found for deletion', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteGameStrategy('invalid-id'))
        .rejects.toThrow('Game strategy not found');
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle deletion errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      const error = new Error('Delete failed');
      mockRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteGameStrategy('game-strategy-1'))
        .rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting game strategy',
        { error: error.message, id: 'game-strategy-1' }
      );
    });
  });

  describe('duplicateGameStrategy', () => {
    it('should duplicate a game strategy successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      const createSpy = jest.spyOn(service, 'createGameStrategy');
      const duplicatedStrategy = { ...mockGameStrategy, id: 'new-strategy-id' };
      // Ensure the original object isn't polluted by other tests mutating shared mocks
      const originalStrategy = { ...mockGameStrategy, tags: undefined };
      
      getSpy.mockResolvedValue(originalStrategy as GameStrategy);
      createSpy.mockResolvedValue(duplicatedStrategy as GameStrategy);

      // Act
      const result = await service.duplicateGameStrategy(
        'game-strategy-1', 
        'new-game-id', 
        { teamId: 'new-opponent-id', teamName: 'New Opponent' }
      );

      // Assert
      expect(getSpy).toHaveBeenCalledWith('game-strategy-1');
      expect(createSpy).toHaveBeenCalledWith({
        organizationId: originalStrategy.organizationId,
        coachId: originalStrategy.coachId,
        teamId: originalStrategy.teamId,
        gameId: 'new-game-id',
        opponentTeamId: 'new-opponent-id',
        opponentTeamName: 'New Opponent',
        lineups: expect.any(Object),
        matchups: [...originalStrategy.matchups!],
        specialInstructions: [...originalStrategy.specialInstructions!],
        opponentScouting: undefined,
        preGameSpeech: originalStrategy.preGameSpeech,
        tags: undefined
      });
      expect(result).toEqual(duplicatedStrategy);

      getSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('should throw error when original strategy not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.duplicateGameStrategy('invalid-id', 'new-game-id'))
        .rejects.toThrow('Game strategy not found');

      getSpy.mockRestore();
    });
  });

  describe('addPeriodAdjustment', () => {
    const periodAdjustment: PeriodAdjustment = {
      period: 2,
      adjustments: ['Change line matching'],
      reason: 'Need more speed',
      timestamp: new Date()
    };

    it('should add period adjustment successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      getSpy.mockResolvedValue(mockGameStrategy as GameStrategy);
      mockRepository.save.mockResolvedValue(mockGameStrategy);

      // Act
      const result = await service.addPeriodAdjustment('game-strategy-1', periodAdjustment);

      // Assert
      expect(getSpy).toHaveBeenCalledWith('game-strategy-1');
      expect(mockGameStrategy.addPeriodAdjustment).toHaveBeenCalledWith(periodAdjustment);
      expect(mockRepository.save).toHaveBeenCalledWith(mockGameStrategy);
      expect(result).toEqual(mockGameStrategy);

      getSpy.mockRestore();
    });

    it('should throw error when game strategy not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addPeriodAdjustment('invalid-id', periodAdjustment))
        .rejects.toThrow('Game strategy not found');

      getSpy.mockRestore();
    });
  });

  describe('recordPostGameAnalysis', () => {
    const postGameAnalysis: PostGameAnalysis = {
      goalsFor: [
        { scorer: 'player-1', assists: ['player-2'], time: '5:23', period: 1 }
      ],
      goalsAgainst: [
        { scorer: 'opp-player-1', assists: [], time: '10:15', period: 2 }
      ],
      playerPerformance: [
        { playerId: 'player-1', rating: 8, goals: 1, assists: 0, notes: 'Great game' }
      ],
      whatWorked: ['Power play execution'],
      whatDidntWork: ['Defensive zone coverage'],
      keyMoments: ['First goal momentum'],
      coachRating: 7,
      overallPerformance: 'Good effort'
    };

    it('should record post-game analysis successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      const updateSpy = jest.spyOn(service, 'updateGameStrategy');
      const updatedStrategy = { ...mockGameStrategy, postGameAnalysis, gameCompleted: true };
      
      getSpy.mockResolvedValue(mockGameStrategy as GameStrategy);
      updateSpy.mockResolvedValue(updatedStrategy as GameStrategy);

      // Act
      const result = await service.recordPostGameAnalysis('game-strategy-1', postGameAnalysis);

      // Assert
      expect(getSpy).toHaveBeenCalledWith('game-strategy-1');
      expect(updateSpy).toHaveBeenCalledWith('game-strategy-1', {
        postGameAnalysis,
        gameCompleted: true
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('game-strategy.post-game-analysis', {
        gameStrategyId: 'game-strategy-1',
        gameId: mockGameStrategy.gameId,
        teamId: mockGameStrategy.teamId,
        averageRating: 7.5,
        goalsFor: 1,
        goalsAgainst: 1
      });
      expect(result).toEqual(updatedStrategy);

      getSpy.mockRestore();
      updateSpy.mockRestore();
    });

    it('should throw error when game strategy not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getGameStrategyById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.recordPostGameAnalysis('invalid-id', postGameAnalysis))
        .rejects.toThrow('Game strategy not found');

      getSpy.mockRestore();
    });
  });

  describe('analyzeLineupUsage', () => {
    const completedStrategies = [
      {
        ...mockGameStrategy,
        gameCompleted: true,
        lineups: mockLineups,
        getTeamAverageRating: () => 7.5
      } as GameStrategy
    ];

    it('should analyze lineup usage successfully', async () => {
      // Arrange
      mockRepository.findByTeamAndSeason.mockResolvedValue(completedStrategies);

      // Act
      const result = await service.analyzeLineupUsage(
        'team-1',
        new Date('2025-01-01'),
        new Date('2025-02-01')
      );

      // Assert
      expect(mockRepository.findByTeamAndSeason).toHaveBeenCalledWith(
        'team-1',
        expect.any(Date),
        expect.any(Date),
        true
      );
      expect(result).toHaveLength(5); // 5 lineup types
      expect(result[0]).toHaveProperty('lineupType', 'even_strength');
      expect(result[0]).toHaveProperty('totalLines');
      expect(result[0]).toHaveProperty('averageChemistry');
      expect(result[0]).toHaveProperty('playersUsed');
      expect(result[0]).toHaveProperty('mostUsedPlayers');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Analyzing lineup usage',
        { teamId: 'team-1' }
      );
    });

    it('should handle analysis errors and log them', async () => {
      // Arrange
      const error = new Error('Analysis failed');
      mockRepository.findByTeamAndSeason.mockRejectedValue(error);

      // Act & Assert
      await expect(service.analyzeLineupUsage('team-1', new Date(), new Date()))
        .rejects.toThrow('Analysis failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error analyzing lineup usage',
        { error: error.message, teamId: 'team-1' }
      );
    });
  });

  describe('getOpponentHistory', () => {
    const historicalStrategies = [
      {
        ...mockGameStrategy,
        gameCompleted: true,
        postGameAnalysis: {
          whatWorked: ['Fast break offense', 'Tight checking'],
          playerPerformance: [
            { playerId: 'player-1', rating: 8, goals: 1, assists: 1 }
          ]
        },
        getTeamAverageRating: () => 8.0
      } as GameStrategy
    ];

    it('should get opponent history successfully', async () => {
      // Arrange
      mockRepository.findByOpponent.mockResolvedValue(historicalStrategies);

      // Act
      const result = await service.getOpponentHistory('team-1', 'opponent-1');

      // Assert
      expect(mockRepository.findByOpponent).toHaveBeenCalledWith('team-1', 'opponent-1', 20);
      expect(result).toEqual({
        totalGames: 1,
        averageTeamRating: 8.0,
        commonStrategies: ['Fast break offense', 'Tight checking'],
        successfulLineups: expect.any(Array),
        keyInsights: expect.any(Array)
      });
      expect(result.keyInsights).toContain('Played 1 games against this opponent');
      expect(result.keyInsights).toContain('Average team rating: 8.0/10');
    });

    it('should handle no history case', async () => {
      // Arrange
      mockRepository.findByOpponent.mockResolvedValue([]);

      // Act
      const result = await service.getOpponentHistory('team-1', 'opponent-1');

      // Assert
      expect(result).toEqual({
        totalGames: 0,
        averageTeamRating: 0,
        commonStrategies: [],
        successfulLineups: [],
        keyInsights: []
      });
    });

    it('should handle history errors and log them', async () => {
      // Arrange
      const error = new Error('History retrieval failed');
      mockRepository.findByOpponent.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getOpponentHistory('team-1', 'opponent-1'))
        .rejects.toThrow('History retrieval failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting opponent history',
        { error: error.message, teamId: 'team-1', opponentTeamId: 'opponent-1' }
      );
    });
  });

  describe('cache integration', () => {
    it('should use cached results for team queries', async () => {
      // Arrange
      const cachedStrategies = [mockGameStrategy];
      mockRepository.findByTeamAndSeason.mockResolvedValue(cachedStrategies);

      // Act
      const result = await service.getGameStrategiesByTeam('team-1');

      // Assert
      expect(mockRepository.findByTeamAndSeason).toHaveBeenCalledWith(
        'team-1',
        expect.any(Date),
        expect.any(Date),
        undefined
      );
      expect(result).toEqual(cachedStrategies);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockGameStrategy);
      mockRepository.save.mockResolvedValue(mockGameStrategy);

      // Act
      await service.updateGameStrategy('game-strategy-1', { preGameSpeech: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockGameStrategy.teamId}`,
        `coach:${mockGameStrategy.coachId}`,
        `organization:${mockGameStrategy.organizationId}`
      ]);
    });
  });

  describe('analytics', () => {
    it('should retrieve game strategy analytics', async () => {
      // Arrange
      const analytics = {
        totalGames: 10,
        completedGames: 8,
        gamesWithPostAnalysis: 6,
        completionRate: 80,
        analysisRate: 75,
        mostPlayedOpponents: [{ opponent: 'Rival Team', gamesPlayed: 3 }],
        averageTeamRating: 7.2,
        lastUpdated: new Date()
      };
      mockRepository.getGameStrategyAnalytics.mockResolvedValue(analytics);

      // Act
      const result = await service.getGameStrategyAnalytics('org-1', 'team-1');

      // Assert
      expect(mockRepository.getGameStrategyAnalytics).toHaveBeenCalledWith('org-1', 'team-1', undefined, undefined);
      expect(result).toEqual(analytics);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockGameStrategy);
      const createDto: CreateGameStrategyDto = {
        organizationId: 'org-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        gameId: 'game-1',
        opponentTeamId: 'opponent-1',
        opponentTeamName: 'Test Opponent',
        lineups: mockLineups
      };

      // Act
      await service.createGameStrategy(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('game-strategy.created', {
        gameStrategyId: mockGameStrategy.id,
        gameId: createDto.gameId,
        teamId: createDto.teamId,
        coachId: createDto.coachId,
        opponent: createDto.opponentTeamName,
        organizationId: createDto.organizationId
      });
    });

    it('should not publish events on validation failures', async () => {
      // Arrange
      const invalidDto: CreateGameStrategyDto = {
        organizationId: 'org-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        gameId: 'game-1',
        opponentTeamId: 'opponent-1',
        opponentTeamName: 'Test Opponent',
        lineups: {
          ...mockLineups,
          even_strength: [
            {
              name: '',
              forwards: ['player-1'],
              defense: ['player-2'],
              goalie: 'goalie-1',
              chemistry: 85
            }
          ]
        }
      };

      // Act & Assert
      await expect(service.createGameStrategy(invalidDto)).rejects.toThrow();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});