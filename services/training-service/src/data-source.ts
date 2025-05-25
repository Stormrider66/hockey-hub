import 'dotenv/config'; // Load .env first
import { DataSource, DataSourceOptions } from 'typeorm';
import 'reflect-metadata'; // Required for TypeORM

// Import all entities from the entities directory
// (Ensure these files exist and are correctly defined)
import { Exercise } from './entities/Exercise';
import { TrainingPlan } from './entities/TrainingPlan';
import { TrainingSession } from './entities/TrainingSession';
import { TrainingSessionPhase } from './entities/TrainingSessionPhase';
import { TrainingSessionExercise } from './entities/TrainingSessionExercise';
import { PlayerTrainingLoad } from './entities/PlayerTrainingLoad';
import { TestDefinition } from './entities/TestDefinition';
import { TestResult } from './entities/TestResult';

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DB, // Use DB_NAME from .env
    synchronize: false, // Ensure synchronize is false
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: [
        Exercise,
        TrainingPlan,
        TrainingSession,
        TrainingSessionPhase,
        TrainingSessionExercise,
        PlayerTrainingLoad,
        TestDefinition,
        TestResult,
        'dist/src/entities/**/*.js'
    ],
    migrations: [
        'src/migrations/*.ts',
        'dist/src/migrations/**/*.js'
    ],
    migrationsRun: true,
    subscribers: [],
    connectTimeoutMS: 10000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // namingStrategy: new SnakeNamingStrategy(), // Add later if needed
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;

// Optional initialization logging
AppDataSource.initialize()
    .then(() => {
        console.log('[DB] Training Service: Data Source Initialized!');
    })
    .catch((err) => {
        console.error('[DB] Training Service: Error during Data Source initialization:', err);
    });