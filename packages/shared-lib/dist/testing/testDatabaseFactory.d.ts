/// <reference types="node" />
import { DataSource, DataSourceOptions } from 'typeorm';
/**
 * Service-specific test database configurations
 */
export declare const testDatabaseConfigs: {
    'user-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'calendar-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'training-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'medical-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'planning-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'statistics-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'payment-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'admin-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
    'communication-service': {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        type?: "postgres" | undefined;
        schema?: string | undefined;
        driver?: any;
        nativeDriver?: any;
        useUTC?: boolean | undefined;
        replication?: {
            readonly master: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions;
            readonly slaves: import("typeorm/driver/postgres/PostgresConnectionCredentialsOptions").PostgresConnectionCredentialsOptions[];
            readonly defaultMode?: import("typeorm").ReplicationMode | undefined;
        } | undefined;
        connectTimeoutMS?: number | undefined;
        uuidExtension?: "pgcrypto" | "uuid-ossp" | undefined;
        poolErrorHandler?: ((err: any) => any) | undefined;
        logNotifications?: boolean | undefined;
        installExtensions?: boolean | undefined;
        parseInt8?: boolean | undefined;
        name?: string | undefined;
        entities?: import("typeorm").MixedList<string | Function | import("typeorm").EntitySchema<any>> | undefined;
        subscribers?: import("typeorm").MixedList<string | Function> | undefined;
        migrations?: import("typeorm").MixedList<string | Function> | undefined;
        migrationsTableName?: string | undefined;
        migrationsTransactionMode?: "all" | "each" | "none" | undefined;
        metadataTableName?: string | undefined;
        namingStrategy?: import("typeorm").NamingStrategyInterface | undefined;
        logging?: import("typeorm").LoggerOptions | undefined;
        logger?: "debug" | "advanced-console" | "simple-console" | "formatted-console" | "file" | import("typeorm").Logger | undefined;
        maxQueryExecutionTime?: number | undefined;
        poolSize?: number | undefined;
        synchronize?: boolean | undefined;
        migrationsRun?: boolean | undefined;
        dropSchema?: boolean | undefined;
        entityPrefix?: string | undefined;
        entitySkipConstructor?: boolean | undefined;
        extra?: any;
        relationLoadStrategy?: "join" | "query" | undefined;
        typename?: string | undefined;
        cache?: boolean | {
            readonly type?: "database" | "redis" | "ioredis" | "ioredis/cluster" | undefined;
            readonly provider?: ((connection: DataSource) => import("typeorm/cache/QueryResultCache").QueryResultCache) | undefined;
            readonly tableName?: string | undefined;
            readonly options?: any;
            readonly alwaysEnabled?: boolean | undefined;
            readonly duration?: number | undefined;
            readonly ignoreErrors?: boolean | undefined;
        } | undefined;
        isolateWhereStatements?: boolean | undefined;
        url?: string | undefined;
        ssl?: boolean | import("tls").TlsOptions | undefined;
        applicationName?: string | undefined;
    };
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
    getRepository: <T>(entity: any) => import("typeorm").Repository<T>;
};
//# sourceMappingURL=testDatabaseFactory.d.ts.map