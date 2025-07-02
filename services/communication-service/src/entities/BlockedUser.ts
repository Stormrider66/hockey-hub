import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('blocked_users')
@Unique(['blockerId', 'blockedUserId'])
@Index(['blockerId'])
@Index(['blockedUserId'])
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'blocker_id' })
  blockerId: string;

  @Column({ type: 'uuid', name: 'blocked_user_id' })
  blockedUserId: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;
}