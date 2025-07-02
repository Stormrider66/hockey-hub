import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: '.env.test' });

/**
 * Base configuration for test databases
 */
const baseTestConfig: Partial<DataSourceOptions> = {
  type: 'postgres',
  synchronize: true,
  logging: false,
  dropSchema: true, // Drop schema before each test run
  entities: [],
  migrations: [],
  subscribers: [],
};

/**
 * Service-specific test database configurations
 */
export const testDatabaseConfigs = {
  'user-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'user_service_test',
  },
  'calendar-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5435,
    username: 'postgres',
    password: 'postgres',
    database: 'calendar_service_test',
  },
  'training-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5436,
    username: 'postgres',
    password: 'postgres',
    database: 'training_service_test',
  },
  'medical-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5437,
    username: 'postgres',
    password: 'postgres',
    database: 'medical_service_test',
  },
  'planning-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5438,
    username: 'postgres',
    password: 'postgres',
    database: 'planning_service_test',
  },
  'statistics-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5439,
    username: 'postgres',
    password: 'postgres',
    database: 'statistics_service_test',
  },
  'payment-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5440,
    username: 'postgres',
    password: 'postgres',
    database: 'payment_service_test',
  },
  'admin-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5441,
    username: 'postgres',
    password: 'postgres',
    database: 'admin_service_test',
  },
  'communication-service': {
    ...baseTestConfig,
    host: process.env.DB_HOST || 'localhost',
    port: 5434,
    username: 'postgres',
    password: 'postgres',
    database: 'communication_service_test',
  },
};

/**
 * Factory class for creating test database connections
 */
export class TestDatabaseFactory {
  private static instances: Map<string, DataSource> = new Map();

  /**
   * Get or create a test database connection for a service
   */
  static async create(
    serviceName: keyof typeof testDatabaseConfigs,
    entities: any[],
    customConfig?: Partial<DataSourceOptions>
  ): Promise<DataSource> {
    const key = `${serviceName}-${entities.length}`;
    
    // Return existing instance if available
    if (this.instances.has(key)) {
      const instance = this.instances.get(key)!;
      if (instance.isInitialized) {
        return instance;
      }
    }

    // Create new instance
    const config = {
      ...testDatabaseConfigs[serviceName],
      entities,
      ...customConfig,
    };

    const dataSource = new DataSource(config as DataSourceOptions);
    await dataSource.initialize();
    
    this.instances.set(key, dataSource);
    return dataSource;
  }

  /**
   * Close all test database connections
   */
  static async closeAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(async (ds) => {
      if (ds.isInitialized) {
        await ds.destroy();
      }
    });
    
    await Promise.all(promises);
    this.instances.clear();
  }

  /**
   * Close a specific test database connection
   */
  static async close(serviceName: string): Promise<void> {
    const instancesToClose = Array.from(this.instances.entries())
      .filter(([key]) => key.startsWith(serviceName))
      .map(([key, ds]) => ({ key, ds }));

    for (const { key, ds } of instancesToClose) {
      if (ds.isInitialized) {
        await ds.destroy();
      }
      this.instances.delete(key);
    }
  }

  /**
   * Reset a test database (drop and recreate schema)
   */
  static async reset(dataSource: DataSource): Promise<void> {
    if (!dataSource.isInitialized) {
      throw new Error('DataSource is not initialized');
    }

    // Drop all tables
    await dataSource.dropDatabase();
    
    // Recreate schema
    await dataSource.synchronize();
  }

  /**
   * Seed a test database with data
   */
  static async seed(
    dataSource: DataSource,
    seedData: { entity: any; data: any[] }[]
  ): Promise<void> {
    for (const { entity, data } of seedData) {
      const repository = dataSource.getRepository(entity);
      await repository.save(data);
    }
  }

  /**
   * Create a transaction for testing
   */
  static async transaction<T>(
    dataSource: DataSource,
    work: (manager: any) => Promise<T>
  ): Promise<T> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

/**
 * Jest lifecycle hooks for test databases
 */
export const setupTestDatabase = (
  serviceName: keyof typeof testDatabaseConfigs,
  entities: any[]
) => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await TestDatabaseFactory.create(serviceName, entities);
  });

  beforeEach(async () => {
    await TestDatabaseFactory.reset(dataSource);
  });

  afterAll(async () => {
    await TestDatabaseFactory.close(serviceName);
  });

  return {
    getDataSource: () => dataSource,
    getRepository: <T>(entity: any) => dataSource.getRepository<T>(entity),
  };
};