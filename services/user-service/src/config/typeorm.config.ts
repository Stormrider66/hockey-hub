import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { Team } from '../entities/Team';
import { UserOrganization } from '../entities/UserOrganization';
import { TeamMember } from '../entities/TeamMember';
import { ParentChildRelationship } from '../entities/ParentChildRelationship';
import { Permission } from '../entities/Permission';
import { Role } from '../entities/Role';
import { RefreshToken } from '../entities/RefreshToken';
import { BlacklistedToken } from '../entities/BlacklistedToken';
import { LoginAttempt } from '../entities/LoginAttempt';
import { ServiceApiKey } from '../entities/ServiceApiKey';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_users',
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Organization,
    Team,
    UserOrganization,
    TeamMember,
    ParentChildRelationship,
    Permission,
    Role,
    RefreshToken,
    BlacklistedToken,
    LoginAttempt,
    ServiceApiKey,
  ],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../subscribers/*{.ts,.js}')],
};

export default config;

// For TypeORM CLI
export const AppDataSource = new DataSource(config);