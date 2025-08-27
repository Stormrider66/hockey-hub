import { CacheManager } from './CacheManager';
export declare function setGlobalCacheManager(manager: CacheManager): void;
export declare function getGlobalCacheManager(): CacheManager | null;
export interface CacheOptions {
    ttl?: number;
    key?: string | ((target: any, propertyKey: string, ...args: any[]) => string);
    tags?: string[];
    condition?: (...args: any[]) => boolean;
}
export declare function Cacheable(options?: CacheOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function CacheEvict(options?: CacheOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function CachePut(options?: CacheOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class CacheKeyBuilder {
    private parts;
    static create(): CacheKeyBuilder;
    add(part: string | number | boolean): CacheKeyBuilder;
    addIf(condition: boolean, part: string | number): CacheKeyBuilder;
    build(): string;
}
export declare const CacheTags: {
    readonly USER: (userId: string) => string;
    readonly ORGANIZATION: (orgId: string) => string;
    readonly TEAM: (teamId: string) => string;
    readonly PLAYER: (playerId: string) => string;
    readonly WORKOUT: (workoutId: string) => string;
    readonly ALL_USERS: "all-users";
    readonly ALL_TEAMS: "all-teams";
    readonly ALL_ORGANIZATIONS: "all-organizations";
};
//# sourceMappingURL=decorators.d.ts.map