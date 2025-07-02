import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { CachedRepository, CacheTags } from '@hockey-hub/shared-lib';

/**
 * Cached User Repository
 * Provides caching for user-related database operations
 */
export class CachedUserRepository extends CachedRepository<User> {
  constructor() {
    const repository = AppDataSource.getRepository(User);
    super(repository, 'user', 300); // 5 minutes default TTL
  }

  /**
   * Find user by email with caching
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne(
      {
        where: { email },
        relations: ['organization', 'teams', 'roles']
      },
      {
        key: `user:email:${email}`,
        ttl: 600, // 10 minutes for email lookups
        tags: [`user:email:${email}`]
      }
    );
  }

  /**
   * Find users by organization with caching
   */
  async findByOrganization(organizationId: string, options?: {
    skip?: number;
    take?: number;
    includeDeleted?: boolean;
  }): Promise<{ users: User[]; total: number }> {
    const skip = options?.skip || 0;
    const take = options?.take || 20;
    
    const queryBuilder = this.repository.createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'teams')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.organizationId = :organizationId', { organizationId });
    
    if (!options?.includeDeleted) {
      queryBuilder.andWhere('user.deletedAt IS NULL');
    }
    
    // Get total count
    const total = await this.count(
      {
        where: { organizationId }
      },
      {
        key: `user:org:${organizationId}:count`,
        ttl: 60, // 1 minute for counts
        tags: [`org:${organizationId}`]
      }
    );
    
    // Get users
    const users = await this.executeQuery<User[]>(
      queryBuilder.skip(skip).take(take),
      {
        key: `user:org:${organizationId}:list:${skip}:${take}`,
        ttl: 120, // 2 minutes for lists
        tags: [`org:${organizationId}`],
        type: 'getMany'
      }
    );
    
    return { users, total };
  }

  /**
   * Find users by team with caching
   */
  async findByTeam(teamId: string): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user')
      .leftJoinAndSelect('user.teams', 'teams')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('teams.id = :teamId', { teamId })
      .andWhere('user.deletedAt IS NULL');
    
    return this.executeQuery<User[]>(
      queryBuilder,
      {
        key: `user:team:${teamId}:list`,
        ttl: 180, // 3 minutes
        tags: [`team:${teamId}`],
        type: 'getMany'
      }
    );
  }

  /**
   * Save user and invalidate related caches
   */
  async saveUser(user: User): Promise<User> {
    const tags: string[] = [
      `user:${user.id}`,
      `user:email:${user.email}`
    ];
    
    if (user.organizationId) {
      tags.push(`org:${user.organizationId}`);
    }
    
    if (user.teams && user.teams.length > 0) {
      user.teams.forEach(team => {
        tags.push(`team:${team.id}`);
      });
    }
    
    return this.save(user, tags);
  }

  /**
   * Delete user and invalidate related caches
   */
  async deleteUser(user: User): Promise<void> {
    user.deletedAt = new Date();
    await this.saveUser(user);
  }

  /**
   * Get user statistics with caching
   */
  async getUserStats(organizationId?: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
  }> {
    const cacheKey = organizationId 
      ? `user:stats:org:${organizationId}`
      : 'user:stats:global';
    
    const queryBuilder = this.repository.createQueryBuilder('user')
      .leftJoin('user.roles', 'roles')
      .select('roles.name', 'role')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .where('user.deletedAt IS NULL')
      .groupBy('roles.name');
    
    if (organizationId) {
      queryBuilder.andWhere('user.organizationId = :organizationId', { organizationId });
    }
    
    const roleStats = await this.executeQuery<Array<{ role: string; count: string }>>(
      queryBuilder,
      {
        key: `${cacheKey}:roles`,
        ttl: 300, // 5 minutes
        type: 'getRawMany'
      }
    );
    
    const usersByRole: Record<string, number> = {};
    roleStats.forEach(stat => {
      usersByRole[stat.role] = parseInt(stat.count);
    });
    
    const totalUsers = await this.count(
      organizationId ? { where: { organizationId } } : undefined,
      {
        key: `${cacheKey}:total`,
        ttl: 300
      }
    );
    
    const activeUsers = await this.count(
      {
        where: {
          ...(organizationId && { organizationId }),
          isActive: true,
          deletedAt: null
        }
      },
      {
        key: `${cacheKey}:active`,
        ttl: 300
      }
    );
    
    return {
      totalUsers,
      activeUsers,
      usersByRole
    };
  }
}