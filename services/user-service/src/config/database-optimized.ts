import { DataSource, DataSourceOptions } from 'typeorm';
import * as entities from '../entities';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const baseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_users',
  entities: Object.values(entities),
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../subscribers/*{.ts,.js}')],
  
  // Connection pooling
  extra: {
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of clients in pool
    min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum number of clients in pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // Return error after 10 seconds if connection cannot be established
    
    // Statement timeout
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
    
    // Query timeout
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30 seconds
  },
  
  // TypeORM specific optimizations
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    duration: parseInt(process.env.CACHE_DURATION || '60000'), // 1 minute default
  },
  
  // Logging configuration
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  logger: 'advanced-console',
  
  // Performance settings
  synchronize: false, // Never in production
  dropSchema: false,
  migrationsRun: process.env.NODE_ENV === 'production',
  migrationsTransactionMode: 'each',
  
  // Connection retry logic
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),
  
  // Enable query result caching
  maxQueryExecutionTime: parseInt(process.env.DB_MAX_QUERY_TIME || '1000'), // Log queries taking more than 1 second
};

// Environment-specific configurations
const environmentConfig: Partial<DataSourceOptions> = {
  development: {
    logging: ['query', 'error', 'warn', 'info', 'log'],
    maxQueryExecutionTime: 500, // More aggressive in development
  },
  test: {
    logging: false,
    cache: false, // Disable caching in tests
  },
  production: {
    logging: ['error', 'warn'],
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : undefined,
  },
}[process.env.NODE_ENV || 'development'] || {};

// Merge configurations
const config: DataSourceOptions = {
  ...baseConfig,
  ...environmentConfig,
};

export const OptimizedDataSource = new DataSource(config);

// Connection management utilities
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private dataSource: DataSource;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  static getInstance(dataSource: DataSource = OptimizedDataSource): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager(dataSource);
    }
    return DatabaseConnectionManager.instance;
  }

  async connect(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log('Database connection established');
        this.setupHealthCheck();
      }
    } catch (error) {
      console.error('Failed to connect to database:', error);
      await this.handleConnectionError();
    }
  }

  async disconnect(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      console.log('Database connection closed');
    }
  }

  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      await this.connect();
    } else {
      throw new Error('Max reconnection attempts reached');
    }
  }

  private setupHealthCheck(): void {
    // Periodic health check
    setInterval(async () => {
      try {
        await this.dataSource.query('SELECT 1');
      } catch (error) {
        console.error('Database health check failed:', error);
        await this.handleConnectionError();
      }
    }, 60000); // Check every minute
  }

  async getConnectionStats() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      // Get PostgreSQL connection stats
      const stats = await queryRunner.query(`
        SELECT 
          numbackends as active_connections,
          xact_commit as committed_transactions,
          xact_rollback as rolled_back_transactions,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as rows_returned,
          tup_fetched as rows_fetched,
          tup_inserted as rows_inserted,
          tup_updated as rows_updated,
          tup_deleted as rows_deleted
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

      // Get connection pool stats if available
      const poolStats = (this.dataSource.driver as any).master?._clients?.length || 0;

      return {
        database: stats[0],
        pool: {
          size: poolStats,
          available: (this.dataSource.driver as any).master?._idleClients?.length || 0,
        },
      };
    } finally {
      await queryRunner.release();
    }
  }
}

// Query performance monitoring
export class QueryPerformanceMonitor {
  private static slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  static logSlowQuery(query: string, duration: number) {
    this.slowQueries.push({
      query,
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }
  }

  static getSlowQueries(limit: number = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  static clearSlowQueries() {
    this.slowQueries = [];
  }
}