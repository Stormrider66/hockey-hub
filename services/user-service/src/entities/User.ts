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
  Check,
} from 'typeorm';
import { Role } from './Role';
import { TeamMember } from './TeamMember';
import { PlayerParentLink } from './PlayerParentLink';
import { RefreshToken } from './RefreshToken';
import { Organization } from './Organization';
import { PasswordResetToken } from './PasswordResetToken';
import { EmailVerificationToken } from './EmailVerificationToken';

export type UserStatus = 'active' | 'inactive' | 'pending';

@Entity('users')
@Check(`"status" IN ('active', 'inactive', 'pending')`)
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['preferredLanguage'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index({ unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'preferred_language', type: 'varchar', length: 10, default: 'sv' })
  preferredLanguage!: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'pending'], default: 'active' })
  @Index()
  status!: UserStatus;

  @Column({ name: 'last_login', type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  // Password Reset Fields
  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true, select: false })
  passwordResetToken?: string | null;

  @Column({ name: 'password_reset_expires', type: 'timestamp with time zone', nullable: true, select: false })
  passwordResetExpires?: Date | null;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true, select: false })
  deletedAt?: Date;

  // --- Relationships ---
  @ManyToMany(() => Role, (role) => role.users, { cascade: ['insert', 'update'] })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  teamMemberships!: TeamMember[];

  @OneToMany(() => PlayerParentLink, (link) => link.parent)
  childLinks!: PlayerParentLink[];

  @OneToMany(() => PlayerParentLink, (link) => link.child)
  parentLinks!: PlayerParentLink[];

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { nullable: true, lazy: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Promise<Organization | null>;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];

  @OneToMany(() => EmailVerificationToken, (token: EmailVerificationToken) => token.user)
  emailVerificationTokens!: EmailVerificationToken[];
}