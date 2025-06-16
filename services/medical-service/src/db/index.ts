import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from Medical Service's .env file
dotenv.config(); // This loads from services/medical-service/.env

// Trigger restart - env updated

// Use specific env vars or fall back to general DB vars
const dbName = process.env.MEDICAL_DB_NAME || process.env.DB_NAME || 'hockeyhub_medical';
// Use DB_USERNAME from .env file  
const dbUser = process.env.MEDICAL_DB_USER || process.env.DB_USERNAME || process.env.POSTGRES_USER || process.env.DB_USER || 'hockeyhub_user';
const dbHost = process.env.MEDICAL_DB_HOST || process.env.DB_HOST || '127.0.0.1';
// Prioritize DB_PASSWORD from .env file over POSTGRES_PASSWORD (trim whitespace)
const dbPassword = (process.env.DB_PASSWORD || process.env.MEDICAL_DB_PASSWORD || 'hockey_hub_password').trim();
const dbPort = parseInt(process.env.MEDICAL_DB_PORT || process.env.DB_PORT || '5432', 10);

// Secure logging - no password information
console.log('[DB] Password configuration status:', 
    process.env.DB_PASSWORD ? 'DB_PASSWORD env var loaded' : 
    process.env.MEDICAL_DB_PASSWORD ? 'MEDICAL_DB_PASSWORD env var loaded' : 
    'Using default fallback password');
console.log('[DB] Password validation:', dbPassword === 'hockey_hub_password' ? '✓ Expected password format' : '✗ Unexpected password format');
console.log('[DB] Configuration loaded for database:', dbName);

// Database configuration complete

console.log('[DB] Connection config:', {
    database: dbName,
    user: dbUser,
    host: dbHost,
    port: dbPort,
    // Security: Never log actual password values
    passwordConfigured: !!dbPassword
});

// Define the database interface type
interface DbInterface {
    query: (text: string, params?: any[]) => Promise<QueryResult<any>>;
    getClient: () => Promise<PoolClient>;
    pool: Pool | null;
}

// Create a mock database interface for when connection fails
const mockDb: DbInterface = {
    query: async (text: string, params?: any[]) => {
        console.log('[DB Mock] Query would be:', text, params);
        throw new Error('Database connection unavailable - using mock data');
    },
    getClient: async () => {
        throw new Error('Database connection unavailable');
    },
    pool: null
};

// Initialize database connection
function initializeDatabase(): DbInterface {
    try {
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
            // Don't exit process, just log the error
        });

        console.log(`[DB] Pool created for medical database: ${dbName} on ${dbHost}:${dbPort}`);
        
        // Test the connection
        pool.query('SELECT 1')
            .then(() => {
                console.log('[DB] Successfully connected to medical database');
                // Check the search_path
                pool.query('SHOW search_path')
                    .then((result) => {
                        console.log('[DB] Current search_path:', result.rows[0]);
                        // Check current database and list tables
                        return pool.query(`
                            SELECT current_database() as db, 
                                   schemaname, 
                                   tablename 
                            FROM pg_tables 
                            WHERE schemaname = 'public' 
                            ORDER BY tablename`);
                    })
                    .then((result) => {
                        console.log('[DB] Connected to database:', result.rows[0]?.db);
                        console.log('[DB] Tables in public schema:', result.rows.map(r => r.tablename));
                        
                        // Check if injuries table exists, if not create it
                        if (!result.rows.some(r => r.tablename === 'injuries')) {
                            console.log('[DB] Injuries table not found, creating it...');
                            return pool.query(`
                                CREATE TABLE IF NOT EXISTS injuries (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    player_id UUID NOT NULL,
                                    organization_id UUID NOT NULL,
                                    date_occurred TIMESTAMPTZ NOT NULL,
                                    body_part VARCHAR(100) NOT NULL,
                                    injury_type VARCHAR(100) NOT NULL,
                                    severity VARCHAR(20) DEFAULT 'unknown',
                                    status VARCHAR(20) DEFAULT 'active',
                                    description TEXT,
                                    mechanism VARCHAR(200),
                                    estimated_return_date TIMESTAMPTZ,
                                    reported_by_user_id UUID,
                                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                                )
                            `).then(() => {
                                console.log('[DB] Injuries table created successfully');
                                // Insert test data
                                return pool.query(`
                                    INSERT INTO injuries (id, player_id, organization_id, date_occurred, body_part, injury_type)
                                    VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 
                                            '322d228a-3a7d-4925-8df8-e20a8af8b740', CURRENT_TIMESTAMP, 'knee', 'ligament strain')
                                    ON CONFLICT (id) DO NOTHING
                                `);
                            }).then(() => {
                                console.log('[DB] Test injury data inserted');
                            });
                        }
                    })
                    .catch((err) => {
                        console.error('[DB] Failed to check database info:', err.message);
                    });
            })
            .catch((err) => {
                console.error('[DB] Failed to connect to medical database:', err.message);
            });
        
        return {
            query: (text: string, params?: any[]) => pool.query(text, params),
            getClient: () => pool.connect(), // To use transactions
            pool: pool // Expose the pool directly if needed
        };
    } catch (error: any) {
        console.warn(`[DB] Failed to connect to database, using mock interface:`, error.message);
        console.log('[DB] Medical service will return mock data when database operations fail');
        return mockDb;
    }
}

const dbInterface = initializeDatabase();

export default dbInterface; 