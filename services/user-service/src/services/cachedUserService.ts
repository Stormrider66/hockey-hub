import { UserService } from './userService';
import { 
  Cacheable, 
  CacheEvict, 
  CachePut,
  CacheTags,
  CacheKeyBuilder,
  EventBus 
} from '@hockey-hub/shared-lib';

export class CachedUserService extends UserService {
  constructor(eventBus?: EventBus) {
    super(eventBus);
  }

  // Cache user lookups for 5 minutes
  @Cacheable({
    ttl: 300,
    key: (target, method, userId: string) => `user:${userId}`,
    tags: (userId: string) => [CacheTags.USER(userId)]
  })
  async getUserById(userId: string, includeRelations = false) {
    return super.getUserById(userId, includeRelations);
  }

  // Cache user lists for 1 minute
  @Cacheable({
    ttl: 60,
    key: (target, method, query) => {
      return CacheKeyBuilder.create()
        .add('users')
        .addIf(!!query.organizationId, query.organizationId)
        .addIf(!!query.teamId, query.teamId)
        .addIf(!!query.role, query.role)
        .addIf(query.isActive !== undefined, query.isActive)
        .add(query.page || 1)
        .add(query.limit || 20)
        .build();
    },
    tags: () => [CacheTags.ALL_USERS]
  })
  async getUsers(query: any) {
    return super.getUsers(query);
  }

  // Update cache after user update
  @CachePut({
    key: (target, method, userId: string) => `user:${userId}`,
    tags: (userId: string) => [CacheTags.USER(userId)]
  })
  async updateUser(userId: string, data: any) {
    // Also invalidate user list caches
    await this.invalidateUserListCaches();
    return super.updateUser(userId, data);
  }

  // Evict cache on user deletion
  @CacheEvict({
    key: (target, method, userId: string) => `user:${userId}`,
    tags: (userId: string) => [CacheTags.USER(userId), CacheTags.ALL_USERS]
  })
  async deleteUser(userId: string) {
    return super.deleteUser(userId);
  }

  // Evict cache on user creation
  @CacheEvict({
    tags: () => [CacheTags.ALL_USERS]
  })
  async createUser(data: any, organizationId: string, role: string) {
    return super.createUser(data, organizationId, role);
  }

  // Cache bulk user lookups
  @Cacheable({
    ttl: 300,
    key: (target, method, userIds: string[]) => {
      const sortedIds = [...userIds].sort();
      return `users:bulk:${sortedIds.join(',')}`;
    }
  })
  async getUsersByIds(userIds: string[]) {
    return super.getUsersByIds(userIds);
  }

  // Helper method to invalidate user list caches
  private async invalidateUserListCaches() {
    // This would be handled by the cache manager's tag invalidation
    // when using tags: [CacheTags.ALL_USERS]
  }
}

// Example of cache warming strategy
export class UserCacheWarmer {
  constructor(
    private userService: CachedUserService,
    private cacheManager: any
  ) {}

  async warmCache(organizationId: string) {
    console.log(`Warming cache for organization: ${organizationId}`);

    // Warm up active users
    const activeUsers = await this.userService.getUsers({
      organizationId,
      isActive: true,
      limit: 100,
    });

    // Warm up individual user caches
    for (const user of activeUsers.users) {
      await this.userService.getUserById(user.id, true);
    }

    // Warm up team members for each team
    const teams = await this.getOrganizationTeams(organizationId);
    for (const team of teams) {
      await this.userService.getUsers({
        teamId: team.id,
        isActive: true,
      });
    }

    console.log(`Cache warming completed for organization: ${organizationId}`);
  }

  private async getOrganizationTeams(organizationId: string) {
    // This would fetch teams from the team service
    return [];
  }

  // Scheduled cache refresh
  async refreshStaleCache() {
    // Get all cached keys with TTL < 60 seconds
    const keys = await this.cacheManager.keys('user:*');
    
    for (const key of keys) {
      const ttl = await this.cacheManager.ttl(key);
      if (ttl > 0 && ttl < 60) {
        // Extract userId from key
        const userId = key.split(':')[1];
        if (userId) {
          // Refresh the cache
          await this.userService.getUserById(userId, true);
        }
      }
    }
  }
}