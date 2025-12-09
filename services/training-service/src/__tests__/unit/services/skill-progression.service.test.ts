import { SkillProgressionService, CreateSkillTrackingDto, RecordMeasurementDto } from '../../../services/SkillProgressionService';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { SkillProgressionTracking, SkillMeasurement, Benchmarks, DrillHistory } from '../../../entities/SkillProgressionTracking';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');

describe('SkillProgressionService', () => {
  let service: SkillProgressionService;
  let mockRepository: jest.Mocked<CachedRepository<SkillProgressionTracking>>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockSkillMeasurement: SkillMeasurement = {
    id: 'measurement-1',
    value: 85,
    unit: 'mph',
    testDate: new Date('2025-01-15'),
    testType: 'wrist_shot',
    conditions: 'practice',
    notes: 'Good form'
  };

  const mockBenchmarks: Benchmarks = {
    beginner: 60,
    intermediate: 75,
    advanced: 90,
    elite: 100
  };

  const mockDrillHistory: DrillHistory = {
    id: 'drill-1',
    drillName: 'Wrist Shot Accuracy',
    date: new Date('2025-01-10'),
    result: 8,
    notes: '8 out of 10 targets hit'
  };

  const mockSkillTracking: SkillProgressionTracking = {
    id: 'tracking-1',
    playerId: 'player-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    skillName: 'Wrist Shot Power',
    skillCategory: 'Shooting',
    measurements: [mockSkillMeasurement],
    benchmarks: mockBenchmarks,
    targetImprovement: 10,
    notes: 'Focus on follow-through',
    drillHistory: [mockDrillHistory],
    lastUpdated: new Date('2025-01-15'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15')
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    // Mock EventBus
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    } as any;
    (EventBus.getInstance as jest.Mock).mockReturnValue(mockEventBus);

    // Mock CachedRepository
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      findByPlayer: jest.fn(),
      findBySkill: jest.fn(),
      delete: jest.fn(),
      cacheQueryResult: jest.fn(),
      invalidateCache: jest.fn(),
      clearCache: jest.fn()
    } as any;

    // Mock the CachedRepository constructor to return our mock
    (CachedRepository as jest.MockedClass<typeof CachedRepository>).mockImplementation(() => mockRepository);

    service = new SkillProgressionService();
  });

  describe('createSkillTracking', () => {
    it('should create skill tracking successfully', async () => {
      const createDto: CreateSkillTrackingDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        skillName: 'Wrist Shot Power',
        skillCategory: 'Shooting',
        measurements: [mockSkillMeasurement],
        benchmarks: mockBenchmarks,
        targetImprovement: 10,
        notes: 'Focus on follow-through'
      };

      mockRepository.save.mockResolvedValue(mockSkillTracking);

      const result = await service.createSkillTracking(createDto);

      expect(result).toBe(mockSkillTracking);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        drillHistory: [],
        lastUpdated: expect.any(Date)
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('skill-tracking.created', {
        trackingId: 'tracking-1',
        playerId: 'player-1',
        skillName: 'Wrist Shot Power'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Creating skill tracking', {
        playerId: 'player-1',
        skillName: 'Wrist Shot Power'
      });
    });

    it('should handle create skill tracking errors', async () => {
      const createDto: CreateSkillTrackingDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        skillName: 'Wrist Shot Power',
        skillCategory: 'Shooting',
        measurements: []
      };

      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      await expect(service.createSkillTracking(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating skill tracking', {
        error: 'Database error',
        data: createDto
      });
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should create skill tracking with minimal data', async () => {
      const createDto: CreateSkillTrackingDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        skillName: 'Skating Speed',
        skillCategory: 'Skating',
        measurements: []
      };

      const minimalTracking = {
        ...mockSkillTracking,
        skillName: 'Skating Speed',
        skillCategory: 'Skating',
        measurements: [],
        benchmarks: undefined,
        targetImprovement: undefined,
        notes: undefined
      };

      mockRepository.save.mockResolvedValue(minimalTracking);

      const result = await service.createSkillTracking(createDto);

      expect(result).toBe(minimalTracking);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        drillHistory: [],
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('recordMeasurement', () => {
    it('should record measurement successfully', async () => {
      const measurementDto: RecordMeasurementDto = {
        value: 90,
        unit: 'mph',
        testDate: new Date('2025-01-20'),
        testType: 'wrist_shot',
        conditions: 'game_simulation',
        notes: 'Improved technique'
      };

      const updatedTracking = {
        ...mockSkillTracking,
        measurements: [...mockSkillTracking.measurements, { ...measurementDto, id: expect.any(String) }]
      };

      mockRepository.findOne.mockResolvedValue(mockSkillTracking);
      mockRepository.save.mockResolvedValue(updatedTracking);

      const result = await service.recordMeasurement('tracking-1', measurementDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'tracking-1' } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockSkillTracking,
        measurements: expect.arrayContaining([
          mockSkillMeasurement,
          expect.objectContaining({
            ...measurementDto,
            id: expect.any(String)
          })
        ]),
        lastUpdated: expect.any(Date)
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('skill-measurement.recorded', {
        trackingId: 'tracking-1',
        playerId: 'player-1',
        skillName: 'Wrist Shot Power',
        value: 90,
        improvement: expect.any(Number)
      });
    });

    it('should throw error when skill tracking not found', async () => {
      const measurementDto: RecordMeasurementDto = {
        value: 90,
        unit: 'mph',
        testDate: new Date('2025-01-20'),
        testType: 'wrist_shot'
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.recordMeasurement('nonexistent-id', measurementDto)).rejects.toThrow('Skill tracking not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should record measurement with minimal data', async () => {
      const measurementDto: RecordMeasurementDto = {
        value: 88,
        unit: 'mph',
        testDate: new Date('2025-01-18'),
        testType: 'slap_shot'
      };

      mockRepository.findOne.mockResolvedValue(mockSkillTracking);
      mockRepository.save.mockResolvedValue(mockSkillTracking);

      await service.recordMeasurement('tracking-1', measurementDto);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockSkillTracking,
        measurements: expect.arrayContaining([
          expect.objectContaining({
            value: 88,
            unit: 'mph',
            testDate: measurementDto.testDate,
            testType: 'slap_shot',
            id: expect.any(String)
          })
        ]),
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('getPlayerSkillProgress', () => {
    it('should return player skill progress', async () => {
      mockRepository.findByPlayer.mockResolvedValue([mockSkillTracking]);

      const result = await service.getPlayerSkillProgress('player-1');

      expect(result).toEqual([mockSkillTracking]);
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
    });

    it('should return empty array for player with no skill tracking', async () => {
      mockRepository.findByPlayer.mockResolvedValue([]);

      const result = await service.getPlayerSkillProgress('player-without-skills');

      expect(result).toEqual([]);
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-without-skills');
    });
  });

  describe('getTeamSkillComparison', () => {
    it('should return team skill comparison with multiple players', async () => {
      const measurement1: SkillMeasurement = {
        id: 'm1',
        value: 85,
        unit: 'mph',
        testDate: new Date('2025-01-15'),
        testType: 'wrist_shot'
      };

      const measurement2: SkillMeasurement = {
        id: 'm2',
        value: 90,
        unit: 'mph',
        testDate: new Date('2025-01-20'),
        testType: 'wrist_shot'
      };

      const tracking1 = {
        ...mockSkillTracking,
        id: 'tracking-1',
        playerId: 'player-1',
        measurements: [measurement2, measurement1] // Latest first
      };

      const tracking2 = {
        ...mockSkillTracking,
        id: 'tracking-2',
        playerId: 'player-2',
        measurements: [{ ...measurement1, value: 80 }]
      };

      mockRepository.findBySkill.mockResolvedValue([tracking1, tracking2]);

      const result = await service.getTeamSkillComparison('team-1', 'Wrist Shot Power');

      expect(result).toEqual({
        skill: 'Wrist Shot Power',
        playerComparisons: [
          {
            playerId: 'player-1',
            latestValue: 90,
            improvement: expect.any(Number),
            trend: expect.any(String),
            ranking: 1
          },
          {
            playerId: 'player-2',
            latestValue: 80,
            improvement: 0,
            trend: expect.any(String),
            ranking: 2
          }
        ],
        teamAverage: 85,
        topPerformers: ['player-1', 'player-2']
      });
      expect(mockRepository.findBySkill).toHaveBeenCalledWith('Wrist Shot Power', 'team-1');
    });

    it('should handle empty team skill data', async () => {
      mockRepository.findBySkill.mockResolvedValue([]);

      const result = await service.getTeamSkillComparison('team-1', 'Nonexistent Skill');

      expect(result).toEqual({
        skill: 'Nonexistent Skill',
        playerComparisons: [],
        teamAverage: 0,
        topPerformers: []
      });
    });

    it('should return top 3 performers only', async () => {
      const trackings = Array.from({ length: 5 }, (_, i) => ({
        ...mockSkillTracking,
        id: `tracking-${i + 1}`,
        playerId: `player-${i + 1}`,
        measurements: [{
          id: `m${i + 1}`,
          value: 95 - i * 5, // 95, 90, 85, 80, 75
          unit: 'mph',
          testDate: new Date('2025-01-15'),
          testType: 'wrist_shot'
        }]
      }));

      mockRepository.findBySkill.mockResolvedValue(trackings);

      const result = await service.getTeamSkillComparison('team-1', 'Wrist Shot Power');

      expect(result.topPerformers).toEqual(['player-1', 'player-2', 'player-3']);
      expect(result.topPerformers).toHaveLength(3);
    });
  });

  describe('addDrillResult', () => {
    it('should add drill result successfully', async () => {
      const drillResult = {
        drillName: 'Accuracy Drill',
        date: new Date('2025-01-20'),
        result: 9,
        notes: '9 out of 10 targets hit'
      };

      const updatedTracking = {
        ...mockSkillTracking,
        drillHistory: [...mockSkillTracking.drillHistory, { ...drillResult, id: expect.any(String) }]
      };

      mockRepository.findOne.mockResolvedValue(mockSkillTracking);
      mockRepository.save.mockResolvedValue(updatedTracking);

      const result = await service.addDrillResult('tracking-1', drillResult);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'tracking-1' } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockSkillTracking,
        drillHistory: expect.arrayContaining([
          mockDrillHistory,
          expect.objectContaining({
            ...drillResult,
            id: expect.any(String)
          })
        ]),
        lastUpdated: expect.any(Date)
      });
      expect(result).toBe(updatedTracking);
    });

    it('should throw error when skill tracking not found for drill result', async () => {
      const drillResult = {
        drillName: 'Accuracy Drill',
        date: new Date('2025-01-20'),
        result: 9
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.addDrillResult('nonexistent-id', drillResult)).rejects.toThrow('Skill tracking not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should add drill result with minimal data', async () => {
      const drillResult = {
        drillName: 'Speed Drill',
        date: new Date('2025-01-22'),
        result: 15.2
      };

      mockRepository.findOne.mockResolvedValue(mockSkillTracking);
      mockRepository.save.mockResolvedValue(mockSkillTracking);

      await service.addDrillResult('tracking-1', drillResult);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockSkillTracking,
        drillHistory: expect.arrayContaining([
          expect.objectContaining({
            drillName: 'Speed Drill',
            date: drillResult.date,
            result: 15.2,
            id: expect.any(String)
          })
        ]),
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('getSkillProgressReport', () => {
    it('should generate comprehensive skill progress report', async () => {
      const measurement1: SkillMeasurement = {
        id: 'm1',
        value: 80,
        unit: 'mph',
        testDate: new Date('2025-01-01'),
        testType: 'wrist_shot'
      };

      const measurement2: SkillMeasurement = {
        id: 'm2',
        value: 85,
        unit: 'mph',
        testDate: new Date('2025-01-10'),
        testType: 'wrist_shot'
      };

      const measurement3: SkillMeasurement = {
        id: 'm3',
        value: 90,
        unit: 'mph',
        testDate: new Date('2025-01-20'),
        testType: 'wrist_shot'
      };

      const improvingSkill = {
        ...mockSkillTracking,
        skillName: 'Wrist Shot Power',
        measurements: [measurement3, measurement2, measurement1] // Latest first
      };

      const decliningSkill = {
        ...mockSkillTracking,
        id: 'tracking-2',
        skillName: 'Skating Speed',
        measurements: [
          { id: 'm4', value: 75, unit: 'mph', testDate: new Date('2025-01-20'), testType: 'speed' },
          { id: 'm5', value: 80, unit: 'mph', testDate: new Date('2025-01-10'), testType: 'speed' },
          { id: 'm6', value: 85, unit: 'mph', testDate: new Date('2025-01-01'), testType: 'speed' }
        ]
      };

      mockRepository.findByPlayer.mockResolvedValue([improvingSkill, decliningSkill]);

      const result = await service.getSkillProgressReport('player-1');

      expect(result).toEqual({
        totalSkills: 2,
        improvingSkills: expect.any(Number),
        decliningSkills: expect.any(Number),
        stableSkills: expect.any(Number),
        skillDetails: [
          {
            skillName: 'Wrist Shot Power',
            currentValue: 90,
            improvement: expect.any(Number),
            trend: expect.any(String),
            measurementCount: 3,
            lastTested: measurement3.testDate
          },
          {
            skillName: 'Skating Speed',
            currentValue: 75,
            improvement: expect.any(Number),
            trend: expect.any(String),
            measurementCount: 3,
            lastTested: expect.any(Date)
          }
        ]
      });
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
    });

    it('should filter skills by provided skill names', async () => {
      const tracking1 = { ...mockSkillTracking, skillName: 'Wrist Shot Power' };
      const tracking2 = { ...mockSkillTracking, id: 'tracking-2', skillName: 'Skating Speed' };
      const tracking3 = { ...mockSkillTracking, id: 'tracking-3', skillName: 'Passing Accuracy' };

      mockRepository.findByPlayer.mockResolvedValue([tracking1, tracking2, tracking3]);

      const result = await service.getSkillProgressReport('player-1', ['Wrist Shot Power', 'Passing Accuracy']);

      expect(result.totalSkills).toBe(2);
      expect(result.skillDetails).toHaveLength(2);
      expect(result.skillDetails.map(s => s.skillName)).toEqual(['Wrist Shot Power', 'Passing Accuracy']);
    });

    it('should handle player with no skills', async () => {
      mockRepository.findByPlayer.mockResolvedValue([]);

      const result = await service.getSkillProgressReport('player-without-skills');

      expect(result).toEqual({
        totalSkills: 0,
        improvingSkills: 0,
        decliningSkills: 0,
        stableSkills: 0,
        skillDetails: []
      });
    });

    it('should handle skills with no measurements', async () => {
      const skillWithNoMeasurements = {
        ...mockSkillTracking,
        measurements: []
      };

      mockRepository.findByPlayer.mockResolvedValue([skillWithNoMeasurements]);

      const result = await service.getSkillProgressReport('player-1');

      expect(result.skillDetails[0]).toEqual({
        skillName: 'Wrist Shot Power',
        currentValue: 0,
        improvement: 0,
        trend: expect.any(String),
        measurementCount: 0,
        lastTested: expect.any(Date)
      });
    });
  });

  describe('calculateImprovement', () => {
    it('should calculate improvement correctly', async () => {
      const measurements: SkillMeasurement[] = [
        {
          id: 'm1',
          value: 80,
          unit: 'mph',
          testDate: new Date('2025-01-01'),
          testType: 'wrist_shot'
        },
        {
          id: 'm2',
          value: 88,
          unit: 'mph',
          testDate: new Date('2025-01-15'),
          testType: 'wrist_shot'
        }
      ];

      const trackingWithMeasurements = {
        ...mockSkillTracking,
        measurements
      };

      mockRepository.findOne.mockResolvedValue(trackingWithMeasurements);
      mockRepository.save.mockResolvedValue(trackingWithMeasurements);

      // Record a new measurement to trigger improvement calculation
      await service.recordMeasurement('tracking-1', {
        value: 90,
        unit: 'mph',
        testDate: new Date('2025-01-20'),
        testType: 'wrist_shot'
      });

      // Verify the improvement calculation is included in the event
      expect(mockEventBus.publish).toHaveBeenCalledWith('skill-measurement.recorded', {
        trackingId: 'tracking-1',
        playerId: 'player-1',
        skillName: 'Wrist Shot Power',
        value: 90,
        improvement: expect.any(Number)
      });
    });
  });

  describe('determineTrend', () => {
    it('should determine improving trend correctly', async () => {
      const measurements: SkillMeasurement[] = [
        { id: 'm1', value: 70, unit: 'mph', testDate: new Date('2025-01-01'), testType: 'test' },
        { id: 'm2', value: 75, unit: 'mph', testDate: new Date('2025-01-05'), testType: 'test' },
        { id: 'm3', value: 80, unit: 'mph', testDate: new Date('2025-01-10'), testType: 'test' },
        { id: 'm4', value: 85, unit: 'mph', testDate: new Date('2025-01-15'), testType: 'test' },
        { id: 'm5', value: 90, unit: 'mph', testDate: new Date('2025-01-20'), testType: 'test' }
      ];

      const trackings = [{
        ...mockSkillTracking,
        measurements
      }];

      mockRepository.findBySkill.mockResolvedValue(trackings);

      const result = await service.getTeamSkillComparison('team-1', 'Test Skill');

      expect(result.playerComparisons[0].trend).toBe('improving');
    });

    it('should determine stable trend for insufficient data', async () => {
      const measurements: SkillMeasurement[] = [
        { id: 'm1', value: 80, unit: 'mph', testDate: new Date('2025-01-01'), testType: 'test' },
        { id: 'm2', value: 82, unit: 'mph', testDate: new Date('2025-01-10'), testType: 'test' }
      ];

      const trackings = [{
        ...mockSkillTracking,
        measurements
      }];

      mockRepository.findBySkill.mockResolvedValue(trackings);

      const result = await service.getTeamSkillComparison('team-1', 'Test Skill');

      expect(result.playerComparisons[0].trend).toBe('stable');
    });
  });

  describe('error handling', () => {
    it('should handle repository findOne errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findOne.mockRejectedValue(error);

      await expect(service.recordMeasurement('tracking-1', {
        value: 85,
        unit: 'mph',
        testDate: new Date(),
        testType: 'test'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle repository findByPlayer errors', async () => {
      const error = new Error('Query failed');
      mockRepository.findByPlayer.mockRejectedValue(error);

      await expect(service.getPlayerSkillProgress('player-1')).rejects.toThrow('Query failed');
    });

    it('should handle repository findBySkill errors', async () => {
      const error = new Error('Index error');
      mockRepository.findBySkill.mockRejectedValue(error);

      await expect(service.getTeamSkillComparison('team-1', 'skill')).rejects.toThrow('Index error');
    });
  });

  describe('edge cases', () => {
    it('should handle measurements with same values', async () => {
      const measurements: SkillMeasurement[] = [
        { id: 'm1', value: 85, unit: 'mph', testDate: new Date('2025-01-01'), testType: 'test' },
        { id: 'm2', value: 85, unit: 'mph', testDate: new Date('2025-01-10'), testType: 'test' },
        { id: 'm3', value: 85, unit: 'mph', testDate: new Date('2025-01-20'), testType: 'test' }
      ];

      const tracking = {
        ...mockSkillTracking,
        measurements
      };

      mockRepository.findByPlayer.mockResolvedValue([tracking]);

      const result = await service.getSkillProgressReport('player-1');

      expect(result.skillDetails[0].improvement).toBe(0);
      expect(result.skillDetails[0].trend).toBe('stable');
    });

    it('should handle future test dates', async () => {
      const futureMeasurement: RecordMeasurementDto = {
        value: 95,
        unit: 'mph',
        testDate: new Date('2025-12-31'),
        testType: 'future_test'
      };

      mockRepository.findOne.mockResolvedValue(mockSkillTracking);
      mockRepository.save.mockResolvedValue(mockSkillTracking);

      await expect(service.recordMeasurement('tracking-1', futureMeasurement)).resolves.not.toThrow();
    });

    it('should handle very large improvement values', async () => {
      const measurements: SkillMeasurement[] = [
        { id: 'm1', value: 10, unit: 'mph', testDate: new Date('2025-01-01'), testType: 'test' },
        { id: 'm2', value: 100, unit: 'mph', testDate: new Date('2025-01-20'), testType: 'test' }
      ];

      const tracking = {
        ...mockSkillTracking,
        measurements
      };

      mockRepository.findByPlayer.mockResolvedValue([tracking]);

      const result = await service.getSkillProgressReport('player-1');

      expect(result.skillDetails[0].improvement).toBe(900); // 900% improvement
    });
  });
});