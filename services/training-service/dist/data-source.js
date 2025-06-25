"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config"); // Load .env first
const typeorm_1 = require("typeorm");
require("reflect-metadata"); // Required for TypeORM
// Import all entities from the entities directory
// (Ensure these files exist and are correctly defined)
const Exercise_1 = require("./entities/Exercise");
const TrainingPlan_1 = require("./entities/TrainingPlan");
const TrainingSession_1 = require("./entities/TrainingSession");
const TrainingSessionPhase_1 = require("./entities/TrainingSessionPhase");
const TrainingSessionExercise_1 = require("./entities/TrainingSessionExercise");
const PlayerTrainingLoad_1 = require("./entities/PlayerTrainingLoad");
const TestDefinition_1 = require("./entities/TestDefinition");
const TestResult_1 = require("./entities/TestResult");
const dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DB, // Use DB_NAME from .env
    synchronize: false, // Ensure synchronize is false
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: [
        Exercise_1.Exercise,
        TrainingPlan_1.TrainingPlan,
        TrainingSession_1.TrainingSession,
        TrainingSessionPhase_1.TrainingSessionPhase,
        TrainingSessionExercise_1.TrainingSessionExercise,
        PlayerTrainingLoad_1.PlayerTrainingLoad,
        TestDefinition_1.TestDefinition,
        TestResult_1.TestResult,
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
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
exports.default = exports.AppDataSource;
// Optional initialization logging
exports.AppDataSource.initialize()
    .then(() => {
    console.log('[DB] Training Service: Data Source Initialized!');
})
    .catch((err) => {
    console.error('[DB] Training Service: Error during Data Source initialization:', err);
});
