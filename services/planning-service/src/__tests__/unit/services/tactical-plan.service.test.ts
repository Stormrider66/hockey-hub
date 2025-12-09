import { TacticalPlanService, CreateTacticalPlanDto, UpdateTacticalPlanDto } from '../../../services/TacticalPlanService';
import { TacticalPlan, TacticalCategory, FormationType } from '../../../entities/TacticalPlan';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('TacticalPlanService', () => {
  let service: TacticalPlanService;
  let mockRepository: jest.Mocked<any>;
  let mockPlaybookRepository: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockFormation = {
    type: FormationType.POWERPLAY,
    zones: {
      offensive: [{ position: 'LW', x: 10, y: 20 }, { position: 'RW', x: 30, y: 20 }],
      neutral: [{ position: 'C', x: 50, y: 50 }],
      defensive: [{ position: 'LD', x: 70, y: 70 }, { position: 'RD', x: 90, y: 70 }]
    }
  };

  const mockPlayerAssignments = [
    { playerId: 'player1', position: 'LW', role: 'Scorer' },
    { playerId: 'player2', position: 'RW', role: 'Playmaker' }
  ];

  const mockTacticalPlan: Partial<TacticalPlan> = {
    id: 'tactical-plan-1',
    name: 'Power Play Formation A',
    organizationId: 'org-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    category: TacticalCategory.POWERPLAY,
    formation: mockFormation,
    playerAssignments: mockPlayerAssignments,
    description: 'Basic power play setup',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      remove: jest.fn(),
      findByTeamAndCategory: jest.fn(),
      findByCoach: jest.fn(),
      searchTacticalPlans: jest.fn(),
      getTacticalAnalytics: jest.fn(),
      invalidateByTags: jest.fn(),
      cacheQueryResult: jest.fn()
    };

    mockPlaybookRepository = {
      findOne: jest.fn(),
      save: jest.fn()
    };

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Mock EventBus
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      getInstance: jest.fn()
    } as any;

    // Setup static mocks
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);
    (EventBus.getInstance as jest.Mock).mockReturnValue(mockEventBus);

    // Create service instance with mocked dependencies
    service = new TacticalPlanService();
    
    // Replace the repository instances with our mocks
    (service as any).repository = mockRepository;
    (service as any).playbookRepository = mockPlaybookRepository;
  });

  describe('createTacticalPlan', () => {
    const createDto: CreateTacticalPlanDto = {
      name: 'Test Tactical Plan',
      organizationId: 'org-1',
      coachId: 'coach-1',
      teamId: 'team-1',
      category: TacticalCategory.POWERPLAY,
      formation: mockFormation,
      playerAssignments: mockPlayerAssignments,
      description: 'Test description'
    };

    it('should create a tactical plan successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockTacticalPlan);

      // Act
      const result = await service.createTacticalPlan(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        isActive: true
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('tactical-plan.created', {
        tacticalPlanId: mockTacticalPlan.id,
        teamId: createDto.teamId,
        coachId: createDto.coachId,
        category: createDto.category,
        organizationId: createDto.organizationId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating tactical plan',
        { name: createDto.name, teamId: createDto.teamId }
      );
      expect(result).toEqual(mockTacticalPlan);
    });

    it('should validate formation and player assignments', async () => {
      // Arrange
      const invalidCreateDto = {
        ...createDto,
        formation: {
          type: FormationType.POWERPLAY,
          zones: {
            offensive: [],
            neutral: [],
            defensive: [] // Invalid - no zones
          }
        }
      };

      // Act & Assert
      await expect(service.createTacticalPlan(invalidCreateDto)).rejects.toThrow(
        'Formation must have offensive, neutral, and defensive zones'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should validate unique player assignments', async () => {
      // Arrange
      const duplicateAssignments = [
        { playerId: 'player1', position: 'LW', role: 'Scorer' },
        { playerId: 'player1', position: 'RW', role: 'Playmaker' } // Same player
      ];
      const invalidCreateDto = {
        ...createDto,
        playerAssignments: duplicateAssignments
      };

      // Act & Assert
      await expect(service.createTacticalPlan(invalidCreateDto)).rejects.toThrow(
        'Cannot assign the same player to multiple positions'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate player assignment positions match formation', async () => {
      // Arrange
      const invalidAssignments = [
        { playerId: 'player1', position: 'INVALID_POSITION', role: 'Scorer' }
      ];
      const invalidCreateDto = {
        ...createDto,
        playerAssignments: invalidAssignments
      };

      // Act & Assert
      await expect(service.createTacticalPlan(invalidCreateDto)).rejects.toThrow(
        'Position INVALID_POSITION not found in formation'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createTacticalPlan(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating tactical plan',
        { error: error.message, data: createDto }
      );
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('updateTacticalPlan', () => {
    const updateDto: UpdateTacticalPlanDto = {
      name: 'Updated Tactical Plan',
      description: 'Updated description',
      isActive: false
    };

    it('should update a tactical plan successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      mockRepository.save.mockResolvedValue({ ...mockTacticalPlan, ...updateDto });

      // Act
      const result = await service.updateTacticalPlan('tactical-plan-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'tactical-plan-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockTacticalPlan.teamId}`,
        `coach:${mockTacticalPlan.coachId}`,
        `organization:${mockTacticalPlan.organizationId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('tactical-plan.updated', {
        tacticalPlanId: 'tactical-plan-1',
        teamId: mockTacticalPlan.teamId,
        coachId: mockTacticalPlan.coachId,
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockTacticalPlan, ...updateDto });
    });

    it('should throw error when tactical plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTacticalPlan('invalid-id', updateDto))
        .rejects.toThrow('Tactical plan not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should validate formation and assignments when both are updated', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      const invalidUpdateDto = {
        formation: {
          type: FormationType.POWERPLAY,
          zones: { offensive: [], neutral: [], defensive: [] }
        },
        playerAssignments: mockPlayerAssignments
      };

      // Act & Assert
      await expect(service.updateTacticalPlan('tactical-plan-1', invalidUpdateDto))
        .rejects.toThrow('Formation must have offensive, neutral, and defensive zones');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle update errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateTacticalPlan('tactical-plan-1', updateDto))
        .rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating tactical plan',
        { error: error.message, id: 'tactical-plan-1', data: updateDto }
      );
    });
  });

  describe('deleteTacticalPlan', () => {
    it('should delete a tactical plan (soft delete)', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      const updateSpy = jest.spyOn(service, 'updateTacticalPlan');
      updateSpy.mockResolvedValue(mockTacticalPlan as TacticalPlan);

      // Act
      await service.deleteTacticalPlan('tactical-plan-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'tactical-plan-1' } });
      expect(updateSpy).toHaveBeenCalledWith('tactical-plan-1', { isActive: false });
      expect(mockEventBus.publish).toHaveBeenCalledWith('tactical-plan.deleted', {
        tacticalPlanId: 'tactical-plan-1',
        teamId: mockTacticalPlan.teamId,
        coachId: mockTacticalPlan.coachId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tactical plan deleted successfully',
        { id: 'tactical-plan-1' }
      );

      updateSpy.mockRestore();
    });

    it('should throw error when tactical plan not found for deletion', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTacticalPlan('invalid-id'))
        .rejects.toThrow('Tactical plan not found');
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle deletion errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      const updateSpy = jest.spyOn(service, 'updateTacticalPlan');
      const error = new Error('Delete failed');
      updateSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteTacticalPlan('tactical-plan-1'))
        .rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting tactical plan',
        { error: error.message, id: 'tactical-plan-1' }
      );

      updateSpy.mockRestore();
    });
  });

  describe('getTacticalPlanById', () => {
    it('should retrieve a tactical plan by id', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);

      // Act
      const result = await service.getTacticalPlanById('tactical-plan-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tactical-plan-1' },
        relations: ['plays']
      });
      expect(result).toEqual(mockTacticalPlan);
    });

    it('should return null when tactical plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getTacticalPlanById('invalid-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('duplicateTacticalPlan', () => {
    it('should duplicate a tactical plan successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getTacticalPlanById');
      const createSpy = jest.spyOn(service, 'createTacticalPlan');
      const duplicatedPlan = { ...mockTacticalPlan, id: 'new-plan-id', name: 'Duplicated Plan' };
      
      getSpy.mockResolvedValue(mockTacticalPlan as TacticalPlan);
      createSpy.mockResolvedValue(duplicatedPlan as TacticalPlan);

      // Act
      const result = await service.duplicateTacticalPlan('tactical-plan-1', 'Duplicated Plan', 'team-2');

      // Assert
      expect(getSpy).toHaveBeenCalledWith('tactical-plan-1');
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Duplicated Plan',
        organizationId: mockTacticalPlan.organizationId,
        coachId: mockTacticalPlan.coachId,
        teamId: 'team-2',
        category: mockTacticalPlan.category,
        formation: { ...mockTacticalPlan.formation },
        playerAssignments: [...mockTacticalPlan.playerAssignments!],
        description: mockTacticalPlan.description,
        triggers: undefined,
        videoReferences: undefined
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tactical plan duplicated successfully',
        { originalId: 'tactical-plan-1', duplicateId: duplicatedPlan.id }
      );
      expect(result).toEqual(duplicatedPlan);

      getSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('should throw error when original plan not found for duplication', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getTacticalPlanById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.duplicateTacticalPlan('invalid-id', 'Duplicated Plan'))
        .rejects.toThrow('Tactical plan not found');
      expect(mockLogger.error).toHaveBeenCalled();

      getSpy.mockRestore();
    });
  });

  describe('cache integration', () => {
    it('should use cached results for team queries', async () => {
      // Arrange
      const cachedPlans = [mockTacticalPlan];
      mockRepository.findByTeamAndCategory.mockResolvedValue(cachedPlans);

      // Act
      const result = await service.getTacticalPlansByTeam('team-1', {
        category: TacticalCategory.POWERPLAY
      });

      // Assert
      expect(mockRepository.findByTeamAndCategory).toHaveBeenCalledWith(
        'team-1',
        TacticalCategory.POWERPLAY,
        undefined
      );
      expect(result).toEqual(cachedPlans);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTacticalPlan);
      mockRepository.save.mockResolvedValue(mockTacticalPlan);

      // Act
      await service.updateTacticalPlan('tactical-plan-1', { name: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockTacticalPlan.teamId}`,
        `coach:${mockTacticalPlan.coachId}`,
        `organization:${mockTacticalPlan.organizationId}`
      ]);
    });
  });

  describe('analytics', () => {
    it('should retrieve tactical analytics', async () => {
      // Arrange
      const analytics = {
        totalPlans: 10,
        activePlans: 8,
        inactivePlans: 2,
        categoriesDistribution: { [TacticalCategory.POWERPLAY]: 5 },
        formationDistribution: { [FormationType.POWERPLAY]: 5 },
        lastUpdated: new Date()
      };
      mockRepository.getTacticalAnalytics.mockResolvedValue(analytics);

      // Act
      const result = await service.getTacticalAnalytics('org-1', 'team-1');

      // Assert
      expect(mockRepository.getTacticalAnalytics).toHaveBeenCalledWith('org-1', 'team-1', undefined, undefined);
      expect(result).toEqual(analytics);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockTacticalPlan);
      const createDto: CreateTacticalPlanDto = {
        name: 'Event Test Plan',
        organizationId: 'org-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        category: TacticalCategory.PENALTY_KILL,
        formation: mockFormation,
        playerAssignments: mockPlayerAssignments
      };

      // Act
      await service.createTacticalPlan(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('tactical-plan.created', {
        tacticalPlanId: mockTacticalPlan.id,
        teamId: createDto.teamId,
        coachId: createDto.coachId,
        category: createDto.category,
        organizationId: createDto.organizationId
      });
    });

    it('should not publish events on validation failures', async () => {
      // Arrange
      const invalidDto: CreateTacticalPlanDto = {
        name: 'Invalid Plan',
        organizationId: 'org-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        category: TacticalCategory.POWERPLAY,
        formation: {
          type: FormationType.POWERPLAY,
          zones: { offensive: [], neutral: [], defensive: [] }
        },
        playerAssignments: []
      };

      // Act & Assert
      await expect(service.createTacticalPlan(invalidDto)).rejects.toThrow();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});