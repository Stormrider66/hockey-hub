import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessagePrivacy {
  EVERYONE = 'everyone',
  TEAM_ONLY = 'team_only',
  CONTACTS_ONLY = 'contacts_only',
  NO_ONE = 'no_one'
}

export enum OnlineVisibility {
  EVERYONE = 'everyone',
  TEAM_ONLY = 'team_only',
  CONTACTS_ONLY = 'contacts_only',
  NO_ONE = 'no_one'
}

@Entity('privacy_settings')
export class PrivacySettings {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: MessagePrivacy,
    default: MessagePrivacy.EVERYONE,
    name: 'who_can_message'
  })
  whoCanMessage: MessagePrivacy;

  @Column({
    type: 'enum',
    enum: OnlineVisibility,
    default: OnlineVisibility.EVERYONE,
    name: 'online_visibility'
  })
  onlineVisibility: OnlineVisibility;

  @Column({ type: 'boolean', default: true, name: 'show_read_receipts' })
  showReadReceipts: boolean;

  @Column({ type: 'boolean', default: true, name: 'show_typing_indicators' })
  showTypingIndicators: boolean;

  @Column({ type: 'boolean', default: true, name: 'show_last_seen' })
  showLastSeen: boolean;

  @Column({ type: 'boolean', default: true, name: 'allow_profile_views' })
  allowProfileViews: boolean;

  @Column({ type: 'boolean', default: false, name: 'block_screenshots' })
  blockScreenshots: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}