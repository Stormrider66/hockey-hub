import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Team } from './Team';
import { User } from './User';

export type OrganizationStatus = 'active' | 'inactive' | 'trial';

@Entity('organizations')
@Index(['name'])
@Index(['status'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255 })
  contactEmail!: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'Sweden' })
  country?: string;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, nullable: true })
  primaryColor?: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string;

  @Column({ name: 'default_language', type: 'varchar', length: 10, default: 'sv' })
  defaultLanguage!: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'trial'], default: 'active' })
  status!: OrganizationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true, select: false })
  deletedAt?: Date;

  // --- Relationships ---
  @OneToMany(() => Team, (team) => team.organization)
  teams!: Team[];

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  // Note: Relationships to other services (e.g., Subscriptions) are managed conceptually
  // or via IDs, not direct TypeORM relations across service boundaries.
}