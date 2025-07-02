"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnections = exports.redisClient = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const ioredis_1 = __importDefault(require("ioredis"));
const entities = __importStar(require("../entities"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_lib_1 = require("@hockey-hub/shared-lib");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5435'), // Communication service uses port 5435
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hockey_hub_communication',
    synchronize: false, // Always use migrations
    logging: process.env.NODE_ENV === 'development',
    entities: Object.values(entities),
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
    migrationsRun: process.env.NODE_ENV === 'production', // Auto-run migrations in production
});
// Redis configuration for caching
exports.redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '3'), // Use DB 3 for Communication Service
    keyPrefix: 'comm:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
// Redis event handlers
exports.redisClient.on('connect', () => {
    shared_lib_1.logger.info('Redis connected successfully');
});
exports.redisClient.on('error', (error) => {
    shared_lib_1.logger.error('Redis connection error:', error);
});
exports.redisClient.on('ready', () => {
    shared_lib_1.logger.info('Redis is ready for communication service');
});
// Graceful shutdown
const closeConnections = async () => {
    try {
        await exports.redisClient.quit();
        shared_lib_1.logger.info('Redis connection closed');
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            shared_lib_1.logger.info('Database connection closed');
        }
    }
    catch (error) {
        shared_lib_1.logger.error('Error closing connections:', error);
    }
};
exports.closeConnections = closeConnections;
//# sourceMappingURL=database.js.map