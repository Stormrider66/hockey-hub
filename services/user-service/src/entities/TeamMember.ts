import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check
} from 'typeorm';
import { User } from './User';
import { Team } from './Team';

export type TeamMemberRoleEnum = 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';

@Entity('team_members')
@Index(['teamId'])
@Index(['userId'])
@Index(['role'])
@Index(['teamId', 'userId', 'role'], { unique: true }) // Composite unique index
@Check(`"role" IN ('player', 'coach', 'assistant_coach', 'manager', 'staff')`)
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'team_id', type: 'uuid' })
  teamId!: string;

  @ManyToOne(() => Team, (team) => team.members, { nullable: false, lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Promise<Team>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.teamMemberships, { nullable: false, lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Promise<User>;

  @Column({ type: 'enum', enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff'] })
  role!: TeamMemberRoleEnum;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position?: string;

  @Column({ name: 'jersey_number', type: 'varchar', length: 10, nullable: true })
  jerseyNumber?: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}