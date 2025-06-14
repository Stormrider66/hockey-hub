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

@Entity('organizations')
@Index(['name'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'organization_number', type: 'varchar', length: 100, nullable: true })
  organizationNumber?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, nullable: true })
  primaryColor?: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string;

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