import { DataSource } from 'typeorm';
import * as entities from '../../entities';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5435'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_communication_test',
  synchronize: true, // Auto-create tables for tests
  dropSchema: true, // Drop schema before each test run
  logging: false,
  entities: Object.values(entities),
});

export async function setupTestDatabase() {
  try {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
    await TestDataSource.synchronize(true);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  try {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
}

export async function clearDatabase() {
  const entities = TestDataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE`);
  }
}