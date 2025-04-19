import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './Role';
import { TeamMember } from './TeamMember';
import { PlayerParentLink } from './PlayerParentLink';
import { RefreshToken } from './RefreshToken';
import { Organization } from './Organization';

type UserStatus = 'active' | 'inactive' | 'pending';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['preferredLanguage'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 10, default: 'sv' })
  preferredLanguage!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // --- Relationships ---
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @ManyToOne(() => Organization, (organization) => organization.users, { nullable: true, eager: false })
  @JoinColumn({ name: 'organization_id' }) 
  organization: Organization | null | undefined;

  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  teamMemberships!: TeamMember[];

  // Self-referencing relationships for parent-child links
  @OneToMany(() => PlayerParentLink, (link) => link.parent)
  childLinks!: PlayerParentLink[]; // Links where this user is the parent

  @OneToMany(() => PlayerParentLink, (link) => link.child)
  parentLinks!: PlayerParentLink[]; // Links where this user is the child

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}