"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file (usually in the root)
// Adjust the path if your .env file is located elsewhere relative to this service
dotenv_1.default.config({ path: '../../.env' });
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hockeyhub_calendar', // Make sure this database exists
    password: process.env.DB_PASSWORD || 'password', // Replace with your actual default password if needed
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: 20, // Max number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection acquisition before timing out
});
pool.on('connect', () => {
    console.log('[DB] New client connected to the pool');
});
pool.on('error', (err, _client) => {
    console.error('[DB] Unexpected error on idle client', err);
    // Optional: Decide if you want to exit the process on critical DB errors
    // process.exit(-1);
});
console.log(`[DB] Pool created for database: ${process.env.DB_NAME || 'hockeyhub_calendar'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
exports.default = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(), // To use transactions
    pool: pool // Expose the pool directly if needed
};
