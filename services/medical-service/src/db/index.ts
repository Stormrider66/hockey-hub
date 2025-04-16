import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file (usually in the root)
dotenv.config({ path: '../../.env' }); 

// Use specific env vars or fall back to general DB vars
const dbName = process.env.MEDICAL_DB_NAME || process.env.DB_NAME || 'hockeyhub_medical';
const dbUser = process.env.MEDICAL_DB_USER || process.env.DB_USER || 'postgres';
const dbHost = process.env.MEDICAL_DB_HOST || process.env.DB_HOST || 'localhost';
const dbPassword = process.env.MEDICAL_DB_PASSWORD || process.env.DB_PASSWORD || 'password';
const dbPort = parseInt(process.env.MEDICAL_DB_PORT || process.env.DB_PORT || '5432', 10);

const pool = new Pool({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: dbPort,
    max: 20, // Max number of clients in the pool
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 2000, 
});

pool.on('connect', () => {
    console.log('[DB] New client connected to the medical pool');
});

pool.on('error', (err, _client) => {
    console.error('[DB] Unexpected error on idle medical client', err);
    // Consider if you want to exit the process on critical DB errors
    // process.exit(-1);
});

console.log(`[DB] Pool created for medical database: ${dbName} on ${dbHost}:${dbPort}`);

export default {
    query: (text: string, params?: any[]) => pool.query(text, params),
    getClient: () => pool.connect(), // To use transactions
    pool: pool // Expose the pool directly if needed
}; 