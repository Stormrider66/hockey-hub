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
import { User } from './User';
import { Team } from './Team';

type TeamRole = 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';

@Entity({ name: 'team_members' })
@Index(['teamId'])
@Index(['userId'])
@Index(['role'])
@Unique(['teamId', 'userId', 'role']) // A user can only have one specific role in a team
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff'],
  })
  role!: TeamRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  position?: string; // e.g., 'forward', 'defense', 'goalkeeper'

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
  @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @ManyToOne(() => User, (user) => user.teamMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}