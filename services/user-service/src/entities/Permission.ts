import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  OneToMany
} from 'typeorm';
import { Role } from './Role';
import { RolePermission } from './RolePermission';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string; // Alias for permission identifier to align with seed script expectations

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index({ unique: true })
  code!: string; // e.g., 'calendar.events.create'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Define the inverse side of the relationship with Role
  // The JoinTable is defined on the Role entity
  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  // Relation to RolePermission join entity (used by explicit join table)
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions!: RolePermission[];

  /**
   * Ensure consistency between name and code when entity is persisted.
   * This hook can be refined later, but for now we simply mirror the two properties.
   */
} 