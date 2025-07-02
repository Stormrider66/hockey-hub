import { DataSource, DataSourceOptions } from 'typeorm';
/**
 * Service-specific test database configurations
 */
export declare const testDatabaseConfigs: {
    'user-service': any;
    'calendar-service': any;
    'training-service': any;
    'medical-service': any;
    'planning-service': any;
    'statistics-service': any;
    'payment-service': any;
    'admin-service': any;
    'communication-service': any;
};
/**
 * Factory class for creating test database connections
 */
export declare class TestDatabaseFactory {
    private static instances;
    /**
     * Get or create a test database connection for a service
     */
    static create(serviceName: keyof typeof testDatabaseConfigs, entities: any[], customConfig?: Partial<DataSourceOptions>): Promise<DataSource>;
    /**
     * Close all test database connections
     */
    static closeAll(): Promise<void>;
    /**
     * Close a specific test database connection
     */
    static close(serviceName: string): Promise<void>;
    /**
     * Reset a test database (drop and recreate schema)
     */
    static reset(dataSource: DataSource): Promise<void>;
    /**
     * Seed a test database with data
     */
    static seed(dataSource: DataSource, seedData: {
        entity: any;
        data: any[];
    }[]): Promise<void>;
    /**
     * Create a transaction for testing
     */
    static transaction<T>(dataSource: DataSource, work: (manager: any) => Promise<T>): Promise<T>;
}
/**
 * Jest lifecycle hooks for test databases
 */
export declare const setupTestDatabase: (serviceName: keyof typeof testDatabaseConfigs, entities: any[]) => {
    getDataSource: () => DataSource;
    getRepository: <T>(entity: any) => any;
};
//# sourceMappingURL=testDatabaseFactory.d.ts.map