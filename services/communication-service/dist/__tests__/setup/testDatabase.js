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
exports.clearDatabase = exports.teardownTestDatabase = exports.setupTestDatabase = exports.TestDataSource = void 0;
const typeorm_1 = require("typeorm");
const entities = __importStar(require("../../entities"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load test environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env.test') });
exports.TestDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5435'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hockey_hub_communication_test',
    synchronize: true, // Auto-create tables for tests
    dropSchema: true, // Drop schema before each test run
    logging: false,
    entities: Object.values(entities),
});
async function setupTestDatabase() {
    try {
        if (!exports.TestDataSource.isInitialized) {
            await exports.TestDataSource.initialize();
        }
        await exports.TestDataSource.synchronize(true);
    }
    catch (error) {
        console.error('Error setting up test database:', error);
        throw error;
    }
}
exports.setupTestDatabase = setupTestDatabase;
async function teardownTestDatabase() {
    try {
        if (exports.TestDataSource.isInitialized) {
            await exports.TestDataSource.destroy();
        }
    }
    catch (error) {
        console.error('Error tearing down test database:', error);
        throw error;
    }
}
exports.teardownTestDatabase = teardownTestDatabase;
async function clearDatabase() {
    const entities = exports.TestDataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = exports.TestDataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE`);
    }
}
exports.clearDatabase = clearDatabase;
//# sourceMappingURL=testDatabase.js.map