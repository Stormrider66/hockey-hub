"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = exports.SnakeCaseNamingStrategy = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const StringUtils_js_1 = require("typeorm/util/StringUtils.js");
const dotenv_1 = __importDefault(require("dotenv"));
// Import all entities explicitly
const User_1 = require("./entities/User");
const Role_1 = require("./entities/Role");
const Organization_1 = require("./entities/Organization");
const Team_1 = require("./entities/Team");
const TeamMember_1 = require("./entities/TeamMember");
const PlayerParentLink_1 = require("./entities/PlayerParentLink");
const RefreshToken_1 = require("./entities/RefreshToken");
const RolePermission_1 = require("./entities/RolePermission");
const Permission_1 = require("./entities/Permission");
const PasswordResetToken_1 = require("./entities/PasswordResetToken");
const EmailVerificationToken_1 = require("./entities/EmailVerificationToken");
// Import all migrations explicitly
const V1__init_base_schema_1 = require("./migrations/V1__init_base_schema");
const V2__create_uuid_extension_1 = require("./migrations/V2__create_uuid_extension");
const V3__auth_aux_tables_1 = require("./migrations/V3__auth_aux_tables");
// Load environment variables from .env file in current dir or project root
dotenv_1.default.config();
// Define paths for migrations
const migrationsPath = './migrations/**/*{.ts,.js}';
const usernameEnv = process.env.DB_USERNAME || process.env.POSTGRES_USER;
const passwordEnv = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;
const databaseEnv = process.env.DB_NAME || process.env.DB_DATABASE || process.env.POSTGRES_DB;
const hostEnv = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
// Create a custom naming strategy that converts camelCase to snake_case for database
class SnakeCaseNamingStrategy extends typeorm_1.DefaultNamingStrategy {
    tableName(targetName, userSpecifiedName) {
        return userSpecifiedName ? userSpecifiedName : (0, StringUtils_js_1.snakeCase)(targetName);
    }
    columnName(propertyName, customName) {
        return customName ? customName : (0, StringUtils_js_1.snakeCase)(propertyName);
    }
}
exports.SnakeCaseNamingStrategy = SnakeCaseNamingStrategy;
exports.dataSourceOptions = {
    type: 'postgres',
    host: hostEnv,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: usernameEnv,
    password: passwordEnv,
    database: databaseEnv,
    synchronize: false, // Disable auto-schema creation - rely on migrations instead
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'], // Log queries in dev
    entities: [
        User_1.User,
        Role_1.Role,
        Organization_1.Organization,
        Team_1.Team,
        TeamMember_1.TeamMember,
        PlayerParentLink_1.PlayerParentLink,
        RefreshToken_1.RefreshToken,
        RolePermission_1.RolePermission,
        Permission_1.Permission,
        PasswordResetToken_1.PasswordResetToken,
        EmailVerificationToken_1.EmailVerificationToken
    ],
    migrations: [
        V1__init_base_schema_1.V1InitBaseSchema1699999999997,
        V2__create_uuid_extension_1.V2CreateUuidExtension1699999999998,
        V3__auth_aux_tables_1.V3AuthAuxTables1699999999999
    ],
    subscribers: [],
    // namingStrategy: new SnakeCaseNamingStrategy(), // Comment out custom strategy for now
    // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // Optional: Enable SSL if needed
};
// Validate essential DB configuration
if (!usernameEnv || !passwordEnv || !databaseEnv) {
    // Use console.error for CLI context
    console.error('FATAL ERROR: Database credentials are missing (username, password, or database).');
    process.exit(1);
}
const AppDataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map