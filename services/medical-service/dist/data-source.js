"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config"); // Make sure to load .env variables first
const typeorm_1 = require("typeorm");
require("reflect-metadata"); // Required for TypeORM
// Import entities
const Injury_1 = require("./entities/Injury");
const InjuryUpdate_1 = require("./entities/InjuryUpdate");
const MedicalNote_1 = require("./entities/MedicalNote");
const PlayerStatusUpdate_1 = require("./entities/PlayerStatusUpdate");
const MedicalAssessment_1 = require("./entities/MedicalAssessment");
const PlayerMedicalJournal_1 = require("./entities/PlayerMedicalJournal");
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
        Injury_1.Injury,
        InjuryUpdate_1.InjuryUpdate,
        MedicalNote_1.MedicalNote,
        PlayerStatusUpdate_1.PlayerStatusUpdate,
        MedicalAssessment_1.MedicalAssessment,
        PlayerMedicalJournal_1.PlayerMedicalJournal,
        'dist/src/entities/**/*.js'
    ],
    migrations: [
        'dist/src/migrations/**/*.js'
    ],
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
    console.log('[DB] Medical Service: Data Source Initialized!');
})
    .catch((err) => {
    console.error('[DB] Medical Service: Error during Data Source initialization:', err);
});
