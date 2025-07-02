import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

@Entity('user_presence')
@Index(['status'])
@Index(['last_seen_at'])
export class UserPresence {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    default: PresenceStatus.OFFLINE,
  })
  status: PresenceStatus;

  @UpdateDateColumn()
  last_seen_at: Date;

  @Column({ nullable: true, length: 255 })
  status_message?: string;

  @Column({ nullable: true })
  active_device?: string;

  @Column({ type: 'jsonb', nullable: true })
  device_info?: {
    platform?: string;
    browser?: string;
    os?: string;
    ip_address?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  away_since?: Date;

  @Column({ type: 'timestamp', nullable: true })
  busy_until?: Date;

  // Virtual fields
  user?: any; // Will be populated from user service
  is_typing?: boolean;
  typing_in_conversation_id?: string;
}