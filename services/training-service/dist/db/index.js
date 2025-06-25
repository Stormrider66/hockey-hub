"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file (usually in the root)
dotenv_1.default.config({ path: '../../.env' });
// Use specific env vars or fall back to general DB vars
const dbName = process.env.TRAINING_DB_NAME || process.env.DB_NAME || 'hockeyhub_training';
const dbUser = process.env.TRAINING_DB_USER || process.env.DB_USER || 'postgres';
const dbHost = process.env.TRAINING_DB_HOST || process.env.DB_HOST || 'localhost';
const dbPassword = process.env.TRAINING_DB_PASSWORD || process.env.DB_PASSWORD || 'password';
const dbPort = parseInt(process.env.TRAINING_DB_PORT || process.env.DB_PORT || '5432', 10);
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
    console.log('[DB] New client connected to the training pool');
});
pool.on('error', (err, _client) => {
    console.error('[DB] Unexpected error on idle training client', err);
    // Consider if you want to exit the process on critical DB errors
    // process.exit(-1);
});
console.log(`[DB] Pool created for training database: ${dbName} on ${dbHost}:${dbPort}`);
exports.default = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(), // To use transactions
    pool: pool // Expose the pool directly if needed
};
