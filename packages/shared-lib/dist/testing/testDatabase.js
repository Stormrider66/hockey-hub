"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDatabase = exports.withTransaction = exports.seedDatabase = exports.clearDatabase = exports.createTestDatabase = void 0;
const typeorm_1 = require("typeorm");
/**
 * Creates a test database connection
 */
async function createTestDatabase(entities, options) {
    const dataSource = new typeorm_1.DataSource({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
        entities,
        ...options,
    });
    await dataSource.initialize();
    return dataSource;
}
exports.createTestDatabase = createTestDatabase;
/**
 * Clears all data from the database
 */
async function clearDatabase(dataSource) {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName}`);
    }
}
exports.clearDatabase = clearDatabase;
/**
 * Seeds the database with test data
 */
async function seedDatabase(dataSource, seedData) {
    for (const [entityName, data] of Object.entries(seedData)) {
        const repository = dataSource.getRepository(entityName);
        await repository.save(data);
    }
}
exports.seedDatabase = seedDatabase;
/**
 * Creates a transaction for testing
 */
async function withTransaction(dataSource, work) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const result = await work(queryRunner.manager);
        await queryRunner.commitTransaction();
        return result;
    }
    catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    }
    finally {
        await queryRunner.release();
    }
}
exports.withTransaction = withTransaction;
/**
 * Test database helper class
 */
class TestDatabase {
    constructor() {
        this.dataSource = null;
    }
    async connect(entities, options) {
        this.dataSource = await createTestDatabase(entities, options);
    }
    async disconnect() {
        if (this.dataSource) {
            await this.dataSource.destroy();
            this.dataSource = null;
        }
    }
    async clear() {
        if (this.dataSource) {
            await clearDatabase(this.dataSource);
        }
    }
    async seed(seedData) {
        if (this.dataSource) {
            await seedDatabase(this.dataSource, seedData);
        }
    }
    getDataSource() {
        if (!this.dataSource) {
            throw new Error('Database not connected');
        }
        return this.dataSource;
    }
    getRepository(entityClass) {
        return this.getDataSource().getRepository(entityClass);
    }
}
exports.TestDatabase = TestDatabase;
