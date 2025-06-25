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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const data_source_1 = __importDefault(require("../data-source"));
function forceMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield data_source_1.default.initialize();
            console.log('Database initialized');
            // Check migrations table
            const migrations = yield data_source_1.default.query('SELECT * FROM migrations');
            console.log('\nCurrent migrations in database:');
            console.log(migrations);
            // Check pending migrations
            const pending = yield data_source_1.default.showMigrations();
            console.log('\nPending migrations:', pending);
            // Run migrations
            console.log('\nRunning migrations...');
            yield data_source_1.default.runMigrations({ transaction: 'all' });
            // Check tables after migration
            const tables = yield data_source_1.default.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
            console.log('\nTables after migration:');
            tables.forEach((table) => {
                console.log(`- ${table.table_name}`);
            });
            yield data_source_1.default.destroy();
            console.log('\nMigrations completed!');
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
forceMigrations();
//# sourceMappingURL=force-migrations.js.map