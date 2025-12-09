import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './Conversation';
import { MessageAttachment } from './MessageAttachment';
import { MessageReaction } from './MessageReaction';
import { MessageReadReceipt } from './MessageReadReceipt';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
  LOCATION = 'location',
  SYSTEM = 'system',
  BROADCAST = 'broadcast',
  ANNOUNCEMENT = 'announcement',
}

@Entity('messages')
@Index(['conversation_id', 'created_at'])
@Index(['sender_id'])
@Index(['created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('uuid')
  sender_id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  edited_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  edited_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  deleted_by?: string;

  @Column('uuid', { nullable: true })
  reply_to_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ['sent', 'delivered', 'read'],
    enumName: 'message_status_enum',
    default: 'sent',
  })
  status: 'sent' | 'delivered' | 'read';

  // Encryption fields
  @Column({ default: false })
  is_encrypted: boolean;

  @Column({ type: 'text', nullable: true })
  encrypted_content?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  encryption_iv?: string;

  @Column({ type: 'text', nullable: true })
  encryption_key?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  encryption_algorithm?: string;

  @Column({ default: false })
  is_pinned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pinned_at?: Date;

  @Column('uuid', { nullable: true })
  pinned_by?: string;

  // For forwarded messages
  @Column('uuid', { nullable: true })
  forwarded_from_message_id?: string;

  @Column('uuid', { nullable: true })
  forwarded_from_conversation_id?: string;

  // Broadcast fields
  @Column('uuid', { nullable: true })
  broadcast_id?: string;

  @Column({
    type: 'enum',
    enum: ['normal', 'important', 'urgent'],
    enumName: 'broadcast_priority_enum',
    nullable: true,
  })
  broadcast_priority?: 'normal' | 'important' | 'urgent';

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  reply_to?: Message;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message)
  attachments: MessageAttachment[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];

  @OneToMany(() => MessageReadReceipt, (receipt) => receipt.message)
  read_receipts: MessageReadReceipt[];

  // Virtual fields (these are added at runtime from external sources)
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }; // Will be populated from user service
  is_read?: boolean;
  reaction_counts?: Record<string, number>;
}