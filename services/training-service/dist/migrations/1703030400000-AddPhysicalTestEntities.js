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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPhysicalTestEntities1703030400000 = void 0;
const typeorm_1 = require("typeorm");
class AddPhysicalTestEntities1703030400000 {
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure UUID extension
            yield queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            // Check if tables already exist before creating them
            const definitionsTableExists = yield queryRunner.hasTable('physical_test_definitions');
            const resultsTableExists = yield queryRunner.hasTable('physical_test_results');
            if (!definitionsTableExists) {
                // Create definitions table
                yield queryRunner.createTable(new typeorm_1.Table({
                    name: 'physical_test_definitions',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                        { name: 'name', type: 'varchar', length: '255', isNullable: false },
                        { name: 'category', type: 'varchar', length: '100', isNullable: false },
                        { name: 'is_on_ice', type: 'boolean', default: false },
                        { name: 'protocol', type: 'text', isNullable: true },
                        { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                        { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
                    ],
                }), true);
            }
            if (!resultsTableExists) {
                // Create results table
                yield queryRunner.createTable(new typeorm_1.Table({
                    name: 'physical_test_results',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
                        { name: 'player_id', type: 'uuid', isNullable: false },
                        { name: 'test_definition_id', type: 'uuid', isNullable: false },
                        { name: 'value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
                        { name: 'timestamp', type: 'timestamptz', isNullable: false },
                        { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                        { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
                    ],
                }), true);
                // Add foreign key to link results to definitions
                yield queryRunner.createForeignKey('physical_test_results', new typeorm_1.TableForeignKey({
                    columnNames: ['test_definition_id'],
                    referencedTableName: 'physical_test_definitions',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }));
            }
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.dropTable('physical_test_results', true, true);
            yield queryRunner.dropTable('physical_test_definitions', true, true);
        });
    }
}
exports.AddPhysicalTestEntities1703030400000 = AddPhysicalTestEntities1703030400000;
