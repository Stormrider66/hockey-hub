import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index
} from 'typeorm';
import { Role } from './Role';

@Entity('permissions')
@Index(['resource', 'action'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  name!: string; // e.g., 'users.create', 'teams.update'

  @Column()
  description!: string;

  @Column()
  resource!: string; // e.g., 'users', 'teams', 'training'

  @Column()
  action!: string; // e.g., 'create', 'read', 'update', 'delete'

  @Column({ default: true })
  isActive!: boolean;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Common permissions that will be seeded
export const PERMISSIONS = {
  // User management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_LIST: 'users.list',
  
  // Team management
  TEAMS_CREATE: 'teams.create',
  TEAMS_READ: 'teams.read',
  TEAMS_UPDATE: 'teams.update',
  TEAMS_DELETE: 'teams.delete',
  TEAMS_LIST: 'teams.list',
  TEAMS_MANAGE_MEMBERS: 'teams.manage_members',
  
  // Organization management
  ORGANIZATIONS_CREATE: 'organizations.create',
  ORGANIZATIONS_READ: 'organizations.read',
  ORGANIZATIONS_UPDATE: 'organizations.update',
  ORGANIZATIONS_DELETE: 'organizations.delete',
  ORGANIZATIONS_LIST: 'organizations.list',
  
  // Training management
  TRAINING_CREATE: 'training.create',
  TRAINING_READ: 'training.read',
  TRAINING_UPDATE: 'training.update',
  TRAINING_DELETE: 'training.delete',
  TRAINING_LIST: 'training.list',
  TRAINING_EXECUTE: 'training.execute',
  
  // Medical records
  MEDICAL_CREATE: 'medical.create',
  MEDICAL_READ: 'medical.read',
  MEDICAL_UPDATE: 'medical.update',
  MEDICAL_DELETE: 'medical.delete',
  MEDICAL_LIST: 'medical.list',
  
  // Calendar management
  CALENDAR_CREATE: 'calendar.create',
  CALENDAR_READ: 'calendar.read',
  CALENDAR_UPDATE: 'calendar.update',
  CALENDAR_DELETE: 'calendar.delete',
  CALENDAR_LIST: 'calendar.list',
  
  // Statistics
  STATISTICS_READ: 'statistics.read',
  STATISTICS_EXPORT: 'statistics.export',
  
  // Payments
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_LIST: 'payments.list',
  PAYMENTS_REFUND: 'payments.refund',
  
  // Communication
  MESSAGES_SEND: 'messages.send',
  MESSAGES_READ: 'messages.read',
  MESSAGES_BROADCAST: 'messages.broadcast',
  
  // Admin
  ADMIN_ACCESS: 'admin.access',
  ADMIN_USERS: 'admin.users',
  ADMIN_SYSTEM: 'admin.system',
  ADMIN_AUDIT: 'admin.audit',
} as const;