import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index
} from 'typeorm';
import { Permission } from './Permission';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  name!: string; // e.g., 'admin', 'coach', 'player'

  @Column()
  displayName!: string; // e.g., 'Administrator', 'Coach', 'Player'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isSystem!: boolean; // System roles cannot be deleted

  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
      name: 'roleId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'permissionId',
      referencedColumnName: 'id'
    }
  })
  permissions!: Permission[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// System roles that will be seeded
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLUB_ADMIN: 'club_admin',
  COACH: 'coach',
  ASSISTANT_COACH: 'assistant_coach',
  PLAYER: 'player',
  PARENT: 'parent',
  MEDICAL_STAFF: 'medical_staff',
  EQUIPMENT_MANAGER: 'equipment_manager',
  PHYSICAL_TRAINER: 'physical_trainer',
  TEAM_MANAGER: 'team_manager'
} as const;

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<string, string[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [], // Super admin has all permissions
  [SYSTEM_ROLES.ADMIN]: [SYSTEM_ROLES.SUPER_ADMIN],
  [SYSTEM_ROLES.CLUB_ADMIN]: [SYSTEM_ROLES.ADMIN],
  [SYSTEM_ROLES.COACH]: [],
  [SYSTEM_ROLES.ASSISTANT_COACH]: [SYSTEM_ROLES.COACH],
  [SYSTEM_ROLES.MEDICAL_STAFF]: [],
  [SYSTEM_ROLES.PHYSICAL_TRAINER]: [],
  [SYSTEM_ROLES.EQUIPMENT_MANAGER]: [],
  [SYSTEM_ROLES.TEAM_MANAGER]: [],
  [SYSTEM_ROLES.PLAYER]: [],
  [SYSTEM_ROLES.PARENT]: []
};