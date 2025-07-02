import { DataSource, DataSourceOptions } from 'typeorm';
/**
 * Creates a test database connection
 */
export declare function createTestDatabase(entities: any[], options?: Partial<DataSourceOptions>): Promise<DataSource>;
/**
 * Clears all data from the database
 */
export declare function clearDatabase(dataSource: DataSource): Promise<void>;
/**
 * Seeds the database with test data
 */
export declare function seedDatabase(dataSource: DataSource, seedData: Record<string, any[]>): Promise<void>;
/**
 * Creates a transaction for testing
 */
export declare function withTransaction<T>(dataSource: DataSource, work: (manager: any) => Promise<T>): Promise<T>;
/**
 * Test database helper class
 */
export declare class TestDatabase {
    private dataSource;
    connect(entities: any[], options?: Partial<DataSourceOptions>): Promise<void>;
    disconnect(): Promise<void>;
    clear(): Promise<void>;
    seed(seedData: Record<string, any[]>): Promise<void>;
    getDataSource(): DataSource;
    getRepository<T>(entityClass: any): any;
}
//# sourceMappingURL=testDatabase.d.ts.map