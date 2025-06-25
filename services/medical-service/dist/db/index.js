"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file (usually in the root)
dotenv_1.default.config({ path: '../../.env' });
// Use specific env vars or fall back to general DB vars
const dbName = process.env.MEDICAL_DB_NAME || process.env.DB_NAME || 'hockeyhub_medical';
const dbUser = process.env.MEDICAL_DB_USER || process.env.DB_USER || 'postgres';
const dbHost = process.env.MEDICAL_DB_HOST || process.env.DB_HOST || 'localhost';
const dbPassword = process.env.MEDICAL_DB_PASSWORD || process.env.DB_PASSWORD || 'password';
const dbPort = parseInt(process.env.MEDICAL_DB_PORT || process.env.DB_PORT || '5432', 10);
// Create a mock database interface for when connection fails
const mockDb = {
    query: (text, params) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[DB Mock] Query would be:', text, params);
        throw new Error('Database connection unavailable - using mock data');
    }),
    getClient: () => __awaiter(void 0, void 0, void 0, function* () {
        throw new Error('Database connection unavailable');
    }),
    pool: null
};
// Initialize database connection
function initializeDatabase() {
    try {
        const pool = new pg_1.Pool({
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
        return {
            query: (text, params) => pool.query(text, params),
            getClient: () => pool.connect(), // To use transactions
            pool: pool // Expose the pool directly if needed
        };
    }
    catch (error) {
        console.warn(`[DB] Failed to connect to database, using mock interface:`, error.message);
        console.log('[DB] Medical service will return mock data when database operations fail');
        return mockDb;
    }
}
const dbInterface = initializeDatabase();
exports.default = dbInterface;
