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
function checkTables() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield data_source_1.default.initialize();
            console.log('Connected to database');
            // Query to list all tables in the public schema
            const tables = yield data_source_1.default.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
            console.log('\nExisting tables in database:');
            console.log('----------------------------');
            tables.forEach((table) => {
                console.log(`- ${table.table_name}`);
            });
            if (tables.length === 0) {
                console.log('No tables found! Migrations need to be run.');
            }
            yield data_source_1.default.destroy();
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
checkTables();
//# sourceMappingURL=check-tables.js.map