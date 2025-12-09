import { Repository, SelectQueryBuilder } from 'typeorm';
import { CachedInjuryRepository } from './CachedInjuryRepository';
import { Injury } from '../entities/Injury';
import { AppDataSource } from '../config/database';
import { RedisCacheManager } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../config/database');
jest.mock('@hockey-hub/shared-lib');

describe('CachedInjuryRepository', () => {
  let repository: CachedInjuryRepository;
  let mockRepository: jest.Mocked<Repository<Injury>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Injury>>;
  let mockCacheManager: jest.Mocked<RedisCacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock query builder
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      clone: jest.fn(function(this: any){ return this; }).mockReturnThis(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
    };
    mockQueryBuilder = qb as any;
    
    // Mock TypeORM repository
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;
    
    // Mock AppDataSource
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    
    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    } as any;
    
    // Create repository instance
    repository = new CachedInjuryRepository();
    (repository as any).cacheManager = mockCacheManager;
  });

  describe('findAll', () => {
    it('should return cached data if available', async () => {
      // Arrange
      const cachedInjuries = [createMockInjury({ id: 1 }), createMockInjury({ id: 2 })];
      mockCacheManager.get.mockResolvedValue(JSON.stringify(cachedInjuries));

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(cachedInjuries);
      expect(mockCacheManager.get).toHaveBeenCalledWith('injury:list:{"type":"all"}');
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const injuries = [createMockInjury({ id: 1 }), createMockInjury({ id: 2 })];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(injuries);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(injuries);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['treatments', 'medicalReports'],
        order: { injuryDate: 'DESC' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'injury:list:{"type":"all"}',
        JSON.stringify(injuries),
        120,
        ['injury:list']
      );
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated results with correct metadata', async () => {
      // Arrange
      const injuries = [createMockInjury({ id: 1 }), createMockInjury({ id: 2 })];
      const total = 10;
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([injuries, total]);

      // Act
      const result = await repository.findAllPaginated({ page: 1, limit: 20, offset: 0 });

      // Assert
      expect(result).toEqual({
        data: injuries,
        pagination: {
          total: 10,
          page: 1,
          limit: 20,
          pages: 1,
        },
      });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('injury.treatments', 'treatments');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('injury.medicalReports', 'medicalReports');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('injury.injuryDate', 'DESC');
    });
  });

  describe('findActiveInjuries', () => {
    it('should return only active injuries', async () => {
      // Arrange
      const activeInjuries = [
        createMockInjury({ id: 1, recoveryStatus: 'active' }),
        createMockInjury({ id: 2, recoveryStatus: 'active' }),
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(activeInjuries);

      // Act
      const result = await repository.findActiveInjuries();

      // Assert
      expect(result).toEqual(activeInjuries);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          recoveryStatus: 'active',
          isActive: true,
        },
        relations: ['treatments', 'medicalReports'],
        order: { injuryDate: 'DESC' },
      });
      // Cache with shorter TTL for active data
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'injury:list:{"type":"active"}',
        JSON.stringify(activeInjuries),
        60, // 1 minute for active data
        ['injury:list', 'injury:active']
      );
    });
  });

  describe('findByPlayerId', () => {
    it('should return injuries for specific player', async () => {
      // Arrange
      const playerId = 101;
      const playerInjuries = [
        createMockInjury({ id: 1, playerId }),
        createMockInjury({ id: 2, playerId }),
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(playerInjuries);

      // Act
      const result = await repository.findByPlayerId(playerId);

      // Assert
      expect(result).toEqual(playerInjuries);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { playerId },
        relations: ['treatments', 'medicalReports'],
        order: { injuryDate: 'DESC' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'injury:list:{"type":"player","playerId":"101"}',
        JSON.stringify(playerInjuries),
        300, // 5 minutes
        ['injury:list', 'player:101']
      );
    });
  });

  describe('findById', () => {
    it('should return injury by ID', async () => {
      // Arrange
      const injury = createMockInjury({ id: 1 });
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(injury);

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(result).toEqual(injury);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['treatments', 'medicalReports'],
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'injury:1',
        JSON.stringify(injury),
        600, // 10 minutes
        ['injury:1']
      );
    });

    it('should return null if injury not found', async () => {
      // Arrange
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save injury and invalidate related caches', async () => {
      // Arrange
      const injuryData = {
        playerId: 101,
        injuryType: 'muscle_strain',
        bodyPart: 'hamstring',
      };
      const savedInjury = { ...injuryData, id: 1 };
      mockRepository.save.mockResolvedValue(savedInjury);

      // Act
      const result = await repository.save(injuryData);

      // Assert
      expect(result).toEqual(savedInjury);
      expect(mockRepository.save).toHaveBeenCalledWith(injuryData);
      expect(mockCacheManager.deletePattern).toHaveBeenCalledTimes(4);
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:list*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:active*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*player:101*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:1*');
    });
  });

  describe('delete', () => {
    it('should delete injury and invalidate caches', async () => {
      // Arrange
      const injury = createMockInjury({ id: 1, playerId: 101 });
      mockCacheManager.get.mockResolvedValue(JSON.stringify(injury));
      mockRepository.delete.mockResolvedValue({} as any);

      // Act
      await repository.delete(1);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockCacheManager.deletePattern).toHaveBeenCalledTimes(4);
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:list*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:active*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*player:101*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('*injury:1*');
    });
  });

  describe('countActiveByBodyPart', () => {
    it('should return injury count grouped by body part', async () => {
      // Arrange
      const rawResults = [
        { bodyPart: 'knee', count: '5' },
        { bodyPart: 'ankle', count: '3' },
        { bodyPart: 'hamstring', count: '2' },
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getRawMany.mockResolvedValue(rawResults);

      // Act
      const result = await repository.countActiveByBodyPart();

      // Assert
      expect(result).toEqual([
        { bodyPart: 'knee', count: 5 },
        { bodyPart: 'ankle', count: 3 },
        { bodyPart: 'hamstring', count: 2 },
      ]);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('injury.bodyPart', 'bodyPart');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('injury.recoveryStatus = :status', { status: 'active' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('injury.isActive = true');
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('injury.bodyPart');
    });

    it('should cache statistics results', async () => {
      // Arrange
      const stats = [{ bodyPart: 'knee', count: 5 }];
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ bodyPart: 'knee', count: '5' }]);

      // Act
      await repository.countActiveByBodyPart();

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'injury:stats:body-parts',
        JSON.stringify(stats),
        300, // 5 minutes
        ['injury:stats']
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should properly invalidate tags when saving', async () => {
      // Arrange
      const injury = { playerId: 101, id: 1 };
      mockRepository.save.mockResolvedValue(injury);
      
      // Spy on the invalidateTags method
      const invalidateTagsSpy = jest.spyOn(repository as any, 'invalidateTags');

      // Act
      await repository.save(injury);

      // Assert
      expect(invalidateTagsSpy).toHaveBeenCalledWith([
        'injury:list',
        'injury:active',
        'player:101',
        'injury:1',
      ]);
    });
  });
});

// Helper function to create mock injury
function createMockInjury(overrides?: Partial<Injury>): Injury {
  return {
    id: 1,
    playerId: 101,
    injuryType: 'muscle_strain',
    bodyPart: 'hamstring',
    severityLevel: 2,
    injuryDate: new Date('2025-01-01'),
    expectedReturnDate: new Date('2025-01-15'),
    recoveryStatus: 'active',
    description: 'Test injury',
    diagnosis: 'Grade 2 strain',
    isActive: true,
    organizationId: 'org-1',
    teamId: 'team-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'medical-1',
    updatedBy: 'medical-1',
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    treatments: [],
    medicalReports: [],
    playerAvailabilities: [],
    ...overrides,
  } as Injury;
}