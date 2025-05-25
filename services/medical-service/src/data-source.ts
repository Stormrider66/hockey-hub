import 'dotenv/config'; // Make sure to load .env variables first
import { DataSource, DataSourceOptions } from 'typeorm';
import 'reflect-metadata'; // Required for TypeORM

// Import entities
import { Injury } from './entities/Injury';
import { MedicalNote } from './entities/MedicalNote';
import { PlayerStatusUpdate } from './entities/PlayerStatusUpdate';
import { MedicalAssessment } from './entities/MedicalAssessment';
import { PlayerMedicalJournal } from './entities/PlayerMedicalJournal';

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
        Injury,
        MedicalNote,
        PlayerStatusUpdate,
        MedicalAssessment,
        PlayerMedicalJournal,
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

export const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;

// Optional initialization logging
AppDataSource.initialize()
    .then(() => {
        console.log('[DB] Medical Service: Data Source Initialized!');
    })
    .catch((err) => {
        console.error('[DB] Medical Service: Error during Data Source initialization:', err);
    }); 