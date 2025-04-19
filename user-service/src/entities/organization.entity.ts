import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Team } from './team.entity'; // Assuming name
// Import other related entities when created (e.g., EventType, Location, etc. from other services if FKs are managed here)

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
}

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  contactEmail!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, default: 'Sweden' })
  country!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string;

  @Column({ type: 'varchar', length: 10, default: 'sv' })
  defaultLanguage!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE, // Schema says 'active', updated
  })
  status!: OrganizationStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // --- Relationships ---
  @OneToMany(() => Team, (team) => team.organization)
  teams!: Team[];

  // Note: Relationships to other services (e.g., EventType, Location) are typically handled via IDs
  // rather than direct TypeORM relations across service boundaries.
} 