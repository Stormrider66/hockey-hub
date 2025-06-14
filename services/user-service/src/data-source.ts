import 'reflect-metadata';
import { DataSource, DataSourceOptions, DefaultNamingStrategy } from 'typeorm';
import { camelCase, snakeCase } from 'typeorm/util/StringUtils.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Import all entities explicitly
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Organization } from './entities/Organization';
import { Team } from './entities/Team';
import { TeamMember } from './entities/TeamMember';
import { PlayerParentLink } from './entities/PlayerParentLink';
import { RefreshToken } from './entities/RefreshToken';
import { RolePermission } from './entities/RolePermission';
import { Permission } from './entities/Permission';
import { PasswordResetToken } from './entities/PasswordResetToken';
import { EmailVerificationToken } from './entities/EmailVerificationToken';

// Import all migrations explicitly
import { V1InitBaseSchema1699999999997 } from './migrations/V1__init_base_schema';
import { V2CreateUuidExtension1699999999998 } from './migrations/V2__create_uuid_extension';
import { V3AuthAuxTables1699999999999 } from './migrations/V3__auth_aux_tables';

// Load environment variables from .env file in current dir or project root
dotenv.config();

// Define paths for migrations
const migrationsPath = './migrations/**/*{.ts,.js}';

const usernameEnv = process.env.DB_USERNAME || process.env.POSTGRES_USER;
const passwordEnv = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;
const databaseEnv = process.env.DB_NAME || process.env.DB_DATABASE || process.env.POSTGRES_DB;
const hostEnv = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';

// Create a custom naming strategy that converts camelCase to snake_case for database
export class SnakeCaseNamingStrategy extends DefaultNamingStrategy {
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
  }

  columnName(propertyName: string, customName: string | undefined): string {
    return customName ? customName : snakeCase(propertyName);
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: hostEnv,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: usernameEnv,
  password: passwordEnv,
  database: databaseEnv,
  synchronize: false, // Disable auto-schema creation - rely on migrations instead
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'], // Log queries in dev
  entities: [
    User,
    Role,
    Organization,
    Team,
    TeamMember,
    PlayerParentLink,
    RefreshToken,
    RolePermission,
    Permission,
    PasswordResetToken,
    EmailVerificationToken
  ],
  migrations: [
    V1InitBaseSchema1699999999997,
    V2CreateUuidExtension1699999999998,
    V3AuthAuxTables1699999999999
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

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource; 