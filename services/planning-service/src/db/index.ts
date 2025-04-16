import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' }); 

// Use specific env vars or fall back to general DB vars
const dbName = process.env.PLANNING_DB_NAME || process.env.DB_NAME || 'hockeyhub_planning';
const dbUser = process.env.PLANNING_DB_USER || process.env.DB_USER || 'postgres';
const dbHost = process.env.PLANNING_DB_HOST || process.env.DB_HOST || 'localhost';
const dbPassword = process.env.PLANNING_DB_PASSWORD || process.env.DB_PASSWORD || 'password';
const dbPort = parseInt(process.env.PLANNING_DB_PORT || process.env.DB_PORT || '5432', 10);

const pool = new Pool({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: dbPort,
    max: 20, 
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 2000, 
});

pool.on('connect', () => {
    console.log('[DB] New client connected to the planning pool');
});

pool.on('error', (err, _client) => {
    console.error('[DB] Unexpected error on idle planning client', err);
    // process.exit(-1);
});

console.log(`[DB] Pool created for planning database: ${dbName} on ${dbHost}:${dbPort}`);

export default {
    query: (text: string, params?: any[]) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool: pool
}; 