import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { TeamMembership } from './team-membership.entity';
import { PlayerParentLink } from './player-parent-link.entity';
import { RefreshToken } from './refresh-token.entity';
// import { PlayerParentLink } from './player-parent-link.entity'; // Assuming name
// import { RefreshToken } from './refresh-token.entity'; // Assuming name

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Index()
  @Column({ type: 'varchar', length: 10, default: 'sv' })
  preferredLanguage!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE, // Schema says 'active'. Registration might set to PENDING initially.
  })
  status!: UserStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Index()
  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // --- Relationships ---

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => TeamMembership, (membership) => membership.user)
  teamMemberships!: TeamMembership[];

  @OneToMany(() => PlayerParentLink, (link) => link.parent)
  parentLinks!: PlayerParentLink[];

  @OneToMany(() => PlayerParentLink, (link) => link.child)
  childLinks!: PlayerParentLink[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
} 