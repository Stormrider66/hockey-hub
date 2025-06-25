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
exports.V1InitBaseSchema1699999999997 = void 0;
const typeorm_1 = require("typeorm");
class V1InitBaseSchema1699999999997 {
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Create organizations table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'organizations',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'name', type: 'varchar', length: '255', isNullable: false },
                    { name: 'organization_number', type: 'varchar', length: '100', isNullable: true },
                    { name: 'address', type: 'varchar', length: '255', isNullable: true },
                    { name: 'city', type: 'varchar', length: '100', isNullable: true },
                    { name: 'postal_code', type: 'varchar', length: '20', isNullable: true },
                    { name: 'country', type: 'varchar', length: '100', isNullable: true },
                    { name: 'phone', type: 'varchar', length: '50', isNullable: true },
                    { name: 'email', type: 'varchar', length: '255', isNullable: true },
                    { name: 'website', type: 'varchar', length: '255', isNullable: true },
                    { name: 'logo_url', type: 'varchar', length: '255', isNullable: true },
                    { name: 'primary_color', type: 'varchar', length: '20', isNullable: true },
                    { name: 'secondary_color', type: 'varchar', length: '20', isNullable: true },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            }), true);
            // 2. Create roles table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'roles',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'name', type: 'varchar', length: '50', isUnique: true },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            yield queryRunner.createIndex('roles', new typeorm_1.TableIndex({
                name: 'IDX_roles_name',
                columnNames: ['name'],
                isUnique: true,
            }));
            // 3. Create users table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'users',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'email', type: 'varchar', length: '255', isUnique: true },
                    { name: 'password_hash', type: 'varchar', length: '255' },
                    { name: 'first_name', type: 'varchar', length: '100' },
                    { name: 'last_name', type: 'varchar', length: '100' },
                    { name: 'phone', type: 'varchar', length: '20', isNullable: true },
                    { name: 'preferred_language', type: 'varchar', length: '10', default: "'sv'" },
                    { name: 'status', type: 'enum', enum: ['active', 'inactive', 'pending'], default: "'pending'" },
                    { name: 'password_reset_token', type: 'varchar', length: '255', isNullable: true },
                    { name: 'password_reset_expires', type: 'timestamp', isNullable: true },
                    { name: 'last_login', type: 'timestamp with time zone', isNullable: true },
                    { name: 'avatar_url', type: 'varchar', length: '255', isNullable: true },
                    { name: 'organization_id', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            }), true);
            // Create indexes on users table
            yield queryRunner.createIndex('users', new typeorm_1.TableIndex({
                name: 'IDX_users_email',
                columnNames: ['email'],
                isUnique: true,
            }));
            yield queryRunner.createIndex('users', new typeorm_1.TableIndex({
                name: 'IDX_users_status',
                columnNames: ['status'],
            }));
            yield queryRunner.createIndex('users', new typeorm_1.TableIndex({
                name: 'IDX_users_preferred_language',
                columnNames: ['preferred_language'],
            }));
            // Add foreign key for organization
            yield queryRunner.createForeignKey('users', new typeorm_1.TableForeignKey({
                name: 'FK_users_organization',
                columnNames: ['organization_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }));
            // 4. Create user_roles junction table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'user_roles',
                columns: [
                    { name: 'user_id', type: 'uuid' },
                    { name: 'role_id', type: 'uuid' },
                ]
            }), true);
            // Create a composite primary key
            yield queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id")`);
            // Add foreign keys to user_roles
            yield queryRunner.createForeignKeys('user_roles', [
                new typeorm_1.TableForeignKey({
                    name: 'FK_user_roles_user',
                    columnNames: ['user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
                new typeorm_1.TableForeignKey({
                    name: 'FK_user_roles_role',
                    columnNames: ['role_id'],
                    referencedTableName: 'roles',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ]);
            // 5. Create teams table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'teams',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'name', type: 'varchar', length: '255' },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'logo_url', type: 'varchar', length: '255', isNullable: true },
                    { name: 'team_color', type: 'varchar', length: '20', isNullable: true },
                    { name: 'organization_id', type: 'uuid', isNullable: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            }), true);
            // Add foreign key for organization in teams
            yield queryRunner.createForeignKey('teams', new typeorm_1.TableForeignKey({
                name: 'FK_teams_organization',
                columnNames: ['organization_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            // 6. Create team_members table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'team_members',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'team_id', type: 'uuid', isNullable: false },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    { name: 'role', type: 'varchar', length: '50', isNullable: false },
                    { name: 'active', type: 'boolean', default: true },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            }), true);
            // Create indexes and foreign keys for team_members
            yield queryRunner.createForeignKeys('team_members', [
                new typeorm_1.TableForeignKey({
                    name: 'FK_team_members_team',
                    columnNames: ['team_id'],
                    referencedTableName: 'teams',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
                new typeorm_1.TableForeignKey({
                    name: 'FK_team_members_user',
                    columnNames: ['user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ]);
            // Create unique constraint for user+team
            yield queryRunner.createIndex('team_members', new typeorm_1.TableIndex({
                name: 'IDX_team_members_user_team',
                columnNames: ['user_id', 'team_id'],
                isUnique: true,
            }));
            // 7. Create player_parent_links table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'player_parent_links',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'parent_id', type: 'uuid', isNullable: false },
                    { name: 'child_id', type: 'uuid', isNullable: false },
                    { name: 'relationship', type: 'varchar', length: '50', isNullable: true },
                    { name: 'is_primary', type: 'boolean', default: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
                ],
            }), true);
            // Create foreign keys for player_parent_links
            yield queryRunner.createForeignKeys('player_parent_links', [
                new typeorm_1.TableForeignKey({
                    name: 'FK_player_parent_links_parent',
                    columnNames: ['parent_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
                new typeorm_1.TableForeignKey({
                    name: 'FK_player_parent_links_child',
                    columnNames: ['child_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ]);
            // Create unique constraint
            yield queryRunner.createIndex('player_parent_links', new typeorm_1.TableIndex({
                name: 'IDX_player_parent_links_unique',
                columnNames: ['parent_id', 'child_id'],
                isUnique: true,
            }));
            // 8. Create refresh_tokens table
            yield queryRunner.createTable(new typeorm_1.Table({
                name: 'refresh_tokens',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    { name: 'token', type: 'varchar', length: '500', isNullable: false },
                    { name: 'expires_at', type: 'timestamp with time zone', isNullable: false },
                    { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
                    { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
                ],
            }), true);
            // Create indexes and foreign keys for refresh_tokens
            yield queryRunner.createForeignKey('refresh_tokens', new typeorm_1.TableForeignKey({
                name: 'FK_refresh_tokens_user',
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
            yield queryRunner.createIndex('refresh_tokens', new typeorm_1.TableIndex({
                name: 'IDX_refresh_tokens_token',
                columnNames: ['token'],
                isUnique: true,
            }));
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // Drop tables in reverse order to avoid foreign key constraints
            yield queryRunner.dropTable('refresh_tokens');
            yield queryRunner.dropTable('player_parent_links');
            yield queryRunner.dropTable('team_members');
            yield queryRunner.dropTable('teams');
            yield queryRunner.dropTable('user_roles');
            yield queryRunner.dropTable('users');
            yield queryRunner.dropTable('roles');
            yield queryRunner.dropTable('organizations');
        });
    }
}
exports.V1InitBaseSchema1699999999997 = V1InitBaseSchema1699999999997;
//# sourceMappingURL=V1__init_base_schema.js.map