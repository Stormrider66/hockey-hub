import { PlayerEvaluationService, CreatePlayerEvaluationDto, UpdatePlayerEvaluationDto } from '../../../services/PlayerEvaluationService';
import { PlayerEvaluation, EvaluationType, TechnicalSkills, TacticalSkills, PhysicalAttributes, MentalAttributes } from '../../../entities/PlayerEvaluation';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('PlayerEvaluationService', () => {
  let service: PlayerEvaluationService;
  let mockRepository: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockTechnicalSkills: TechnicalSkills = {
    skating: {
      speed: 8,
      agility: 7,
      balance: 8,
      acceleration: 7,
      backwards: 6,
      transitions: 7,
      edgework: 6,
      crossovers: 8,
      stops: 8,
      turns: 7
    },
    puckHandling: {
      stickhandling: 7,
      protectPuck: 6,
      receiving: 8,
      quickHands: 7,
      creativity: 6
    },
    shooting: {
      wristShot: 8,
      slapshot: 6,
      backhand: 7,
      accuracy: 8,
      release: 7,
      power: 6,
      oneTimer: 5
    },
    passing: {
      accuracy: 8,
      timing: 7,
      vision: 8,
      power: 6,
      saucerPass: 5
    }
  };

  const mockTacticalSkills: TacticalSkills = {
    offensive: {
      positioning: 7,
      cycling: 6,
      screening: 7,
      netDrives: 6,
      rebounds: 7,
      playMaking: 8
    },
    defensive: {
      positioning: 8,
      stickChecking: 7,
      bodyChecking: 6,
      backcheck: 8,
      shotBlocking: 5
    },
    transition: {
      breakouts: 7,
      forechecking: 6,
      neutralZone: 7
    }
  };

  const mockPhysicalAttributes: PhysicalAttributes = {
    strength: 7,
    speed: 8,
    endurance: 7,
    flexibility: 6,
    size: 5,
    durability: 8
  };

  const mockMentalAttributes: MentalAttributes = {
    hockeyIQ: 8,
    competitiveness: 9,
    coachability: 8,
    leadership: 6,
    confidence: 7,
    focus: 8,
    resilience: 7,
    teamwork: 8,
    workEthic: 9
  };

  const mockPlayerEvaluation: Partial<PlayerEvaluation> = {
    id: 'evaluation-1',
    playerId: 'player-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    evaluationDate: new Date('2025-01-15'),
    type: EvaluationType.REGULAR_SEASON,
    technicalSkills: mockTechnicalSkills,
    tacticalSkills: mockTacticalSkills,
    physicalAttributes: mockPhysicalAttributes,
    mentalAttributes: mockMentalAttributes,
    strengths: 'Excellent vision and passing ability, strong skating',
    areasForImprovement: 'Needs to work on shooting power, defensive positioning',
    coachComments: 'Solid player with good potential',
    developmentPriorities: [
      { skill: 'Shooting Power', priority: 'HIGH', timeframe: '3 months' },
      { skill: 'Defensive Play', priority: 'MEDIUM', timeframe: '6 months' }
    ],
    overallRating: 75,
    potential: 'GOOD',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findByPlayer: jest.fn(),
      findByTeamAndPeriod: jest.fn(),
      findByCoach: jest.fn(),
      getEvaluationAnalytics: jest.fn(),
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
    (EventBus.getInstance as jest.Mock).mockReturnValue(mockEventBus);

    service = new PlayerEvaluationService();
    
    // Replace repository instance
    (service as any).repository = mockRepository;
  });

  describe('createPlayerEvaluation', () => {
    const createDto: CreatePlayerEvaluationDto = {
      playerId: 'player-1',
      coachId: 'coach-1',
      teamId: 'team-1',
      evaluationDate: new Date('2025-01-15'),
      type: EvaluationType.REGULAR_SEASON,
      technicalSkills: mockTechnicalSkills,
      tacticalSkills: mockTacticalSkills,
      physicalAttributes: mockPhysicalAttributes,
      mentalAttributes: mockMentalAttributes,
      strengths: 'Strong skating and vision',
      areasForImprovement: 'Shooting accuracy',
      developmentPriorities: [
        { skill: 'Shooting', priority: 'HIGH', timeframe: '2 months' }
      ]
    };

    it('should create a player evaluation successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockPlayerEvaluation);

      // Act
      const result = await service.createPlayerEvaluation(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        overallRating: expect.any(Number) // Calculated rating
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-evaluation.created', {
        evaluationId: mockPlayerEvaluation.id,
        playerId: createDto.playerId,
        coachId: createDto.coachId,
        teamId: createDto.teamId,
        type: createDto.type,
        overallRating: expect.any(Number),
        evaluationDate: createDto.evaluationDate
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating player evaluation',
        { playerId: createDto.playerId, type: createDto.type, coachId: createDto.coachId }
      );
      expect(result).toEqual(mockPlayerEvaluation);
    });

    it('should calculate overall rating when not provided', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue({
        ...mockPlayerEvaluation,
        overallRating: 72
      });

      // Act
      const result = await service.createPlayerEvaluation(createDto);

      // Assert
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.overallRating).toBeDefined();
      expect(savedData.overallRating).toBeGreaterThan(0);
      expect(savedData.overallRating).toBeLessThanOrEqual(100);
    });

    it('should use provided overall rating', async () => {
      // Arrange
      const createDtoWithRating = { ...createDto, overallRating: 85 };
      mockRepository.save.mockResolvedValue({
        ...mockPlayerEvaluation,
        overallRating: 85
      });

      // Act
      await service.createPlayerEvaluation(createDtoWithRating);

      // Assert
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.overallRating).toBe(85);
    });

    it('should validate skill ratings are within range', async () => {
      // Arrange
      const invalidSkills: TechnicalSkills = {
        ...mockTechnicalSkills,
        skating: { ...mockTechnicalSkills.skating, speed: 15 } // Invalid rating > 10
      };
      const invalidDto = { ...createDto, technicalSkills: invalidSkills };

      // Act & Assert
      await expect(service.createPlayerEvaluation(invalidDto)).rejects.toThrow(
        'skating.speed rating must be between 1 and 10'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate all skill categories', async () => {
      // Arrange
      const invalidMentalAttributes: MentalAttributes = {
        ...mockMentalAttributes,
        hockeyIQ: 0 // Invalid rating < 1
      };
      const invalidDto = { ...createDto, mentalAttributes: invalidMentalAttributes };

      // Act & Assert
      await expect(service.createPlayerEvaluation(invalidDto)).rejects.toThrow(
        'mental.hockeyIQ rating must be between 1 and 10'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createPlayerEvaluation(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating player evaluation',
        { error: error.message, data: createDto }
      );
    });
  });

  describe('updatePlayerEvaluation', () => {
    const updateDto: UpdatePlayerEvaluationDto = {
      strengths: 'Updated strengths',
      areasForImprovement: 'Updated areas',
      coachComments: 'Updated comments'
    };

    it('should update a player evaluation successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      mockRepository.save.mockResolvedValue({ ...mockPlayerEvaluation, ...updateDto });

      // Act
      const result = await service.updatePlayerEvaluation('evaluation-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'evaluation-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `player:${mockPlayerEvaluation.playerId}`,
        `coach:${mockPlayerEvaluation.coachId}`,
        `team:${mockPlayerEvaluation.teamId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-evaluation.updated', {
        evaluationId: 'evaluation-1',
        playerId: mockPlayerEvaluation.playerId,
        coachId: mockPlayerEvaluation.coachId,
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockPlayerEvaluation, ...updateDto });
    });

    it('should throw error when evaluation not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updatePlayerEvaluation('invalid-id', updateDto))
        .rejects.toThrow('Player evaluation not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should recalculate overall rating when skills are updated', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      const updateWithSkills = {
        technicalSkills: {
          ...mockTechnicalSkills,
          skating: { ...mockTechnicalSkills.skating, speed: 9 }
        }
      };
      mockRepository.save.mockResolvedValue({
        ...mockPlayerEvaluation,
        ...updateWithSkills,
        overallRating: 78
      });

      // Act
      const result = await service.updatePlayerEvaluation('evaluation-1', updateWithSkills);

      // Assert
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.overallRating).toBeDefined();
      expect(savedData.overallRating).toBeGreaterThan(75); // Should be higher than original
    });

    it('should validate skills when provided in update', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      const invalidUpdate = {
        physicalAttributes: {
          ...mockPhysicalAttributes,
          strength: 11 // Invalid rating > 10
        }
      };

      // Act & Assert
      await expect(service.updatePlayerEvaluation('evaluation-1', invalidUpdate))
        .rejects.toThrow('physical.strength rating must be between 1 and 10');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle update errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updatePlayerEvaluation('evaluation-1', updateDto))
        .rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating player evaluation',
        { error: error.message, id: 'evaluation-1', data: updateDto }
      );
    });
  });

  describe('deletePlayerEvaluation', () => {
    it('should delete a player evaluation successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      mockRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.deletePlayerEvaluation('evaluation-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'evaluation-1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPlayerEvaluation);
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-evaluation.deleted', {
        evaluationId: 'evaluation-1',
        playerId: mockPlayerEvaluation.playerId,
        coachId: mockPlayerEvaluation.coachId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Player evaluation deleted successfully',
        { id: 'evaluation-1' }
      );
    });

    it('should throw error when evaluation not found for deletion', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deletePlayerEvaluation('invalid-id'))
        .rejects.toThrow('Player evaluation not found');
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle deletion errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      const error = new Error('Delete failed');
      mockRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deletePlayerEvaluation('evaluation-1'))
        .rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting player evaluation',
        { error: error.message, id: 'evaluation-1' }
      );
    });
  });

  describe('getPlayerProgressSummary', () => {
    const mockEvaluations = [
      { ...mockPlayerEvaluation, overallRating: 78, evaluationDate: new Date('2025-01-15') },
      { ...mockPlayerEvaluation, id: 'eval-2', overallRating: 75, evaluationDate: new Date('2025-01-01') },
      { ...mockPlayerEvaluation, id: 'eval-3', overallRating: 72, evaluationDate: new Date('2024-12-15') }
    ];

    it('should get player progress summary successfully', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue(mockEvaluations);

      // Act
      const result = await service.getPlayerProgressSummary('player-1');

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', 10);
      expect(result).toEqual({
        playerId: 'player-1',
        evaluationsCount: 3,
        latestRating: 78,
        averageRating: 75,
        ratingTrend: 'improving',
        improvementRate: expect.any(Number),
        topStrengths: expect.any(Array),
        topWeaknesses: expect.any(Array),
        developmentPriorities: expect.any(Array)
      });
      expect(result.ratingTrend).toBe('improving'); // 72 -> 75 -> 78 is improving
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting player progress summary',
        { playerId: 'player-1' }
      );
    });

    it('should detect declining trend', async () => {
      // Arrange
      const decliningEvaluations = [
        { ...mockPlayerEvaluation, overallRating: 70, evaluationDate: new Date('2025-01-15') },
        { ...mockPlayerEvaluation, id: 'eval-2', overallRating: 75, evaluationDate: new Date('2025-01-01') },
        { ...mockPlayerEvaluation, id: 'eval-3', overallRating: 78, evaluationDate: new Date('2024-12-15') }
      ];
      mockRepository.findByPlayer.mockResolvedValue(decliningEvaluations);

      // Act
      const result = await service.getPlayerProgressSummary('player-1');

      // Assert
      expect(result.ratingTrend).toBe('declining');
      expect(result.improvementRate).toBeLessThan(-5);
    });

    it('should detect stable trend', async () => {
      // Arrange
      const stableEvaluations = [
        { ...mockPlayerEvaluation, overallRating: 75, evaluationDate: new Date('2025-01-15') },
        { ...mockPlayerEvaluation, id: 'eval-2', overallRating: 76, evaluationDate: new Date('2025-01-01') },
        { ...mockPlayerEvaluation, id: 'eval-3', overallRating: 74, evaluationDate: new Date('2024-12-15') }
      ];
      mockRepository.findByPlayer.mockResolvedValue(stableEvaluations);

      // Act
      const result = await service.getPlayerProgressSummary('player-1');

      // Assert
      expect(result.ratingTrend).toBe('stable');
      expect(Math.abs(result.improvementRate)).toBeLessThanOrEqual(5);
    });

    it('should throw error when no evaluations found', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getPlayerProgressSummary('player-1'))
        .rejects.toThrow('No evaluations found for player');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should parse strengths and weaknesses', async () => {
      // Arrange
      const evaluationWithDetails = [{
        ...mockPlayerEvaluation,
        strengths: 'Great skating, excellent vision, strong work ethic',
        areasForImprovement: 'Shooting power, defensive positioning, faceoffs'
      }];
      mockRepository.findByPlayer.mockResolvedValue(evaluationWithDetails);

      // Act
      const result = await service.getPlayerProgressSummary('player-1');

      // Assert
      expect(result.topStrengths).toEqual(['Great skating', 'excellent vision', 'strong work ethic']);
      expect(result.topWeaknesses).toEqual(['Shooting power', 'defensive positioning', 'faceoffs']);
    });

    it('should handle progress summary errors and log them', async () => {
      // Arrange
      const error = new Error('Progress analysis failed');
      mockRepository.findByPlayer.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getPlayerProgressSummary('player-1'))
        .rejects.toThrow('Progress analysis failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting player progress summary',
        { error: error.message, playerId: 'player-1' }
      );
    });
  });

  describe('comparePlayerEvaluations', () => {
    const earlierEvaluation = {
      ...mockPlayerEvaluation,
      id: 'eval-1',
      evaluationDate: new Date('2024-12-01'),
      overallRating: 70
    };
    const laterEvaluation = {
      ...mockPlayerEvaluation,
      id: 'eval-2',
      evaluationDate: new Date('2025-01-01'),
      overallRating: 75
    };

    it('should compare player evaluations successfully', async () => {
      // Arrange
      mockRepository.findOne
        .mockResolvedValueOnce(earlierEvaluation)
        .mockResolvedValueOnce(laterEvaluation);

      // Act
      const result = await service.comparePlayerEvaluations('player-1', 'eval-1', 'eval-2');

      // Assert
      expect(result).toEqual({
        evaluation1: earlierEvaluation,
        evaluation2: laterEvaluation,
        skillAnalysis: expect.any(Array),
        overallImprovement: 5,
        summary: expect.stringContaining('improvement')
      });
      expect(result.overallImprovement).toBe(5);
      expect(result.summary).toContain('improvement');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Comparing player evaluations',
        { playerId: 'player-1', evaluationId1: 'eval-1', evaluationId2: 'eval-2' }
      );
    });

    it('should throw error when evaluations not found', async () => {
      // Arrange
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(laterEvaluation);

      // Act & Assert
      await expect(service.comparePlayerEvaluations('player-1', 'invalid-id', 'eval-2'))
        .rejects.toThrow('One or both evaluations not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should validate evaluations belong to the same player', async () => {
      // Arrange
      const differentPlayerEval = { ...laterEvaluation, playerId: 'different-player' };
      mockRepository.findOne
        .mockResolvedValueOnce(earlierEvaluation)
        .mockResolvedValueOnce(differentPlayerEval);

      // Act & Assert
      await expect(service.comparePlayerEvaluations('player-1', 'eval-1', 'eval-2'))
        .rejects.toThrow('Evaluations do not belong to the specified player');
    });

    it('should order evaluations chronologically', async () => {
      // Arrange - Provide later evaluation first
      mockRepository.findOne
        .mockResolvedValueOnce(laterEvaluation)
        .mockResolvedValueOnce(earlierEvaluation);

      // Act
      const result = await service.comparePlayerEvaluations('player-1', 'eval-2', 'eval-1');

      // Assert
      expect(result.evaluation1).toEqual(earlierEvaluation);
      expect(result.evaluation2).toEqual(laterEvaluation);
      expect(result.overallImprovement).toBe(5);
    });

    it('should handle comparison errors and log them', async () => {
      // Arrange
      const error = new Error('Comparison failed');
      mockRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(service.comparePlayerEvaluations('player-1', 'eval-1', 'eval-2'))
        .rejects.toThrow('Comparison failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error comparing player evaluations',
        { error: error.message, playerId: 'player-1', evaluationId1: 'eval-1', evaluationId2: 'eval-2' }
      );
    });
  });

  describe('getBenchmarkComparisons', () => {
    const mockTeamEvaluations = [
      { ...mockPlayerEvaluation, playerId: 'player-2', overallRating: 80 },
      { ...mockPlayerEvaluation, playerId: 'player-3', overallRating: 70 },
      { ...mockPlayerEvaluation, playerId: 'player-4', overallRating: 85 }
    ];

    it('should get benchmark comparisons successfully', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([mockPlayerEvaluation]);
      mockRepository.findByTeamAndPeriod.mockResolvedValue(mockTeamEvaluations);

      // Act
      const result = await service.getBenchmarkComparisons('player-1', 'team-1');

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', 1);
      expect(mockRepository.findByTeamAndPeriod).toHaveBeenCalledWith(
        'team-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(result).toEqual({
        playerRating: 75,
        teamAverage: expect.any(Number),
        position: expect.any(Number),
        percentile: expect.any(Number),
        skillComparisons: expect.any(Array)
      });
      expect(result.position).toBeGreaterThanOrEqual(1);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting benchmark comparisons',
        { playerId: 'player-1', teamId: 'team-1' }
      );
    });

    it('should throw error when player has no evaluations', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getBenchmarkComparisons('player-1', 'team-1'))
        .rejects.toThrow('No evaluations found for player');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle empty team evaluations', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([mockPlayerEvaluation]);
      mockRepository.findByTeamAndPeriod.mockResolvedValue([]);

      // Act
      const result = await service.getBenchmarkComparisons('player-1', 'team-1');

      // Assert
      expect(result.teamAverage).toBe(0);
      expect(result.position).toBe(1);
      expect(result.percentile).toBe(0);
    });

    it('should handle benchmark comparison errors and log them', async () => {
      // Arrange
      const error = new Error('Benchmark failed');
      mockRepository.findByPlayer.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getBenchmarkComparisons('player-1', 'team-1'))
        .rejects.toThrow('Benchmark failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting benchmark comparisons',
        { error: error.message, playerId: 'player-1', teamId: 'team-1' }
      );
    });
  });

  describe('cache integration', () => {
    it('should use cached results for player queries', async () => {
      // Arrange
      const cachedEvaluations = [mockPlayerEvaluation];
      mockRepository.findByPlayer.mockResolvedValue(cachedEvaluations);

      // Act
      const result = await service.getPlayerEvaluations('player-1', 5);

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', 5, undefined);
      expect(result).toEqual(cachedEvaluations);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPlayerEvaluation);
      mockRepository.save.mockResolvedValue(mockPlayerEvaluation);

      // Act
      await service.updatePlayerEvaluation('evaluation-1', { strengths: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `player:${mockPlayerEvaluation.playerId}`,
        `coach:${mockPlayerEvaluation.coachId}`,
        `team:${mockPlayerEvaluation.teamId}`
      ]);
    });
  });

  describe('analytics', () => {
    it('should retrieve evaluation analytics', async () => {
      // Arrange
      const analytics = {
        totalEvaluations: 50,
        typeDistribution: { [EvaluationType.REGULAR_SEASON]: 30, [EvaluationType.PLAYOFF]: 10 },
        averageRating: 7.5,
        potentialDistribution: { 'GOOD': 25, 'HIGH': 15 },
        ratingDistribution: { 'Elite (90-100)': 5, 'High (80-89)': 15 },
        lastUpdated: new Date()
      };
      mockRepository.getEvaluationAnalytics.mockResolvedValue(analytics);

      // Act
      const result = await service.getEvaluationAnalytics('team-1', 'coach-1');

      // Assert
      expect(mockRepository.getEvaluationAnalytics).toHaveBeenCalledWith('team-1', 'coach-1', undefined, undefined);
      expect(result).toEqual(analytics);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockPlayerEvaluation);
      const createDto: CreatePlayerEvaluationDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        evaluationDate: new Date(),
        type: EvaluationType.MID_SEASON,
        technicalSkills: mockTechnicalSkills,
        tacticalSkills: mockTacticalSkills,
        physicalAttributes: mockPhysicalAttributes,
        mentalAttributes: mockMentalAttributes,
        developmentPriorities: []
      };

      // Act
      await service.createPlayerEvaluation(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-evaluation.created', {
        evaluationId: mockPlayerEvaluation.id,
        playerId: createDto.playerId,
        coachId: createDto.coachId,
        teamId: createDto.teamId,
        type: createDto.type,
        overallRating: expect.any(Number),
        evaluationDate: createDto.evaluationDate
      });
    });

    it('should not publish events on validation failures', async () => {
      // Arrange
      const invalidDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        evaluationDate: new Date(),
        type: EvaluationType.REGULAR_SEASON,
        technicalSkills: {
          ...mockTechnicalSkills,
          skating: { ...mockTechnicalSkills.skating, speed: 15 } // Invalid
        },
        tacticalSkills: mockTacticalSkills,
        physicalAttributes: mockPhysicalAttributes,
        mentalAttributes: mockMentalAttributes,
        developmentPriorities: []
      };

      // Act & Assert
      await expect(service.createPlayerEvaluation(invalidDto)).rejects.toThrow();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});