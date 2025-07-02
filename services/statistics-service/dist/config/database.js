"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = exports.cacheManager = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const shared_lib_1 = require("@hockey-hub/shared-lib");
const entities_1 = require("../entities");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5439'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'hockey_hub_password',
    database: process.env.DB_NAME || 'hockey_hub_statistics',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [
        'src/entities/**/*.ts',
        entities_1.PlayerPerformanceStats,
        entities_1.TeamAnalytics,
        entities_1.WorkloadAnalytics,
        entities_1.TrainingStatistics,
        entities_1.FacilityAnalytics
    ],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
});
exports.cacheManager = new shared_lib_1.RedisCacheManager({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '7'),
});
async function initializeDatabase() {
    try {
        await exports.AppDataSource.initialize();
        console.log('📊 Statistics Service: Database connected successfully');
        await exports.cacheManager.connect();
        console.log('📊 Statistics Service: Redis cache connected successfully');
    }
    catch (error) {
        console.error('📊 Statistics Service: Database connection failed:', error);
        throw error;
    }
}
exports.initializeDatabase = initializeDatabase;
async function closeDatabase() {
    try {
        await exports.AppDataSource.destroy();
        await exports.cacheManager.disconnect();
        console.log('📊 Statistics Service: Database and cache connections closed');
    }
    catch (error) {
        console.error('📊 Statistics Service: Error closing connections:', error);
        throw error;
    }
}
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map