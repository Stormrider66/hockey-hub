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
exports.V3AuthAuxTables1699999999999 = void 0;
const typeorm_1 = require("typeorm");
class V3AuthAuxTables1699999999999 {
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. permissions table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'permissions',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'name', type: 'varchar', length: '100', isUnique: true, isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            yield queryRunner.createIndex('permissions', new typeorm_1.TableIndex({
                name: 'IDX_permissions_name',
                columnNames: ['name'],
                isUnique: true,
            }));
            // 2. role_permissions table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'role_permissions',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'role_id', type: 'uuid', isNullable: false },
                    { name: 'permission_id', type: 'uuid', isNullable: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            yield queryRunner.createForeignKeys('role_permissions', [
                new typeorm_1.TableForeignKey({
                    columnNames: ['role_id'],
                    referencedTableName: 'roles',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
                new typeorm_1.TableForeignKey({
                    columnNames: ['permission_id'],
                    referencedTableName: 'permissions',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ]);
            yield queryRunner.createIndex('role_permissions', new typeorm_1.TableIndex({
                name: 'IDX_role_permission_unique',
                columnNames: ['role_id', 'permission_id'],
                isUnique: true,
            }));
            // 3. password_reset_tokens table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'password_reset_tokens',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    { name: 'token', type: 'varchar', length: '255', isUnique: true },
                    { name: 'expires_at', type: 'timestamp with time zone' },
                    { name: 'used', type: 'boolean', default: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            yield queryRunner.createForeignKey('password_reset_tokens', new typeorm_1.TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            yield queryRunner.createIndex('password_reset_tokens', new typeorm_1.TableIndex({
                name: 'IDX_password_reset_token',
                columnNames: ['token'],
                isUnique: true,
            }));
            // 4. email_verification_tokens table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'email_verification_tokens',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    { name: 'token', type: 'varchar', length: '255', isUnique: true },
                    { name: 'expires_at', type: 'timestamp with time zone' },
                    { name: 'used', type: 'boolean', default: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            yield queryRunner.createForeignKey('email_verification_tokens', new typeorm_1.TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            yield queryRunner.createIndex('email_verification_tokens', new typeorm_1.TableIndex({
                name: 'IDX_email_verification_token',
                columnNames: ['token'],
                isUnique: true,
            }));
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield queryRunner.dropTable('email_verification_tokens');
            yield queryRunner.dropTable('password_reset_tokens');
            yield queryRunner.dropTable('role_permissions');
            yield queryRunner.dropTable('permissions');
        });
    }
}
exports.V3AuthAuxTables1699999999999 = V3AuthAuxTables1699999999999;
//# sourceMappingURL=V3__auth_aux_tables.js.map