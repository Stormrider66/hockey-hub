import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Creates a test database connection
 */
export async function createTestDatabase(
  entities: any[],
  options?: Partial<DataSourceOptions>
): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities,
    ...options,
  } as unknown as DataSourceOptions);

  await dataSource.initialize();
  return dataSource;
}

/**
 * Clears all data from the database
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

/**
 * Seeds the database with test data
 */
export async function seedDatabase(
  dataSource: DataSource,
  seedData: Record<string, any[]>
): Promise<void> {
  for (const [entityName, data] of Object.entries(seedData)) {
    const repository = dataSource.getRepository(entityName);
    await repository.save(data);
  }
}

/**
 * Creates a transaction for testing
 */
export async function withTransaction<T>(
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

/**
 * Test database helper class
 */
export class TestDatabase {
  private dataSource: DataSource | null = null;

  async connect(entities: any[], options?: Partial<DataSourceOptions>): Promise<void> {
    this.dataSource = await createTestDatabase(entities, options);
  }

  async disconnect(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }

  async clear(): Promise<void> {
    if (this.dataSource) {
      await clearDatabase(this.dataSource);
    }
  }

  async seed(seedData: Record<string, any[]>): Promise<void> {
    if (this.dataSource) {
      await seedDatabase(this.dataSource, seedData);
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not connected');
    }
    return this.dataSource;
  }

  getRepository(entityClass: any): any {
    return this.getDataSource().getRepository(entityClass);
  }
}