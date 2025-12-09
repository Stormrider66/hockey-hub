import { PlayerDevelopmentPlanService, CreateDevelopmentPlanDto, UpdateDevelopmentPlanDto } from '../../../services/PlayerDevelopmentPlanService';
import { PlayerDevelopmentPlan, DevelopmentPlanStatus, DevelopmentGoal, WeeklyPlan, Milestone } from '../../../entities/PlayerDevelopmentPlan';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('PlayerDevelopmentPlanService', () => {
  let service: PlayerDevelopmentPlanService;
  let mockRepository: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockCurrentLevel = {
    skating: 'intermediate',
    shooting: 'beginner',
    passing: 'intermediate',
    overall: 'intermediate'
  };

  const mockTargetLevel = {
    skating: 'advanced',
    shooting: 'intermediate',
    passing: 'advanced',
    overall: 'advanced'
  };

  const mockGoals: DevelopmentGoal[] = [
    {
      id: 'goal-1',
      title: 'Improve Shooting Accuracy',
      description: 'Work on wrist shot accuracy from various positions',
      priority: 'HIGH',
      category: 'Technical',
      targetDate: new Date('2025-06-01'),
      status: 'in_progress',
      metrics: {
        target: 'Achieve 70% accuracy from slot',
        current: '45% accuracy',
        measurement: 'Weekly shooting drills assessment'
      }
    },
    {
      id: 'goal-2',
      title: 'Enhanced Skating Speed',
      description: 'Increase straight-line skating speed',
      priority: 'MEDIUM',
      category: 'Physical',
      targetDate: new Date('2025-05-01'),
      status: 'pending',
      metrics: {
        target: 'Reduce 200m time by 2 seconds',
        current: '28.5 seconds',
        measurement: 'Monthly speed tests'
      }
    }
  ];

  const mockWeeklyPlans: WeeklyPlan[] = [
    {
      week: 1,
      focus: 'Shooting fundamentals',
      drills: ['drill-1', 'drill-2'],
      practiceTime: 180, // 3 hours
      homeWork: 'Watch shooting technique videos',
      parentNotes: 'Focus on proper wrist position'
    },
    {
      week: 2,
      focus: 'Skating mechanics',
      drills: ['drill-3', 'drill-4'],
      practiceTime: 200,
      homeWork: 'Off-ice balance exercises',
      parentNotes: 'Emphasize core strength'
    }
  ];

  const mockMilestones: Milestone[] = [
    {
      id: 'milestone-1',
      title: 'First Goal Assessment',
      description: 'Complete initial shooting accuracy test',
      targetDate: new Date('2025-02-15'),
      status: 'pending',
      criteria: 'Achieve minimum 50% accuracy in controlled environment',
      reward: 'New practice pucks'
    },
    {
      id: 'milestone-2',
      title: 'Mid-Season Review',
      description: 'Comprehensive skill assessment',
      targetDate: new Date('2025-04-01'),
      status: 'pending',
      criteria: 'Show improvement in 3 out of 4 key areas',
      reward: 'Advanced training session'
    }
  ];

  const mockDevelopmentPlan: Partial<PlayerDevelopmentPlan> = {
    id: 'plan-1',
    playerId: 'player-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    planName: 'Winter Development Plan',
    description: 'Focus on shooting and skating improvements',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-01'),
    status: DevelopmentPlanStatus.ACTIVE,
    currentLevel: mockCurrentLevel,
    targetLevel: mockTargetLevel,
    goals: mockGoals,
    weeklyPlans: mockWeeklyPlans,
    milestones: mockMilestones,
    progressNotes: [
      '2025-01-15: Started shooting drills, good form',
      '2025-01-08: Initial assessment completed'
    ],
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findByPlayer: jest.fn(),
      findActiveByCoach: jest.fn(),
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

    service = new PlayerDevelopmentPlanService();
    
    // Replace repository instance
    (service as any).repository = mockRepository;
  });

  describe('createDevelopmentPlan', () => {
    const createDto: CreateDevelopmentPlanDto = {
      playerId: 'player-1',
      coachId: 'coach-1',
      teamId: 'team-1',
      planName: 'Test Development Plan',
      description: 'Test plan for unit testing',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-01'),
      currentLevel: mockCurrentLevel,
      targetLevel: mockTargetLevel,
      goals: mockGoals,
      weeklyPlans: mockWeeklyPlans,
      milestones: mockMilestones
    };

    it('should create a development plan successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);

      // Act
      const result = await service.createDevelopmentPlan(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        status: DevelopmentPlanStatus.ACTIVE,
        progressNotes: [],
        lastUpdated: expect.any(Date)
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('development-plan.created', {
        planId: mockDevelopmentPlan.id,
        playerId: createDto.playerId,
        coachId: createDto.coachId,
        teamId: createDto.teamId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating development plan',
        { playerId: createDto.playerId, planName: createDto.planName }
      );
      expect(result).toEqual(mockDevelopmentPlan);
    });

    it('should set default status to active', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue({
        ...mockDevelopmentPlan,
        status: DevelopmentPlanStatus.ACTIVE
      });

      // Act
      await service.createDevelopmentPlan(createDto);

      // Assert
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.status).toBe(DevelopmentPlanStatus.ACTIVE);
      expect(savedData.progressNotes).toEqual([]);
      expect(savedData.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createDevelopmentPlan(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating development plan',
        { error: error.message, data: createDto }
      );
    });

    it('should validate goal structure', async () => {
      // Arrange
      const createDtoWithInvalidGoals = {
        ...createDto,
        goals: [
          {
            id: 'goal-1',
            title: '', // Invalid empty title
            description: 'Test goal',
            priority: 'HIGH' as const,
            category: 'Technical' as const,
            targetDate: new Date(),
            status: 'pending' as const
          }
        ]
      };
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);

      // Act - Should not throw error as validation is done at entity level
      const result = await service.createDevelopmentPlan(createDtoWithInvalidGoals);

      // Assert - Service should save the data as provided
      expect(result).toEqual(mockDevelopmentPlan);
    });

    it('should validate milestone structure', async () => {
      // Arrange
      const createDtoWithMilestones = {
        ...createDto,
        milestones: [
          {
            id: 'milestone-1',
            title: 'Test Milestone',
            description: 'Test milestone description',
            targetDate: new Date('2025-03-01'),
            status: 'pending' as const,
            criteria: 'Pass assessment',
            reward: 'Certificate'
          }
        ]
      };
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);

      // Act
      const result = await service.createDevelopmentPlan(createDtoWithMilestones);

      // Assert
      expect(result).toEqual(mockDevelopmentPlan);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          milestones: createDtoWithMilestones.milestones
        })
      );
    });
  });

  describe('updateDevelopmentPlan', () => {
    const updateDto: UpdateDevelopmentPlanDto = {
      planName: 'Updated Plan Name',
      description: 'Updated description',
      status: DevelopmentPlanStatus.IN_PROGRESS,
      progressNotes: ['New progress note']
    };

    it('should update a development plan successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      mockRepository.save.mockResolvedValue({ ...mockDevelopmentPlan, ...updateDto });

      // Act
      const result = await service.updateDevelopmentPlan('plan-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `player:${mockDevelopmentPlan.playerId}`,
        `coach:${mockDevelopmentPlan.coachId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('development-plan.updated', {
        planId: 'plan-1',
        playerId: mockDevelopmentPlan.playerId,
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockDevelopmentPlan, ...updateDto });
    });

    it('should throw error when development plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateDevelopmentPlan('invalid-id', updateDto))
        .rejects.toThrow('Development plan not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update lastUpdated timestamp', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));

      // Act
      await service.updateDevelopmentPlan('plan-1', updateDto);

      // Assert
      const savedPlan = mockRepository.save.mock.calls[0][0];
      expect(savedPlan.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle partial updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      const partialUpdate = { status: DevelopmentPlanStatus.COMPLETED };
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));

      // Act
      await service.updateDevelopmentPlan('plan-1', partialUpdate);

      // Assert
      const savedPlan = mockRepository.save.mock.calls[0][0];
      expect(savedPlan.status).toBe(DevelopmentPlanStatus.COMPLETED);
      expect(savedPlan.planName).toBe(mockDevelopmentPlan.planName); // Should preserve existing values
    });
  });

  describe('getDevelopmentPlansByPlayer', () => {
    it('should retrieve development plans for a player', async () => {
      // Arrange
      const playerPlans = [mockDevelopmentPlan];
      mockRepository.findByPlayer.mockResolvedValue(playerPlans);

      // Act
      const result = await service.getDevelopmentPlansByPlayer('player-1');

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
      expect(result).toEqual(playerPlans);
    });

    it('should return empty array when no plans found', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([]);

      // Act
      const result = await service.getDevelopmentPlansByPlayer('player-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getActivePlansByCoach', () => {
    it('should retrieve active plans for a coach', async () => {
      // Arrange
      const activePlans = [mockDevelopmentPlan];
      mockRepository.findActiveByCoach.mockResolvedValue(activePlans);

      // Act
      const result = await service.getActivePlansByCoach('coach-1');

      // Assert
      expect(mockRepository.findActiveByCoach).toHaveBeenCalledWith('coach-1');
      expect(result).toEqual(activePlans);
    });

    it('should return empty array when no active plans found', async () => {
      // Arrange
      mockRepository.findActiveByCoach.mockResolvedValue([]);

      // Act
      const result = await service.getActivePlansByCoach('coach-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateMilestone', () => {
    const milestoneUpdates = {
      status: 'completed' as const,
      completedDate: new Date('2025-02-15'),
      notes: 'Successfully completed ahead of schedule'
    };

    it('should update a milestone successfully', async () => {
      // Arrange
      const planWithMilestones = {
        ...mockDevelopmentPlan,
        milestones: [...mockMilestones]
      };
      mockRepository.findOne.mockResolvedValue(planWithMilestones);
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));

      // Act
      const result = await service.updateMilestone('plan-1', 'milestone-1', milestoneUpdates);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      
      const savedPlan = mockRepository.save.mock.calls[0][0];
      const updatedMilestone = savedPlan.milestones.find((m: any) => m.id === 'milestone-1');
      expect(updatedMilestone.status).toBe('completed');
      expect(updatedMilestone.completedDate).toEqual(milestoneUpdates.completedDate);
      expect(updatedMilestone.notes).toBe(milestoneUpdates.notes);
    });

    it('should throw error when development plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateMilestone('invalid-id', 'milestone-1', milestoneUpdates))
        .rejects.toThrow('Development plan not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when milestone not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);

      // Act & Assert
      await expect(service.updateMilestone('plan-1', 'invalid-milestone', milestoneUpdates))
        .rejects.toThrow('Milestone not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle partial milestone updates', async () => {
      // Arrange
      const planWithMilestones = {
        ...mockDevelopmentPlan,
        milestones: [...mockMilestones]
      };
      mockRepository.findOne.mockResolvedValue(planWithMilestones);
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));
      const partialUpdate = { status: 'in_progress' as const };

      // Act
      await service.updateMilestone('plan-1', 'milestone-1', partialUpdate);

      // Assert
      const savedPlan = mockRepository.save.mock.calls[0][0];
      const updatedMilestone = savedPlan.milestones.find((m: any) => m.id === 'milestone-1');
      expect(updatedMilestone.status).toBe('in_progress');
      expect(updatedMilestone.title).toBe(mockMilestones[0].title); // Should preserve existing values
    });
  });

  describe('addProgressNote', () => {
    it('should add a progress note successfully', async () => {
      // Arrange
      const planWithNotes = {
        ...mockDevelopmentPlan,
        progressNotes: [...mockDevelopmentPlan.progressNotes!]
      };
      mockRepository.findOne.mockResolvedValue(planWithNotes);
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));

      // Act
      const result = await service.addProgressNote('plan-1', 'Great progress on shooting drills');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      
      const savedPlan = mockRepository.save.mock.calls[0][0];
      expect(savedPlan.progressNotes).toHaveLength(3); // Original 2 + 1 new
      expect(savedPlan.progressNotes[2]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*: Great progress on shooting drills/);
    });

    it('should throw error when development plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addProgressNote('invalid-id', 'Test note'))
        .rejects.toThrow('Development plan not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should format progress note with timestamp', async () => {
      // Arrange
      const planWithNotes = {
        ...mockDevelopmentPlan,
        progressNotes: []
      };
      mockRepository.findOne.mockResolvedValue(planWithNotes);
      mockRepository.save.mockImplementation(plan => Promise.resolve(plan));

      // Act
      await service.addProgressNote('plan-1', 'First progress note');

      // Assert
      const savedPlan = mockRepository.save.mock.calls[0][0];
      expect(savedPlan.progressNotes[0]).toContain(': First progress note');
      expect(savedPlan.progressNotes[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getPlayerProgress', () => {
    const mockPlans = [
      {
        ...mockDevelopmentPlan,
        status: DevelopmentPlanStatus.ACTIVE,
        goals: [
          { ...mockGoals[0], status: 'completed' },
          { ...mockGoals[1], status: 'in_progress' }
        ],
        milestones: [
          { ...mockMilestones[0], status: 'pending', targetDate: new Date('2025-03-01') },
          { ...mockMilestones[1], status: 'completed', targetDate: new Date('2025-01-15') }
        ]
      },
      {
        ...mockDevelopmentPlan,
        id: 'plan-2',
        status: DevelopmentPlanStatus.COMPLETED,
        goals: [
          { ...mockGoals[0], id: 'goal-3', status: 'completed' }
        ],
        milestones: [
          { ...mockMilestones[0], id: 'milestone-3', status: 'pending', targetDate: new Date('2025-04-01') }
        ]
      }
    ];

    it('should get comprehensive player progress summary', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue(mockPlans);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
      expect(result).toEqual({
        activePlans: 1, // Only first plan is active
        completedGoals: 2, // Two completed goals across all plans
        totalGoals: 3, // Three total goals
        upcomingMilestones: expect.any(Array),
        recentProgress: expect.any(Array)
      });
      expect(result.upcomingMilestones).toHaveLength(2); // Two pending milestones with future dates
      expect(result.recentProgress).toHaveLength(2); // Two progress notes from first plan
    });

    it('should filter upcoming milestones correctly', async () => {
      // Arrange
      const plansWithPastMilestones = [
        {
          ...mockDevelopmentPlan,
          milestones: [
            { ...mockMilestones[0], status: 'pending', targetDate: new Date('2024-12-01') }, // Past date
            { ...mockMilestones[1], status: 'pending', targetDate: new Date('2025-03-01') }  // Future date
          ]
        }
      ];
      mockRepository.findByPlayer.mockResolvedValue(plansWithPastMilestones);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result.upcomingMilestones).toHaveLength(1); // Only future milestone
      expect(result.upcomingMilestones[0].targetDate).toEqual(new Date('2025-03-01'));
    });

    it('should sort upcoming milestones by target date', async () => {
      // Arrange
      const plansWithMultipleMilestones = [
        {
          ...mockDevelopmentPlan,
          milestones: [
            { ...mockMilestones[0], id: 'mile-1', status: 'pending', targetDate: new Date('2025-04-01') },
            { ...mockMilestones[1], id: 'mile-2', status: 'pending', targetDate: new Date('2025-02-01') },
            { ...mockMilestones[0], id: 'mile-3', status: 'pending', targetDate: new Date('2025-03-01') }
          ]
        }
      ];
      mockRepository.findByPlayer.mockResolvedValue(plansWithMultipleMilestones);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result.upcomingMilestones).toHaveLength(3);
      expect(result.upcomingMilestones[0].targetDate).toEqual(new Date('2025-02-01'));
      expect(result.upcomingMilestones[1].targetDate).toEqual(new Date('2025-03-01'));
      expect(result.upcomingMilestones[2].targetDate).toEqual(new Date('2025-04-01'));
    });

    it('should limit upcoming milestones to 5', async () => {
      // Arrange
      const milestonesArray = Array.from({ length: 8 }, (_, i) => ({
        ...mockMilestones[0],
        id: `milestone-${i}`,
        status: 'pending' as const,
        targetDate: new Date(`2025-0${i + 2}-01`)
      }));
      const plansWithManyMilestones = [
        {
          ...mockDevelopmentPlan,
          milestones: milestonesArray
        }
      ];
      mockRepository.findByPlayer.mockResolvedValue(plansWithManyMilestones);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result.upcomingMilestones).toHaveLength(5);
    });

    it('should sort recent progress notes chronologically', async () => {
      // Arrange
      const plansWithProgress = [
        {
          ...mockDevelopmentPlan,
          progressNotes: [
            '2025-01-20: Latest progress note',
            '2025-01-15: Middle progress note',
            '2025-01-10: Earliest progress note'
          ]
        }
      ];
      mockRepository.findByPlayer.mockResolvedValue(plansWithProgress);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result.recentProgress[0]).toBe('2025-01-20: Latest progress note');
      expect(result.recentProgress[1]).toBe('2025-01-15: Middle progress note');
      expect(result.recentProgress[2]).toBe('2025-01-10: Earliest progress note');
    });

    it('should limit recent progress notes to 10', async () => {
      // Arrange
      const progressNotes = Array.from({ length: 15 }, (_, i) => 
        `2025-01-${String(i + 1).padStart(2, '0')}: Progress note ${i + 1}`
      );
      const plansWithManyNotes = [
        {
          ...mockDevelopmentPlan,
          progressNotes
        }
      ];
      mockRepository.findByPlayer.mockResolvedValue(plansWithManyNotes);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result.recentProgress).toHaveLength(10);
    });

    it('should handle empty plans array', async () => {
      // Arrange
      mockRepository.findByPlayer.mockResolvedValue([]);

      // Act
      const result = await service.getPlayerProgress('player-1');

      // Assert
      expect(result).toEqual({
        activePlans: 0,
        completedGoals: 0,
        totalGoals: 0,
        upcomingMilestones: [],
        recentProgress: []
      });
    });
  });

  describe('cache integration', () => {
    it('should use cached results for player queries', async () => {
      // Arrange
      const cachedPlans = [mockDevelopmentPlan];
      mockRepository.findByPlayer.mockResolvedValue(cachedPlans);

      // Act
      const result = await service.getDevelopmentPlansByPlayer('player-1');

      // Assert
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
      expect(result).toEqual(cachedPlans);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);

      // Act
      await service.updateDevelopmentPlan('plan-1', { planName: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `player:${mockDevelopmentPlan.playerId}`,
        `coach:${mockDevelopmentPlan.coachId}`
      ]);
    });

    it('should use cached results for coach queries', async () => {
      // Arrange
      const cachedActivePlans = [mockDevelopmentPlan];
      mockRepository.findActiveByCoach.mockResolvedValue(cachedActivePlans);

      // Act
      const result = await service.getActivePlansByCoach('coach-1');

      // Assert
      expect(mockRepository.findActiveByCoach).toHaveBeenCalledWith('coach-1');
      expect(result).toEqual(cachedActivePlans);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);
      const createDto: CreateDevelopmentPlanDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        planName: 'Event Test Plan',
        startDate: new Date(),
        endDate: new Date(),
        currentLevel: mockCurrentLevel,
        targetLevel: mockTargetLevel,
        goals: [],
        weeklyPlans: [],
        milestones: []
      };

      // Act
      await service.createDevelopmentPlan(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('development-plan.created', {
        planId: mockDevelopmentPlan.id,
        playerId: createDto.playerId,
        coachId: createDto.coachId,
        teamId: createDto.teamId
      });
    });

    it('should publish update events with changes', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      mockRepository.save.mockResolvedValue(mockDevelopmentPlan);
      const updateDto = { planName: 'Updated Name', status: DevelopmentPlanStatus.COMPLETED };

      // Act
      await service.updateDevelopmentPlan('plan-1', updateDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('development-plan.updated', {
        planId: 'plan-1',
        playerId: mockDevelopmentPlan.playerId,
        changes: ['planName', 'status']
      });
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in findByPlayer', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockRepository.findByPlayer.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getDevelopmentPlansByPlayer('player-1')).rejects.toThrow('Database connection failed');
    });

    it('should handle repository errors in findActiveByCoach', async () => {
      // Arrange
      const error = new Error('Query timeout');
      mockRepository.findActiveByCoach.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getActivePlansByCoach('coach-1')).rejects.toThrow('Query timeout');
    });

    it('should handle update errors and not publish events', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDevelopmentPlan);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      // Act & Assert
      await expect(service.updateDevelopmentPlan('plan-1', { planName: 'Updated' }))
        .rejects.toThrow('Save failed');
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});