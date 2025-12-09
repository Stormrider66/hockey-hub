import { VideoAnalysisService, CreateVideoAnalysisDto } from '../../../services/VideoAnalysisService';
import { VideoAnalysis, VideoAnalysisType, VideoClip, AnalysisPoint, PlayerPerformance, TeamAnalysis } from '../../../entities/VideoAnalysis';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('VideoAnalysisService', () => {
  let service: VideoAnalysisService;
  let mockRepository: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockVideoClips: VideoClip[] = [
    {
      id: 'clip-1',
      startTime: 120,
      endTime: 135,
      title: 'Great Passing Play',
      description: 'Excellent cross-ice pass to create scoring opportunity',
      category: 'positive',
      playersInvolved: ['player-1', 'player-2'],
      importance: 8,
      tags: ['passing', 'teamwork']
    },
    {
      id: 'clip-2',
      startTime: 300,
      endTime: 310,
      title: 'Defensive Breakdown',
      description: 'Missed assignment leading to goal against',
      category: 'negative',
      playersInvolved: ['player-3'],
      importance: 9,
      tags: ['defense', 'positioning']
    }
  ];

  const mockAnalysisPoints: AnalysisPoint[] = [
    {
      id: 'point-1',
      timestamp: 125,
      description: 'Player showed excellent vision and passing accuracy',
      category: 'technique',
      sentiment: 'positive',
      playersInvolved: ['player-1'],
      importance: 7
    },
    {
      id: 'point-2',
      timestamp: 305,
      description: 'Need to improve defensive positioning in slot area',
      category: 'positioning',
      sentiment: 'negative',
      playersInvolved: ['player-3'],
      importance: 8
    }
  ];

  const mockPlayerPerformances: PlayerPerformance[] = [
    {
      playerId: 'player-1',
      playerName: 'John Doe',
      rating: 8,
      positives: ['Excellent passing', 'Good positioning'],
      negatives: ['Could improve shot selection'],
      keyMoments: [120, 180, 240]
    },
    {
      playerId: 'player-2',
      playerName: 'Jane Smith',
      rating: 7,
      positives: ['Strong skating', 'Good defensive play'],
      negatives: ['Missed some scoring opportunities'],
      keyMoments: [135, 200]
    }
  ];

  const mockTeamAnalysis: TeamAnalysis = {
    overallRating: 7.5,
    strengths: ['Good puck movement', 'Strong forechecking'],
    weaknesses: ['Defensive zone coverage', 'Power play execution'],
    tacticalNotes: 'Team played well in transition but struggled in defensive zone',
    recommendedChanges: ['Adjust defensive pairings', 'Work on penalty kill']
  };

  const mockVideoAnalysis: Partial<VideoAnalysis> = {
    id: 'analysis-1',
    gameId: 'game-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    videoUrl: 'https://example.com/game-video.mp4',
    analysisType: VideoAnalysisType.GAME_REVIEW,
    title: 'Game 1 Analysis',
    description: 'Post-game video analysis focusing on power play and defensive play',
    clips: mockVideoClips,
    analysisPoints: mockAnalysisPoints,
    playerPerformances: mockPlayerPerformances,
    teamAnalysis: mockTeamAnalysis,
    tags: ['power-play', 'defense'],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      findByGame: jest.fn(),
      findByTeamAndType: jest.fn(),
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

    service = new VideoAnalysisService();
    
    // Replace repository instance
    (service as any).repository = mockRepository;
  });

  describe('createVideoAnalysis', () => {
    const createDto: CreateVideoAnalysisDto = {
      gameId: 'game-1',
      coachId: 'coach-1',
      teamId: 'team-1',
      videoUrl: 'https://example.com/game-video.mp4',
      analysisType: VideoAnalysisType.GAME_REVIEW,
      title: 'Test Game Analysis',
      description: 'Test description for game analysis',
      clips: mockVideoClips,
      analysisPoints: mockAnalysisPoints,
      playerPerformances: mockPlayerPerformances,
      teamAnalysis: mockTeamAnalysis,
      tags: ['test', 'analysis']
    };

    it('should create a video analysis successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockVideoAnalysis);

      // Act
      const result = await service.createVideoAnalysis(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        status: 'draft'
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('video-analysis.created', {
        analysisId: mockVideoAnalysis.id,
        gameId: createDto.gameId,
        coachId: createDto.coachId,
        analysisType: createDto.analysisType
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating video analysis',
        { gameId: createDto.gameId, analysisType: createDto.analysisType }
      );
      expect(result).toEqual(mockVideoAnalysis);
    });

    it('should set default status to draft', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue({
        ...mockVideoAnalysis,
        status: 'draft'
      });

      // Act
      await service.createVideoAnalysis(createDto);

      // Assert
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.status).toBe('draft');
    });

    it('should validate video clips structure', async () => {
      // Arrange
      const createDtoWithClips = {
        ...createDto,
        clips: [
          {
            id: 'clip-1',
            startTime: 120,
            endTime: 135,
            title: 'Test Clip',
            description: 'Test clip description',
            category: 'positive' as const,
            playersInvolved: ['player-1'],
            importance: 8,
            tags: ['test']
          }
        ]
      };
      mockRepository.save.mockResolvedValue(mockVideoAnalysis);

      // Act
      const result = await service.createVideoAnalysis(createDtoWithClips);

      // Assert
      expect(result).toEqual(mockVideoAnalysis);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          clips: createDtoWithClips.clips
        })
      );
    });

    it('should validate analysis points structure', async () => {
      // Arrange
      const createDtoWithPoints = {
        ...createDto,
        analysisPoints: [
          {
            id: 'point-1',
            timestamp: 125,
            description: 'Good positioning',
            category: 'positioning' as const,
            sentiment: 'positive' as const,
            playersInvolved: ['player-1'],
            importance: 7
          }
        ]
      };
      mockRepository.save.mockResolvedValue(mockVideoAnalysis);

      // Act
      const result = await service.createVideoAnalysis(createDtoWithPoints);

      // Assert
      expect(result).toEqual(mockVideoAnalysis);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisPoints: createDtoWithPoints.analysisPoints
        })
      );
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createVideoAnalysis(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating video analysis',
        { error: error.message, data: createDto }
      );
    });

    it('should handle different analysis types', async () => {
      // Arrange
      const skillAnalysisDto = {
        ...createDto,
        analysisType: VideoAnalysisType.SKILL_BREAKDOWN
      };
      mockRepository.save.mockResolvedValue({
        ...mockVideoAnalysis,
        analysisType: VideoAnalysisType.SKILL_BREAKDOWN
      });

      // Act
      const result = await service.createVideoAnalysis(skillAnalysisDto);

      // Assert
      expect(result.analysisType).toBe(VideoAnalysisType.SKILL_BREAKDOWN);
      expect(mockEventBus.publish).toHaveBeenCalledWith('video-analysis.created', {
        analysisId: mockVideoAnalysis.id,
        gameId: skillAnalysisDto.gameId,
        coachId: skillAnalysisDto.coachId,
        analysisType: VideoAnalysisType.SKILL_BREAKDOWN
      });
    });
  });

  describe('getAnalysesByGame', () => {
    it('should retrieve analyses for a game', async () => {
      // Arrange
      const gameAnalyses = [mockVideoAnalysis];
      mockRepository.findByGame.mockResolvedValue(gameAnalyses);

      // Act
      const result = await service.getAnalysesByGame('game-1');

      // Assert
      expect(mockRepository.findByGame).toHaveBeenCalledWith('game-1');
      expect(result).toEqual(gameAnalyses);
    });

    it('should return empty array when no analyses found', async () => {
      // Arrange
      mockRepository.findByGame.mockResolvedValue([]);

      // Act
      const result = await service.getAnalysesByGame('game-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAnalysesByTeamAndType', () => {
    it('should retrieve analyses by team and type', async () => {
      // Arrange
      const teamAnalyses = [mockVideoAnalysis];
      mockRepository.findByTeamAndType.mockResolvedValue(teamAnalyses);

      // Act
      const result = await service.getAnalysesByTeamAndType('team-1', VideoAnalysisType.GAME_REVIEW);

      // Assert
      expect(mockRepository.findByTeamAndType).toHaveBeenCalledWith('team-1', VideoAnalysisType.GAME_REVIEW, undefined);
      expect(result).toEqual(teamAnalyses);
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const teamAnalyses = [mockVideoAnalysis];
      mockRepository.findByTeamAndType.mockResolvedValue(teamAnalyses);

      // Act
      const result = await service.getAnalysesByTeamAndType('team-1', VideoAnalysisType.SKILL_BREAKDOWN, 5);

      // Assert
      expect(mockRepository.findByTeamAndType).toHaveBeenCalledWith('team-1', VideoAnalysisType.SKILL_BREAKDOWN, 5);
      expect(result).toEqual(teamAnalyses);
    });

    it('should return empty array when no analyses found', async () => {
      // Arrange
      mockRepository.findByTeamAndType.mockResolvedValue([]);

      // Act
      const result = await service.getAnalysesByTeamAndType('team-1', VideoAnalysisType.OPPONENT_SCOUT);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('addClip', () => {
    const newClip: VideoClip = {
      id: 'clip-3',
      startTime: 400,
      endTime: 415,
      title: 'New Clip',
      description: 'New clip description',
      category: 'neutral',
      playersInvolved: ['player-4'],
      importance: 6,
      tags: ['new']
    };

    it('should add a clip to existing analysis', async () => {
      // Arrange
      const analysisWithClips = {
        ...mockVideoAnalysis,
        clips: [...mockVideoClips]
      };
      mockRepository.findOne.mockResolvedValue(analysisWithClips);
      mockRepository.save.mockImplementation((analysis) => {
        return Promise.resolve({
          ...analysis,
          clips: [...analysis.clips, newClip]
        });
      });

      // Act
      const result = await service.addClip('analysis-1', newClip);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'analysis-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      
      const savedAnalysis = mockRepository.save.mock.calls[0][0];
      expect(savedAnalysis.clips).toContain(newClip);
      expect(savedAnalysis.clips).toHaveLength(3);
    });

    it('should throw error when analysis not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addClip('invalid-id', newClip))
        .rejects.toThrow('Video analysis not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should preserve existing clips when adding new one', async () => {
      // Arrange
      const analysisWithClips = {
        ...mockVideoAnalysis,
        clips: [...mockVideoClips]
      };
      mockRepository.findOne.mockResolvedValue(analysisWithClips);
      mockRepository.save.mockImplementation((analysis) => Promise.resolve(analysis));

      // Act
      await service.addClip('analysis-1', newClip);

      // Assert
      const savedAnalysis = mockRepository.save.mock.calls[0][0];
      expect(savedAnalysis.clips).toContain(mockVideoClips[0]);
      expect(savedAnalysis.clips).toContain(mockVideoClips[1]);
      expect(savedAnalysis.clips).toContain(newClip);
    });
  });

  describe('addAnalysisPoint', () => {
    const newPoint: AnalysisPoint = {
      id: 'point-3',
      timestamp: 500,
      description: 'New analysis point',
      category: 'technique',
      sentiment: 'neutral',
      playersInvolved: ['player-4'],
      importance: 5
    };

    it('should add an analysis point to existing analysis', async () => {
      // Arrange
      const analysisWithPoints = {
        ...mockVideoAnalysis,
        analysisPoints: [...mockAnalysisPoints]
      };
      mockRepository.findOne.mockResolvedValue(analysisWithPoints);
      mockRepository.save.mockImplementation((analysis) => {
        return Promise.resolve({
          ...analysis,
          analysisPoints: [...analysis.analysisPoints, newPoint]
        });
      });

      // Act
      const result = await service.addAnalysisPoint('analysis-1', newPoint);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'analysis-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      
      const savedAnalysis = mockRepository.save.mock.calls[0][0];
      expect(savedAnalysis.analysisPoints).toContain(newPoint);
      expect(savedAnalysis.analysisPoints).toHaveLength(3);
    });

    it('should throw error when analysis not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addAnalysisPoint('invalid-id', newPoint))
        .rejects.toThrow('Video analysis not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should preserve existing analysis points when adding new one', async () => {
      // Arrange
      const analysisWithPoints = {
        ...mockVideoAnalysis,
        analysisPoints: [...mockAnalysisPoints]
      };
      mockRepository.findOne.mockResolvedValue(analysisWithPoints);
      mockRepository.save.mockImplementation((analysis) => Promise.resolve(analysis));

      // Act
      await service.addAnalysisPoint('analysis-1', newPoint);

      // Assert
      const savedAnalysis = mockRepository.save.mock.calls[0][0];
      expect(savedAnalysis.analysisPoints).toContain(mockAnalysisPoints[0]);
      expect(savedAnalysis.analysisPoints).toContain(mockAnalysisPoints[1]);
      expect(savedAnalysis.analysisPoints).toContain(newPoint);
    });
  });

  describe('getPlayerHighlights', () => {
    const mockAnalyses = [
      {
        ...mockVideoAnalysis,
        clips: [
          { ...mockVideoClips[0], playersInvolved: ['player-1'], importance: 9 },
          { ...mockVideoClips[1], playersInvolved: ['player-1'], importance: 7, category: 'positive' }
        ]
      },
      {
        ...mockVideoAnalysis,
        id: 'analysis-2',
        clips: [
          { ...mockVideoClips[0], id: 'clip-3', playersInvolved: ['player-1'], importance: 8, category: 'neutral' },
          { ...mockVideoClips[1], id: 'clip-4', playersInvolved: ['player-2'], importance: 6 }
        ]
      }
    ];

    it('should get player highlights sorted by importance', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue(mockAnalyses);

      // Act
      const result = await service.getPlayerHighlights('player-1', 'team-1');

      // Assert
      expect(mockRepository.findMany).toHaveBeenCalledWith({ where: { teamId: 'team-1' } });
      expect(result).toHaveLength(3); // 3 clips involving player-1
      expect(result[0].importance).toBe(9); // Highest importance first
      expect(result[1].importance).toBe(8);
      expect(result[2].importance).toBe(7);
      expect(result.every(clip => clip.playersInvolved.includes('player-1'))).toBe(true);
    });

    it('should filter clips by category when specified', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue(mockAnalyses);

      // Act
      const result = await service.getPlayerHighlights('player-1', 'team-1', ['positive']);

      // Assert
      const positiveClips = result.filter(clip => clip.category === 'positive');
      expect(positiveClips).toHaveLength(1);
      expect(result.every(clip => clip.category === 'positive')).toBe(true);
    });

    it('should limit results to 20 clips', async () => {
      // Arrange
      const manyClips = Array.from({ length: 25 }, (_, i) => ({
        ...mockVideoClips[0],
        id: `clip-${i}`,
        playersInvolved: ['player-1'],
        importance: 25 - i
      }));
      const analysisWithManyClips = [{
        ...mockVideoAnalysis,
        clips: manyClips
      }];
      mockRepository.findMany.mockResolvedValue(analysisWithManyClips);

      // Act
      const result = await service.getPlayerHighlights('player-1', 'team-1');

      // Assert
      expect(result).toHaveLength(20);
    });

    it('should return empty array when no clips found for player', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue(mockAnalyses);

      // Act
      const result = await service.getPlayerHighlights('player-999', 'team-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('generatePlayerReport', () => {
    const mockAnalysesForReport = [
      {
        ...mockVideoAnalysis,
        gameId: 'game-1',
        clips: [
          { ...mockVideoClips[0], playersInvolved: ['player-1'], category: 'positive' },
          { ...mockVideoClips[1], playersInvolved: ['player-1'], category: 'negative' }
        ],
        analysisPoints: [
          { ...mockAnalysisPoints[0], playersInvolved: ['player-1'], sentiment: 'positive' },
          { ...mockAnalysisPoints[1], playersInvolved: ['player-1'], sentiment: 'negative' }
        ]
      },
      {
        ...mockVideoAnalysis,
        id: 'analysis-2',
        gameId: 'game-2',
        clips: [
          { ...mockVideoClips[0], id: 'clip-3', playersInvolved: ['player-1'], category: 'positive' }
        ],
        analysisPoints: [
          { ...mockAnalysisPoints[0], id: 'point-3', playersInvolved: ['player-1'], sentiment: 'positive' }
        ]
      }
    ];

    it('should generate comprehensive player report', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue(mockAnalysesForReport);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1');

      // Assert
      expect(mockRepository.findMany).toHaveBeenCalledWith({ where: { teamId: 'team-1' } });
      expect(result).toEqual({
        totalAnalyses: 2,
        positiveClips: 2,
        negativeClips: 1,
        keyStrengths: expect.any(Array),
        areasForImprovement: expect.any(Array),
        highlights: expect.any(Array)
      });
      expect(result.keyStrengths).toHaveLength(2);
      expect(result.areasForImprovement).toHaveLength(1);
      expect(result.highlights).toHaveLength(3);
    });

    it('should filter by game IDs when provided', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue(mockAnalysesForReport);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1', ['game-1']);

      // Assert
      expect(result.totalAnalyses).toBe(2); // Both analyses fetched
      // But only game-1 data should be considered in the report calculations
      const game1Analysis = mockAnalysesForReport.find(a => a.gameId === 'game-1');
      const playerClipsFromGame1 = game1Analysis!.clips.filter(c => c.playersInvolved.includes('player-1'));
      expect(result.positiveClips + result.negativeClips).toBe(playerClipsFromGame1.length);
    });

    it('should sort highlights by importance', async () => {
      // Arrange
      const analysesWithImportance = [
        {
          ...mockVideoAnalysis,
          clips: [
            { ...mockVideoClips[0], playersInvolved: ['player-1'], importance: 5 },
            { ...mockVideoClips[1], playersInvolved: ['player-1'], importance: 9 },
            { ...mockVideoClips[0], id: 'clip-3', playersInvolved: ['player-1'], importance: 7 }
          ]
        }
      ];
      mockRepository.findMany.mockResolvedValue(analysesWithImportance);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1');

      // Assert
      expect(result.highlights[0].importance).toBe(9);
      expect(result.highlights[1].importance).toBe(7);
      expect(result.highlights[2].importance).toBe(5);
    });

    it('should limit key strengths and areas for improvement to 5 each', async () => {
      // Arrange
      const manyAnalysisPoints = Array.from({ length: 8 }, (_, i) => ({
        ...mockAnalysisPoints[0],
        id: `point-${i}`,
        description: `Strength ${i + 1}`,
        sentiment: 'positive' as const,
        playersInvolved: ['player-1']
      })).concat(Array.from({ length: 7 }, (_, i) => ({
        ...mockAnalysisPoints[1],
        id: `point-neg-${i}`,
        description: `Weakness ${i + 1}`,
        sentiment: 'negative' as const,
        playersInvolved: ['player-1']
      })));

      const analysesWithManyPoints = [
        {
          ...mockVideoAnalysis,
          clips: [],
          analysisPoints: manyAnalysisPoints
        }
      ];
      mockRepository.findMany.mockResolvedValue(analysesWithManyPoints);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1');

      // Assert
      expect(result.keyStrengths).toHaveLength(5);
      expect(result.areasForImprovement).toHaveLength(5);
    });

    it('should limit highlights to 10 clips', async () => {
      // Arrange
      const manyClips = Array.from({ length: 15 }, (_, i) => ({
        ...mockVideoClips[0],
        id: `clip-${i}`,
        playersInvolved: ['player-1'],
        importance: 15 - i
      }));
      const analysesWithManyClips = [
        {
          ...mockVideoAnalysis,
          clips: manyClips,
          analysisPoints: []
        }
      ];
      mockRepository.findMany.mockResolvedValue(analysesWithManyClips);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1');

      // Assert
      expect(result.highlights).toHaveLength(10);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue([]);

      // Act
      const result = await service.generatePlayerReport('player-1', 'team-1');

      // Assert
      expect(result).toEqual({
        totalAnalyses: 0,
        positiveClips: 0,
        negativeClips: 0,
        keyStrengths: [],
        areasForImprovement: [],
        highlights: []
      });
    });
  });

  describe('cache integration', () => {
    it('should use cached results for game queries', async () => {
      // Arrange
      const cachedAnalyses = [mockVideoAnalysis];
      mockRepository.findByGame.mockResolvedValue(cachedAnalyses);

      // Act
      const result = await service.getAnalysesByGame('game-1');

      // Assert
      expect(mockRepository.findByGame).toHaveBeenCalledWith('game-1');
      expect(result).toEqual(cachedAnalyses);
    });

    it('should use cached results for team and type queries', async () => {
      // Arrange
      const cachedAnalyses = [mockVideoAnalysis];
      mockRepository.findByTeamAndType.mockResolvedValue(cachedAnalyses);

      // Act
      const result = await service.getAnalysesByTeamAndType('team-1', VideoAnalysisType.SKILL_BREAKDOWN);

      // Assert
      expect(mockRepository.findByTeamAndType).toHaveBeenCalledWith('team-1', VideoAnalysisType.SKILL_BREAKDOWN, undefined);
      expect(result).toEqual(cachedAnalyses);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockVideoAnalysis);
      const createDto: CreateVideoAnalysisDto = {
        gameId: 'game-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        videoUrl: 'https://example.com/video.mp4',
        analysisType: VideoAnalysisType.OPPONENT_SCOUT,
        title: 'Event Test Analysis',
        clips: [],
        analysisPoints: [],
        playerPerformances: []
      };

      // Act
      await service.createVideoAnalysis(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('video-analysis.created', {
        analysisId: mockVideoAnalysis.id,
        gameId: createDto.gameId,
        coachId: createDto.coachId,
        analysisType: createDto.analysisType
      });
    });

    it('should not publish events on creation failures', async () => {
      // Arrange
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createVideoAnalysis({} as any)).rejects.toThrow();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockRepository.findByGame.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAnalysesByGame('game-1')).rejects.toThrow('Database connection failed');
    });

    it('should handle repository errors in findMany', async () => {
      // Arrange
      const error = new Error('Query timeout');
      mockRepository.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getPlayerHighlights('player-1', 'team-1')).rejects.toThrow('Query timeout');
      await expect(service.generatePlayerReport('player-1', 'team-1')).rejects.toThrow('Query timeout');
    });
  });
});