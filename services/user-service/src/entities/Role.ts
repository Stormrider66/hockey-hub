import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Permission } from './Permission';

@Entity('roles')
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string; // e.g., 'admin', 'coach', 'player'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  // --- Relationships ---
  @ManyToMany(() => User, (user) => user.roles)
  // The JoinTable is defined in the User entity
  users!: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: ['insert', 'update'] })
  // JoinTable decorator needed here if Permission entity doesn't define it
  // @JoinTable({ 
  //     name: 'role_permissions',
  //     joinColumn: { name: 'role_id', referencedColumnName: 'id' },
  //     inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  // })
  permissions!: Permission[];
}