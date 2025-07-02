import { Entity, Column, ManyToOne, Index, JoinColumn, PrimaryColumn } from 'typeorm';
import { Team } from './Team';
import { User } from './User';

export enum TeamRole {
  PLAYER = 'player',
  COACH = 'coach',
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
  MEDICAL_STAFF = 'medical_staff'
}

@Entity('team_members')
export class TeamMember {
  @PrimaryColumn('uuid')
  teamId: string;

  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => Team, team => team.teamMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  @Index()
  team: Team;

  @ManyToOne(() => User, user => user.teamMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @Column({ 
    type: 'enum',
    enum: TeamRole
  })
  role: TeamRole;

  @Column({ type: 'integer', nullable: true })
  jerseyNumber?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position?: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  leftAt?: Date;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;
}