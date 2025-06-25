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
exports.CreateInjuryUpdatesTable1703040000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateInjuryUpdatesTable1703040000000 {
    constructor() {
        this.name = 'CreateInjuryUpdatesTable1703040000000';
    }
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create injury_updates table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'injury_updates',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'injury_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'date',
                        type: 'timestamptz',
                        isNullable: false,
                    },
                    {
                        name: 'note',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'subjective_assessment',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'objective_assessment',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_by_user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }), true);
            // Create indexes using raw SQL
            yield queryRunner.query(`
            CREATE INDEX "IDX_injury_updates_injury_id_date" ON "injury_updates" ("injury_id", "date")
        `);
            yield queryRunner.query(`
            CREATE INDEX "IDX_injury_updates_created_by_user_id" ON "injury_updates" ("created_by_user_id")
        `);
            // Create foreign key constraint
            yield queryRunner.createForeignKey('injury_updates', new typeorm_1.TableForeignKey({
                columnNames: ['injury_id'],
                referencedTableName: 'injuries',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                name: 'FK_injury_updates_injury_id',
            }));
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // Drop foreign key
            yield queryRunner.dropForeignKey('injury_updates', 'FK_injury_updates_injury_id');
            // Drop indexes using raw SQL
            yield queryRunner.query(`DROP INDEX IF EXISTS "IDX_injury_updates_injury_id_date"`);
            yield queryRunner.query(`DROP INDEX IF EXISTS "IDX_injury_updates_created_by_user_id"`);
            // Drop table
            yield queryRunner.dropTable('injury_updates');
        });
    }
}
exports.CreateInjuryUpdatesTable1703040000000 = CreateInjuryUpdatesTable1703040000000;
