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

@Entity('teams')
@Index(['organizationId'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.teams, { nullable: false, lazy: true })
  @JoinColumn({ name: 'organization_id' })
  organization!: Promise<Organization>;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ name: 'team_color', type: 'varchar', length: 20, nullable: true })
  teamColor?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true, select: false })
  deletedAt?: Date;

  // --- Relationships ---
  @OneToMany(() => TeamMember, (teamMember) => teamMember.team)
  members!: TeamMember[];

  // Note: Relationships to other services (e.g., Events, Stats) are managed
  // conceptually or via IDs, not direct TypeORM relations.
}