import { DataSource } from 'typeorm';
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

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_users',
  synchronize: false, // Always use migrations
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
    ServiceApiKey
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  migrationsRun: process.env.NODE_ENV === 'production', // Auto-run migrations in production
  // Enable Redis caching
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '1'), // Use DB 1 for User Service
    },
    duration: parseInt(process.env.CACHE_DURATION || '60000'), // 1 minute default
  },
});