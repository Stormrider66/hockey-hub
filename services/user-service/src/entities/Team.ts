import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './Organization';
import { TeamMember } from './TeamMember';

type TeamStatus = 'active' | 'inactive' | 'archived';

@Entity({ name: 'teams' })
@Index(['organizationId'])
@Index(['status'])
@Index(['organizationId', 'status'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string; // e.g., Age group, skill level

  @Column({ type: 'varchar', length: 20, nullable: true })
  season?: string; // e.g., "2023-2024"

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string; // Hex code

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  })
  status!: TeamStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // --- Relationships ---
  @ManyToOne(() => Organization, (organization) => organization.teams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @OneToMany(() => TeamMember, (teamMember) => teamMember.team)
  members!: TeamMember[];

  // Note: Relationships to other services (e.g., Events, Stats) are managed
  // conceptually or via IDs, not direct TypeORM relations.
}