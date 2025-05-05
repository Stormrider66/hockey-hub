import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('password_reset_tokens')
@Index(['userId'])
@Index(['expiresAt'])
@Index(['userId', 'usedAt'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Promise<User>;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index({ unique: true })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp with time zone', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
} 