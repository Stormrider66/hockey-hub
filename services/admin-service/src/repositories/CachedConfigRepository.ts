import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { SystemConfiguration, ConfigScope, ConfigType } from '../entities/SystemConfiguration';
import { Logger } from '@hockey-hub/shared-lib/utils/Logger';

export class CachedConfigRepository {
  private repository: Repository<SystemConfiguration>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'config:';
  private readonly CACHE_TTL = 3600; // 1 hour for configs

  constructor() {
    this.repository = AppDataSource.getRepository(SystemConfiguration);
    this.logger = new Logger('CachedConfigRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findByKey(key: string, scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string): Promise<SystemConfiguration | null> {
    const cacheKey = this.getCacheKey(`${key}:${scope}:${scopeId || 'global'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for config ${key}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const config = await this.repository.findOne({
      where: { 
        key, 
        scope,
        scopeId: scopeId || undefined,
        isActive: true
      }
    });

    if (config && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(config));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return config;
  }

  async findByCategory(category: string, scope?: ConfigScope, scopeId?: string): Promise<SystemConfiguration[]> {
    const cacheKey = this.getCacheKey(`category:${category}:${scope || 'all'}:${scopeId || 'global'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for category ${category}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('config')
      .where('config.category = :category', { category })
      .andWhere('config.isActive = :isActive', { isActive: true });

    if (scope) {
      query.andWhere('config.scope = :scope', { scope });
    }

    if (scopeId) {
      query.andWhere('(config.scopeId = :scopeId OR config.scopeId IS NULL)', { scopeId });
    }

    const configs = await query
      .orderBy('config.key', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(configs));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return configs;
  }

  async getValue(key: string, scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string): Promise<any> {
    const config = await this.findByKey(key, scope, scopeId);
    
    if (!config) {
      // Try to find at a higher scope level
      if (scope === ConfigScope.USER && scopeId) {
        // Try team level
        return this.getValue(key, ConfigScope.TEAM, scopeId);
      } else if (scope === ConfigScope.TEAM && scopeId) {
        // Try organization level
        return this.getValue(key, ConfigScope.ORGANIZATION, scopeId);
      } else if (scope === ConfigScope.ORGANIZATION) {
        // Try system level
        return this.getValue(key, ConfigScope.SYSTEM);
      }
      
      return null;
    }

    return config.getValue();
  }

  async getMultiple(keys: string[], scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    // Use Promise.all for parallel fetching
    const configs = await Promise.all(
      keys.map(key => this.findByKey(key, scope, scopeId))
    );

    keys.forEach((key, index) => {
      const config = configs[index];
      result[key] = config ? config.getValue() : null;
    });

    return result;
  }

  async getPublicConfigs(organizationId?: string): Promise<SystemConfiguration[]> {
    const cacheKey = this.getCacheKey(`public:${organizationId || 'global'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for public configs');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('config')
      .where('config.isActive = :isActive', { isActive: true })
      .andWhere('config.isPublic = :isPublic', { isPublic: true });

    if (organizationId) {
      query.andWhere('(config.scopeId = :organizationId OR config.scope = :systemScope)', {
        organizationId,
        systemScope: ConfigScope.SYSTEM
      });
    } else {
      query.andWhere('config.scope = :scope', { scope: ConfigScope.SYSTEM });
    }

    const configs = await query
      .orderBy('config.category', 'ASC')
      .addOrderBy('config.key', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(configs));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return configs;
  }

  async set(key: string, value: any, scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string): Promise<SystemConfiguration> {
    let config = await this.repository.findOne({
      where: { key, scope, scopeId: scopeId || undefined }
    });

    if (config) {
      if (config.isReadOnly) {
        throw new Error(`Configuration ${key} is read-only`);
      }

      if (!config.isValid(value)) {
        throw new Error(`Invalid value for configuration ${key}`);
      }

      config.setValue(value);
      await this.repository.save(config);
    } else {
      config = this.repository.create({
        key,
        scope,
        scopeId,
        type: this.detectType(value),
        category: 'custom',
        isActive: true
      });
      config.setValue(value);
      config = await this.repository.save(config);
    }

    await this.invalidateCache(config);
    return config;
  }

  async bulkSet(configs: Array<{ key: string; value: any; scope?: ConfigScope; scopeId?: string }>): Promise<void> {
    const operations = configs.map(({ key, value, scope, scopeId }) => 
      this.set(key, value, scope || ConfigScope.SYSTEM, scopeId)
    );

    await Promise.all(operations);
  }

  private detectType(value: any): ConfigType {
    if (typeof value === 'boolean') return ConfigType.BOOLEAN;
    if (typeof value === 'number') return ConfigType.NUMBER;
    if (typeof value === 'object') return ConfigType.JSON;
    return ConfigType.STRING;
  }

  private async invalidateCache(config: SystemConfiguration): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`${config.key}:${config.scope}:${config.scopeId || 'global'}`),
        this.getCacheKey(`category:${config.category}:${config.scope}:${config.scopeId || 'global'}`),
        this.getCacheKey(`category:${config.category}:all:${config.scopeId || 'global'}`),
        this.getCacheKey(`public:${config.scopeId || 'global'}`),
        this.getCacheKey('public:global')
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for config ${config.key}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  async getFeatureFlags(organizationId?: string): Promise<Record<string, boolean>> {
    const cacheKey = this.getCacheKey(`features:${organizationId || 'global'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for feature flags');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const configs = await this.findByCategory('features', ConfigScope.ORGANIZATION, organizationId);
    const systemFeatures = await this.findByCategory('features', ConfigScope.SYSTEM);

    const features: Record<string, boolean> = {};

    // System features first (can be overridden)
    systemFeatures.forEach(config => {
      if (config.type === ConfigType.BOOLEAN) {
        features[config.key] = config.getValue();
      }
    });

    // Organization features override system
    configs.forEach(config => {
      if (config.type === ConfigType.BOOLEAN) {
        features[config.key] = config.getValue();
      }
    });

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(features)); // 5 minutes for features
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return features;
  }
}