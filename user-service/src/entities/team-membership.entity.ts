import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';

export enum TeamMemberRole {
  PLAYER = 'player',
  COACH = 'coach',
  ASSISTANT_COACH = 'assistant_coach',
  MANAGER = 'manager',
  STAFF = 'staff',
}

@Entity({ name: 'team_members' })
@Unique(['teamId', 'userId', 'role']) // Composite unique constraint
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  teamId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TeamMemberRole,
  })
  role!: TeamMemberRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  jerseyNumber?: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  // --- Relationships ---
  @ManyToOne(() => Team, (team) => team.memberships)
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @ManyToOne(() => User, (user) => user.teamMemberships)
  @JoinColumn({ name: 'userId' })
  user!: User;
} 