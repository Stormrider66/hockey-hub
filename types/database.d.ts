/**
 * Database and ORM type definitions
 */

import { DataSource, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';

// TypeORM augmentations
declare module 'typeorm' {
  interface Repository<Entity> {
    findByIds(ids: any[]): Promise<Entity[]>;
    findOneById(id: any): Promise<Entity | null>;
    findAndCountByIds(ids: any[]): Promise<[Entity[], number]>;
  }
  
  interface SelectQueryBuilder<Entity> {
    cache(cacheKey: string, ttl?: number): this;
    paginate(page: number, limit: number): this;
  }
}

// Redis types
declare module 'redis' {
  interface RedisClientType {
    hgetallBuffer(key: string): Promise<Record<string, Buffer>>;
    pipeline(): Pipeline;
  }
  
  interface Pipeline {
    hset(key: string, field: string, value: string): Pipeline;
    expire(key: string, seconds: number): Pipeline;
    exec(): Promise<Array<[Error | null, any]>>;
  }
}

// Database configuration types
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean | 'all' | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log')[];
  entities: string[];
  migrations?: string[];
  subscribers?: string[];
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  poolSize?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  maxUses?: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  family?: 4 | 6;
  keepAlive?: number;
  compression?: 'gzip' | 'deflate';
}

// Database connection types
interface DatabaseConnection {
  dataSource: DataSource;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  runMigrations(): Promise<void>;
  dropDatabase(): Promise<void>;
  query(sql: string, parameters?: any[]): Promise<any>;
  transaction<T>(fn: (queryRunner: QueryRunner) => Promise<T>): Promise<T>;
}

interface CacheConnection {
  client: any; // Redis client type
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
  pipeline(): any; // Redis pipeline
}

// Repository patterns
interface CachedRepository<T> extends Repository<T> {
  findByIdCached(id: string | number, ttl?: number): Promise<T | null>;
  findAllCached(ttl?: number): Promise<T[]>;
  invalidateCache(id?: string | number): Promise<void>;
  setCacheKey(key: string): string;
}

interface AuditableRepository<T> extends Repository<T> {
  findWithAudit(id: string | number): Promise<T & AuditInfo | null>;
  findAllWithAudit(): Promise<(T & AuditInfo)[]>;
  softDelete(id: string | number, userId: string): Promise<void>;
  restore(id: string | number, userId: string): Promise<void>;
}

// Audit trail types
interface AuditInfo {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
  version: number;
}

interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  correlationId?: string;
}

// Migration types
interface MigrationInfo {
  name: string;
  timestamp: number;
  executed: boolean;
  executedAt?: Date;
  executionTime?: number;
}

// Database seeding types
interface SeederOptions {
  environment: 'development' | 'test' | 'production';
  override?: boolean;
  tables?: string[];
}

interface SeedData<T = any> {
  table: string;
  data: T[];
  dependencies?: string[];
  override?: boolean;
}

// Query builder helpers
interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'nin' | 'between';
  value: any;
  values?: any[]; // For 'in', 'nin', 'between' operators
}

interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions[];
  filters?: FilterOptions[];
  search?: {
    query: string;
    fields: string[];
  };
  include?: string[]; // Relations to include
  select?: string[]; // Fields to select
}

// Database error types
interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
  sql?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

interface ValidationError extends Error {
  field: string;
  value: any;
  constraints: Record<string, string>;
}

// Connection pool types
interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

interface PoolStats {
  size: number;
  available: number;
  borrowed: number;
  invalid: number;
  pending: number;
}

// Export all types
export {
  DatabaseConfig,
  RedisConfig,
  DatabaseConnection,
  CacheConnection,
  CachedRepository,
  AuditableRepository,
  AuditInfo,
  AuditLog,
  MigrationInfo,
  SeederOptions,
  SeedData,
  PaginationOptions,
  PaginatedResult,
  SortOptions,
  FilterOptions,
  QueryOptions,
  DatabaseError,
  ValidationError,
  PoolConfig,
  PoolStats,
};