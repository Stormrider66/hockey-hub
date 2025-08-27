import { Repository } from 'typeorm';
import { CachedUserRepository } from '../../repositories/CachedUserRepository';
import { User } from '../../entities/User';
import { Organization } from '../../entities/Organization';
import { Team } from '../../entities/Team';
// Prefer public index export to avoid path-mapped type issues
import { getCacheManager } from '@hockey-hub/shared-lib/cache/cacheConfig';

// Mock the cache manager
jest.mock('@hockey-hub/shared-lib/cache/cacheConfig', () => {
  const cache = {
    store: new Map<string, any>(),
    async get<T>(key: string): Promise<T | null> { return this.store.has(key) ? this.store.get(key) : null; },
    async set<T>(key: string, value: T, _ttl?: number): Promise<void> { this.store.set(key, value); },
    async delete(key: string): Promise<void> { this.store.delete(key); },
    async deletePattern(_pattern: string): Promise<void> {},
    async reset(): Promise<void> { this.store.clear(); },
  } as any;
  return {
    getCacheManager: jest.fn(() => cache),
  };
});

describe('CachedUserRepository', () => {
  let cachedUserRepository: CachedUserRepository;
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let mockOrganizationRepository: jest.Mocked<Repository<Organization>>;
  let mockTeamRepository: jest.Mocked<Repository<Team>>;
  let mockCacheManager: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@hockeyhub.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    organization: { id: 'org-123', name: 'Test Org' },
    teams: [{ id: 'team-123', name: 'Test Team' }],
  } as User;

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    subdomain: 'test',
  } as Organization;

  const mockTeam = {
    id: 'team-123',
    name: 'Test Team',
    type: 'competitive',
  } as Team;

  beforeEach(() => {
    // Setup mock repositories
    mockUserRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockOrganizationRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockTeamRepository = {
      find: jest.fn(),
    } as any;

    // Setup mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    };

    (getCacheManager as jest.Mock).mockReturnValue(mockCacheManager);

    // Adapt to new constructor that takes no args (uses AppDataSource repo internally)
    (cachedUserRepository as any) = new CachedUserRepository();
    // Inject mocks
    (cachedUserRepository as any).repository = mockUserRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return cached user if exists', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);

      const result = await cachedUserRepository.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:user-123');
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await cachedUserRepository.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:user-123');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['organization', 'teams', 'role', 'role.permissions'],
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:user-123',
        mockUser,
        300 // 5 minutes TTL
      );
    });

    it('should return null if user not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await cachedUserRepository.findById('user-123');

      expect(result).toBeNull();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should use cache for email lookup', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);

      const result = await cachedUserRepository.findByEmail('test@hockeyhub.com');

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:email:test@hockeyhub.com');
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should cache by both email and id', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await cachedUserRepository.findByEmail('test@hockeyhub.com');

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:email:test@hockeyhub.com',
        mockUser,
        300
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:user-123',
        mockUser,
        300
      );
    });
  });

  describe('findByOrganization', () => {
    it('should cache organization users', async () => {
      const users = [mockUser];
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.find.mockResolvedValue(users);

      const result = await cachedUserRepository.findByOrganization('org-123');

      expect(result.users).toEqual(users);
      expect(result.total).toBe(users.length);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'users:org:org-123',
        users,
        60
      );
    });

    it('should support pagination', async () => {
      const users = [mockUser];
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.find.mockResolvedValue(users);

      await cachedUserRepository.findByOrganization('org-123', { take: 10, skip: 20 } as any);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { organization: { id: 'org-123' } },
        relations: ['teams', 'role'],
        take: 10,
        skip: 20,
        order: { createdAt: 'DESC' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'users:org:org-123',
        users,
        60
      );
    });
  });

  describe('updateUser', () => {
    it('should invalidate all related caches on update', async () => {
      mockUserRepository.save.mockResolvedValue(mockUser);

      await cachedUserRepository.updateUser('user-123', { firstName: 'Jane' });

      expect(mockCacheManager.delete).toHaveBeenCalledWith('user:user-123');
      expect(mockCacheManager.delete).toHaveBeenCalledWith('user:email:test@hockeyhub.com');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('users:org:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('users:team:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('user:stats:user-123');
    });

    it('should handle users without organization', async () => {
      const userWithoutOrg = { ...mockUser, organization: null } as User;
      mockUserRepository.save.mockResolvedValue(userWithoutOrg);

      await cachedUserRepository.updateUser('user-123', { firstName: 'Jane' });

      expect(mockCacheManager.deletePattern).not.toHaveBeenCalledWith('users:org:*');
    });
  });

  describe('deleteUser', () => {
    it('should invalidate all caches on delete', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await cachedUserRepository.deleteUser('user-123');

      expect(result).toBe(true);
      expect(mockCacheManager.delete).toHaveBeenCalledWith('user:user-123');
      expect(mockCacheManager.delete).toHaveBeenCalledWith('user:email:test@hockeyhub.com');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('users:org:org-123*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('users:team:*');
    });

    it('should return false if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await cachedUserRepository.deleteUser('user-123');

      expect(result).toBe(false);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    it('should cache user statistics', async () => {
      const stats = {
        totalUsers: 10,
        totalTeams: 2,
        totalOrganizations: 1,
      };
      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.find.mockResolvedValue([{ id: 'team-1' }, { id: 'team-2' }] as Team[]);
      mockOrganizationRepository.find.mockResolvedValue([mockOrganization]);

      const result = await cachedUserRepository.getUserStatistics('user-123');

      expect(result).toEqual(stats);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:stats:user-123',
        stats,
        300 // 5 minutes TTL
      );
    });

    it('should return cached statistics if available', async () => {
      const cachedStats = { totalUsers: 5, totalTeams: 1, totalOrganizations: 1 };
      mockCacheManager.get.mockResolvedValue(cachedStats);

      const result = await cachedUserRepository.getUserStatistics('user-123');

      expect(result).toEqual(cachedStats);
      expect(mockUserRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('warmCache', () => {
    it('should pre-populate cache for active users', async () => {
      const users = [mockUser];
      mockUserRepository.find.mockResolvedValue(users);

      await cachedUserRepository.warmCache();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['organization', 'teams', 'role', 'role.permissions'],
        take: 100,
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'user:user-123',
        mockUser,
        300
      );
    });
  });
});