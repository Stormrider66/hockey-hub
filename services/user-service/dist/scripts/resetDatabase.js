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
require("reflect-metadata");
const data_source_1 = __importDefault(require("../data-source"));
/**
 * This script resets the database schema and runs migrations from scratch.
 * WARNING: This will DROP ALL TABLES in the database. Use only in development or testing.
 */
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Initializing connection...');
        const dataSource = yield data_source_1.default.initialize();
        console.log('Database initialized');
        console.log('Dropping all tables...');
        yield dataSource.dropDatabase();
        console.log('Database schema dropped');
        console.log('Running migrations...');
        const migrations = yield dataSource.runMigrations({ transaction: 'all' });
        console.log(`Executed ${migrations.length} migrations:`, migrations.map(m => m.name));
        console.log('Database reset and migrations applied successfully');
        yield dataSource.destroy();
        process.exit(0);
    }
    catch (err) {
        console.error('Database reset failed:', err);
        process.exit(1);
    }
}))();
//# sourceMappingURL=resetDatabase.js.map