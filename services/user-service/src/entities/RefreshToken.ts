import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity({ name: 'refresh_tokens' })
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
@Index(['userId', 'revoked'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @Column({ type: 'boolean', default: false })
  revoked!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  revokedReason?: string;

  // --- Relationships ---
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}