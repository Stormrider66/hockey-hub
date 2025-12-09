import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conversation } from './Conversation';

export enum ParticipantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  OBSERVER = 'observer',
}

@Entity('conversation_participants')
@Unique(['conversation_id', 'user_id'])
@Index(['user_id', 'left_at'])
@Index(['conversation_id', 'user_id'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  left_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_read_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  archived_at?: Date;

  @Column({ default: true })
  notifications_enabled: boolean;

  @Column({ default: false })
  is_muted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  muted_until?: Date;

  @Column({ nullable: true })
  nickname?: string;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  // Virtual fields
  user?: any; // Will be populated from user service
  unread_count?: number;
}