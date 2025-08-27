import { CacheManager } from './index';
export interface CacheConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    ttl?: number;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    enableOfflineQueue?: boolean;
}
/**
 * Initialize cache manager with Redis
 * Falls back to in-memory cache if Redis is not available
 */
export declare function initializeCache(config?: Partial<CacheConfig>): Promise<CacheManager>;
/**
 * Get the global cache manager instance
 */
export declare function getCacheManager(): CacheManager;
/**
 * Close the cache connection
 */
export declare function closeCache(): Promise<void>;
/**
 * Common cache key generators
 */
export declare const CacheKeys: {
    user: (id: string) => string;
    userByEmail: (email: string) => string;
    userPermissions: (userId: string) => string;
    userRoles: (userId: string) => string;
    userSessions: (userId: string) => string;
    organization: (id: string) => string;
    organizationTeams: (orgId: string) => string;
    organizationUsers: (orgId: string) => string;
    team: (id: string) => string;
    teamPlayers: (teamId: string) => string;
    teamCoaches: (teamId: string) => string;
    teamSchedule: (teamId: string) => string;
    trainingSession: (id: string) => string;
    trainingTemplate: (id: string) => string;
    userTrainingSessions: (userId: string) => string;
    event: (id: string) => string;
    userEvents: (userId: string, date?: string) => string;
    teamEvents: (teamId: string, date?: string) => string;
    playerStats: (playerId: string, season?: string) => string;
    teamStats: (teamId: string, season?: string) => string;
    list: (entity: string, filters?: Record<string, any>) => string;
    count: (entity: string, filters?: Record<string, any>) => string;
};
/**
 * Common cache tags for invalidation
 */
export declare const CacheTags: {
    user: (id: string) => string[];
    organization: (id: string) => string[];
    team: (id: string) => string[];
    training: (sessionId: string) => string[];
    calendar: (eventId: string) => string[];
    userAll: (userId: string) => string[];
    organizationAll: (orgId: string) => string[];
    teamAll: (teamId: string) => string[];
};
//# sourceMappingURL=cacheConfig.d.ts.map