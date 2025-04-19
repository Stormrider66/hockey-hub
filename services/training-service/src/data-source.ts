import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { PhysicalSessionTemplate } from './entities/PhysicalSessionTemplate';
import { PhysicalSessionCategory } from './entities/PhysicalSessionCategory';
import { Exercise } from './entities/Exercise';
import { ScheduledPhysicalSession } from './entities/ScheduledPhysicalSession';
import { TestDefinition } from './entities/TestDefinition';
import { TestNormValue } from './entities/TestNormValue';
import { TestResult } from './entities/TestResult';
import { TestBatch } from './entities/TestBatch';
import { SessionAttendance } from './entities/SessionAttendance';

dotenv.config();

// Ensure environment variables are loaded or provide defaults
const dbHost = process.env.DB_HOST || 'db'; // Use 'db' for Docker service name
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbUsername = process.env.DB_USERNAME || 'hockeyhub_user';
const dbPassword = process.env.DB_PASSWORD || 'hockeyhub_password';
const dbName = process.env.DB_NAME || 'hockeyhub_dev';
const isDevelopment = process.env.NODE_ENV === 'development';

console.log(`Connecting to DB: ${dbUsername}@${dbHost}:${dbPort}/${dbName}`); // Add logging

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    synchronize: isDevelopment, // Use migrations in production
    logging: isDevelopment,
    entities: [
        PhysicalSessionTemplate,
        PhysicalSessionCategory,
        Exercise,
        ScheduledPhysicalSession,
        TestDefinition,
        TestNormValue,
        TestResult,
        TestBatch,
        SessionAttendance
        // Add other entities here as they are created
    ],
    migrations: [], // Define migrations path later
    subscribers: [],
    connectTimeoutMS: 10000, // Add connection timeout
});