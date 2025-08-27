import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib/entities';
import { Organization } from './Organization';
import { TeamMember } from './TeamMember';

export enum TeamType {
  YOUTH = 'youth',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  RECREATIONAL = 'recreational'
}

@Entity('teams')
@Unique(['organization', 'name', 'season'])
export class Team extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, org => org.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  @Index()
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ 
    type: 'enum',
    enum: TeamType
  })
  teamType: TeamType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ageGroup?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  season?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => TeamMember, teamMember => teamMember.team)
  teamMembers: TeamMember[];
}