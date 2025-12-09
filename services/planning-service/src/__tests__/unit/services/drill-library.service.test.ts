import { DrillLibraryService, CreateDrillDto, UpdateDrillDto, DrillSearchParams } from '../../../services/DrillLibraryService';
import { Drill, DrillType, DrillDifficulty } from '../../../entities/Drill';
import { DrillCategory } from '../../../entities/DrillCategory';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { Repository } from 'typeorm';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('DrillLibraryService', () => {
  let service: DrillLibraryService;
  let mockRepository: jest.Mocked<any>;
  let mockCategoryRepository: jest.Mocked<Repository<DrillCategory>>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockInstructions = [
    {
      step: 1,
      description: 'Set up cones in a line',
      duration: 2,
      keyPoints: ['Proper spacing', 'Clear sight lines']
    },
    {
      step: 2,
      description: 'Players skate through cones',
      duration: 5,
      keyPoints: ['Control speed', 'Maintain balance']
    }
  ];

  const mockSetup = {
    rinkArea: 'zone' as const,
    diagram: 'cone-setup.jpg',
    cones: 6,
    pucks: 12,
    otherEquipment: ['net', 'boards']
  };

  const mockDrill: Partial<Drill> = {
    id: 'drill-1',
    name: 'Cone Weaving Drill',
    description: 'Basic skating and puck control drill',
    organizationId: 'org-1',
    isPublic: false,
    categoryId: 'category-1',
    type: DrillType.SKATING,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 6,
    maxPlayers: 20,
    equipment: ['pucks', 'cones'],
    setup: mockSetup,
    instructions: mockInstructions,
    objectives: ['Improve skating', 'Develop puck control'],
    keyPoints: ['Keep head up', 'Smooth movements'],
    variations: ['Add shooting', 'Time trial'],
    tags: ['skating', 'beginner'],
    ageGroups: ['U14', 'U16'],
    usageCount: 50,
    rating: 400, // Total rating points
    ratingCount: 100, // Number of ratings
    createdAt: new Date(),
    updatedAt: new Date(),
    getAverageRating: jest.fn().mockReturnValue(4.0)
  };

  const mockCategory = {
    id: 'category-1',
    name: 'Skating Drills',
    description: 'Fundamental skating skills'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      findByCategory: jest.fn(),
      findByTypeAndDifficulty: jest.fn(),
      searchDrills: jest.fn(),
      getPopularDrills: jest.fn(),
      getTopRatedDrills: jest.fn(),
      getDrillAnalytics: jest.fn(),
      incrementUsageCount: jest.fn(),
      updateRating: jest.fn(),
      invalidateByTags: jest.fn(),
      cacheQueryResult: jest.fn()
    };

    mockCategoryRepository = {
      findOne: jest.fn()
    } as any;

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

    service = new DrillLibraryService();
    
    // Replace repository instances
    (service as any).repository = mockRepository;
    (service as any).categoryRepository = mockCategoryRepository;
  });

  describe('createDrill', () => {
    const createDto: CreateDrillDto = {
      name: 'Test Drill',
      description: 'A test drill for unit testing',
      organizationId: 'org-1',
      isPublic: false,
      categoryId: 'category-1',
      type: DrillType.SKATING,
      difficulty: DrillDifficulty.BEGINNER,
      duration: 10,
      minPlayers: 6,
      maxPlayers: 20,
      equipment: ['pucks', 'cones'],
      setup: mockSetup,
      instructions: mockInstructions,
      objectives: ['Test objective'],
      tags: ['test']
    };

    it('should create a drill successfully', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockDrill);

      // Act
      const result = await service.createDrill(createDto);

      // Assert
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.categoryId }
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('drill.created', {
        drillId: mockDrill.id,
        name: createDto.name,
        type: createDto.type,
        difficulty: createDto.difficulty,
        organizationId: createDto.organizationId,
        isPublic: createDto.isPublic
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating drill',
        { name: createDto.name, type: createDto.type }
      );
      expect(result).toEqual(mockDrill);
    });

    it('should validate category exists', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createDrill(createDto)).rejects.toThrow(
        'Drill category not found'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should validate instructions are provided', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      const invalidDto = { ...createDto, instructions: [] };

      // Act & Assert
      await expect(service.createDrill(invalidDto)).rejects.toThrow(
        'Drill must have at least one instruction'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate instruction steps are sequential', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      const invalidInstructions = [
        { step: 1, description: 'Step 1' },
        { step: 3, description: 'Step 3' } // Missing step 2
      ];
      const invalidDto = { ...createDto, instructions: invalidInstructions };

      // Act & Assert
      await expect(service.createDrill(invalidDto)).rejects.toThrow(
        'Instruction steps must be sequential starting from 1'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate instruction descriptions', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      const invalidInstructions = [
        { step: 1, description: '' }, // Empty description
        { step: 2, description: 'Valid step' }
      ];
      const invalidDto = { ...createDto, instructions: invalidInstructions };

      // Act & Assert
      await expect(service.createDrill(invalidDto)).rejects.toThrow(
        'Instruction 1 must have a description'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createDrill(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating drill',
        { error: error.message, data: createDto }
      );
    });
  });

  describe('updateDrill', () => {
    const updateDto: UpdateDrillDto = {
      name: 'Updated Drill',
      difficulty: DrillDifficulty.INTERMEDIATE,
      isPublic: true
    };

    it('should update a drill successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.save.mockResolvedValue({ ...mockDrill, ...updateDto });

      // Act
      const result = await service.updateDrill('drill-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'drill-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        'drill:drill-1',
        `organization:${mockDrill.organizationId}`,
        `category:${mockDrill.categoryId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('drill.updated', {
        drillId: 'drill-1',
        name: 'Updated Drill',
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockDrill, ...updateDto });
    });

    it('should throw error when drill not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateDrill('invalid-id', updateDto))
        .rejects.toThrow('Drill not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate category when changed', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      const updateWithCategory = { ...updateDto, categoryId: 'new-category' };

      // Act & Assert
      await expect(service.updateDrill('drill-1', updateWithCategory))
        .rejects.toThrow('Drill category not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate instructions when provided', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      const invalidInstructions = [{ step: 1, description: '' }];
      const updateWithInstructions = { instructions: invalidInstructions };

      // Act & Assert
      await expect(service.updateDrill('drill-1', updateWithInstructions))
        .rejects.toThrow('Instruction 1 must have a description');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle update errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateDrill('drill-1', updateDto))
        .rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating drill',
        { error: error.message, id: 'drill-1', data: updateDto }
      );
    });
  });

  describe('deleteDrill', () => {
    it('should delete a drill successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.deleteDrill('drill-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'drill-1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockDrill);
      expect(mockEventBus.publish).toHaveBeenCalledWith('drill.deleted', {
        drillId: 'drill-1',
        name: mockDrill.name,
        organizationId: mockDrill.organizationId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Drill deleted successfully',
        { id: 'drill-1' }
      );
    });

    it('should throw error when drill not found for deletion', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteDrill('invalid-id'))
        .rejects.toThrow('Drill not found');
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle deletion errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      const error = new Error('Delete failed');
      mockRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteDrill('drill-1'))
        .rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting drill',
        { error: error.message, id: 'drill-1' }
      );
    });
  });

  describe('getDrillById', () => {
    it('should retrieve a drill by id and increment usage', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.incrementUsageCount.mockResolvedValue(undefined);

      // Act
      const result = await service.getDrillById('drill-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'drill-1' },
        relations: ['category']
      });
      expect(mockRepository.incrementUsageCount).toHaveBeenCalledWith('drill-1');
      expect(result).toEqual(mockDrill);
    });

    it('should return null when drill not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getDrillById('invalid-id');

      // Assert
      expect(mockRepository.incrementUsageCount).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle usage count increment failures gracefully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.incrementUsageCount.mockRejectedValue(new Error('Cache error'));

      // Act
      const result = await service.getDrillById('drill-1');

      // Assert
      expect(result).toEqual(mockDrill);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to increment drill usage count',
        expect.objectContaining({ drillId: 'drill-1' })
      );
    });
  });

  describe('duplicateDrill', () => {
    it('should duplicate a drill successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getDrillById');
      const createSpy = jest.spyOn(service, 'createDrill');
      const duplicatedDrill = { ...mockDrill, id: 'new-drill-id', name: 'Duplicated Drill' };
      
      getSpy.mockResolvedValue(mockDrill as Drill);
      createSpy.mockResolvedValue(duplicatedDrill as Drill);

      // Act
      const result = await service.duplicateDrill('drill-1', 'Duplicated Drill', 'org-2');

      // Assert
      expect(getSpy).toHaveBeenCalledWith('drill-1');
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Duplicated Drill',
        description: mockDrill.description,
        organizationId: 'org-2',
        isPublic: false,
        categoryId: mockDrill.categoryId,
        type: mockDrill.type,
        difficulty: mockDrill.difficulty,
        duration: mockDrill.duration,
        minPlayers: mockDrill.minPlayers,
        maxPlayers: mockDrill.maxPlayers,
        equipment: [...mockDrill.equipment!],
        setup: { ...mockDrill.setup },
        instructions: [...mockDrill.instructions!],
        objectives: [...mockDrill.objectives!],
        keyPoints: [...mockDrill.keyPoints!],
        variations: [...mockDrill.variations!],
        tags: [...mockDrill.tags!],
        ageGroups: [...mockDrill.ageGroups!],
        videoUrl: mockDrill.videoUrl,
        animationUrl: mockDrill.animationUrl
      });
      expect(result).toEqual(duplicatedDrill);

      getSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('should throw error when original drill not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getDrillById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.duplicateDrill('invalid-id', 'New Name'))
        .rejects.toThrow('Drill not found');

      getSpy.mockRestore();
    });
  });

  describe('rateDrill', () => {
    it('should rate a drill successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.updateRating.mockResolvedValue(undefined);

      // Act
      await service.rateDrill('drill-1', 'user-1', 5, 'Great drill!');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'drill-1' } });
      expect(mockRepository.updateRating).toHaveBeenCalledWith('drill-1', 5);
      expect(mockEventBus.publish).toHaveBeenCalledWith('drill.rated', {
        drillId: 'drill-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great drill!',
        newAverageRating: 4.0
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Drill rated successfully',
        { drillId: 'drill-1', rating: 5 }
      );
    });

    it('should validate rating range', async () => {
      // Act & Assert
      await expect(service.rateDrill('drill-1', 'user-1', 0))
        .rejects.toThrow('Rating must be between 1 and 5');
      
      await expect(service.rateDrill('drill-1', 'user-1', 6))
        .rejects.toThrow('Rating must be between 1 and 5');
      
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error when drill not found for rating', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rateDrill('invalid-id', 'user-1', 5))
        .rejects.toThrow('Drill not found');
      expect(mockRepository.updateRating).not.toHaveBeenCalled();
    });

    it('should handle rating errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      const error = new Error('Rating failed');
      mockRepository.updateRating.mockRejectedValue(error);

      // Act & Assert
      await expect(service.rateDrill('drill-1', 'user-1', 5))
        .rejects.toThrow('Rating failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error rating drill',
        { error: error.message, drillId: 'drill-1', userId: 'user-1', rating: 5 }
      );
    });
  });

  describe('getDrillsForPractice', () => {
    const practiceParams = {
      duration: 60,
      playerCount: 12,
      ageGroup: 'U14',
      focus: [DrillType.SKATING, DrillType.PASSING],
      equipment: ['pucks', 'cones']
    };

    const mockWarmUpDrills = [
      { ...mockDrill, id: 'warmup-1', type: DrillType.WARM_UP, duration: 5 }
    ];
    const mockMainDrills = [
      { ...mockDrill, id: 'main-1', type: DrillType.SKATING, duration: 15 },
      { ...mockDrill, id: 'main-2', type: DrillType.PASSING, duration: 20 }
    ];
    const mockCoolDownDrills = [
      { ...mockDrill, id: 'cooldown-1', type: DrillType.COOL_DOWN, duration: 6 }
    ];

    it('should get drills for practice with proper time allocation', async () => {
      // Arrange
      mockRepository.searchDrills
        .mockResolvedValueOnce(mockWarmUpDrills) // Warm-up drills
        .mockResolvedValueOnce(mockCoolDownDrills) // Cool-down drills
        .mockResolvedValueOnce(mockMainDrills.slice(0, 1)) // Skating drills
        .mockResolvedValueOnce(mockMainDrills.slice(1, 2)); // Passing drills

      // Act
      const result = await service.getDrillsForPractice('org-1', practiceParams);

      // Assert
      expect(mockRepository.searchDrills).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        warmUp: expect.arrayContaining([expect.objectContaining({ type: DrillType.WARM_UP })]),
        main: expect.arrayContaining([
          expect.objectContaining({ type: DrillType.SKATING }),
          expect.objectContaining({ type: DrillType.PASSING })
        ]),
        coolDown: expect.arrayContaining([expect.objectContaining({ type: DrillType.COOL_DOWN })]),
        totalDuration: expect.any(Number)
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting drills for practice',
        { organizationId: 'org-1', practiceParams }
      );
    });

    it('should handle no focus specified', async () => {
      // Arrange
      const paramsWithoutFocus = { ...practiceParams, focus: undefined };
      mockRepository.searchDrills
        .mockResolvedValueOnce(mockWarmUpDrills)
        .mockResolvedValueOnce(mockCoolDownDrills)
        .mockResolvedValueOnce(mockMainDrills);

      // Act
      const result = await service.getDrillsForPractice('org-1', paramsWithoutFocus);

      // Assert
      expect(mockRepository.searchDrills).toHaveBeenCalledTimes(3);
      expect(result.warmUp).toBeDefined();
      expect(result.main).toBeDefined();
      expect(result.coolDown).toBeDefined();
    });

    it('should handle errors and log them', async () => {
      // Arrange
      const error = new Error('Search failed');
      mockRepository.searchDrills.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getDrillsForPractice('org-1', practiceParams))
        .rejects.toThrow('Search failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting drills for practice',
        { error: error.message, organizationId: 'org-1', practiceParams }
      );
    });
  });

  describe('getRecommendedDrills', () => {
    const previousDrillIds = ['drill-2', 'drill-3'];

    it('should get recommended drills excluding previous ones', async () => {
      // Arrange
      const allDrills = [
        { ...mockDrill, id: 'drill-1' }, // Should be included
        { ...mockDrill, id: 'drill-2' }, // Should be excluded (used before)
        { ...mockDrill, id: 'drill-4' }  // Should be included
      ];
      mockRepository.searchDrills.mockResolvedValue(allDrills);

      // Act
      const result = await service.getRecommendedDrills('org-1', 12, previousDrillIds, 'U14');

      // Assert
      expect(mockRepository.searchDrills).toHaveBeenCalledWith('org-1', {
        playerCount: 12,
        ageGroup: 'U14',
        type: undefined
      });
      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual(['drill-1', 'drill-4']);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting recommended drills',
        { organizationId: 'org-1', playerCount: 12 }
      );
    });

    it('should handle recommendation errors and log them', async () => {
      // Arrange
      const error = new Error('Recommendation failed');
      mockRepository.searchDrills.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getRecommendedDrills('org-1', 12))
        .rejects.toThrow('Recommendation failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting recommended drills',
        { error: error.message, organizationId: 'org-1' }
      );
    });
  });

  describe('cache integration', () => {
    it('should use cached results for category queries', async () => {
      // Arrange
      const cachedDrills = [mockDrill];
      mockRepository.findByCategory.mockResolvedValue(cachedDrills);

      // Act
      const result = await service.getDrillsByCategory('category-1', 'org-1');

      // Assert
      expect(mockRepository.findByCategory).toHaveBeenCalledWith('category-1', 'org-1', undefined);
      expect(result).toEqual(cachedDrills);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockDrill);
      mockRepository.save.mockResolvedValue(mockDrill);

      // Act
      await service.updateDrill('drill-1', { name: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        'drill:drill-1',
        `organization:${mockDrill.organizationId}`,
        `category:${mockDrill.categoryId}`
      ]);
    });
  });

  describe('analytics', () => {
    it('should retrieve drill analytics', async () => {
      // Arrange
      const analytics = {
        totalDrills: 100,
        publicDrills: 60,
        privateDrills: 40,
        typeDistribution: { [DrillType.SKATING]: 25, [DrillType.PASSING]: 20 },
        difficultyDistribution: { [DrillDifficulty.BEGINNER]: 40, [DrillDifficulty.INTERMEDIATE]: 35 },
        averageRating: 4.2,
        mostUsedDrills: [
          { id: 'drill-1', name: 'Popular Drill', usageCount: 150, rating: 4.5 }
        ],
        lastUpdated: new Date()
      };
      mockRepository.getDrillAnalytics.mockResolvedValue(analytics);

      // Act
      const result = await service.getDrillAnalytics('org-1');

      // Assert
      expect(mockRepository.getDrillAnalytics).toHaveBeenCalledWith('org-1', undefined, undefined);
      expect(result).toEqual(analytics);
    });
  });

  describe('search and filtering', () => {
    const searchParams: DrillSearchParams = {
      query: 'skating',
      type: DrillType.SKATING,
      difficulty: DrillDifficulty.BEGINNER,
      playerCount: 12,
      equipment: ['pucks'],
      ageGroup: 'U14'
    };

    it('should search drills with parameters', async () => {
      // Arrange
      const searchResults = [mockDrill];
      mockRepository.searchDrills.mockResolvedValue(searchResults);

      // Act
      const result = await service.searchDrills('org-1', searchParams);

      // Assert
      expect(mockRepository.searchDrills).toHaveBeenCalledWith('org-1', searchParams);
      expect(result).toEqual(searchResults);
    });

    it('should get popular drills', async () => {
      // Arrange
      const popularDrills = [mockDrill];
      mockRepository.getPopularDrills.mockResolvedValue(popularDrills);

      // Act
      const result = await service.getPopularDrills('org-1', 10);

      // Assert
      expect(mockRepository.getPopularDrills).toHaveBeenCalledWith('org-1', 10);
      expect(result).toEqual(popularDrills);
    });

    it('should get top rated drills', async () => {
      // Arrange
      const topRatedDrills = [mockDrill];
      mockRepository.getTopRatedDrills.mockResolvedValue(topRatedDrills);

      // Act
      const result = await service.getTopRatedDrills('org-1', 10);

      // Assert
      expect(mockRepository.getTopRatedDrills).toHaveBeenCalledWith('org-1', 10);
      expect(result).toEqual(topRatedDrills);
    });
  });

  describe('event publishing', () => {
    it('should publish events with correct payload structure', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockDrill);
      const createDto: CreateDrillDto = {
        name: 'Event Test Drill',
        description: 'Test drill for events',
        organizationId: 'org-1',
        isPublic: true,
        categoryId: 'category-1',
        type: DrillType.PASSING,
        difficulty: DrillDifficulty.ADVANCED,
        duration: 15,
        minPlayers: 4,
        maxPlayers: 12,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions
      };

      // Act
      await service.createDrill(createDto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('drill.created', {
        drillId: mockDrill.id,
        name: createDto.name,
        type: createDto.type,
        difficulty: createDto.difficulty,
        organizationId: createDto.organizationId,
        isPublic: createDto.isPublic
      });
    });

    it('should not publish events on validation failures', async () => {
      // Arrange
      mockCategoryRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createDrill({} as any)).rejects.toThrow();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});