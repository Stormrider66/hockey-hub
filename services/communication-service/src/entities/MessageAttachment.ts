import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './Message';

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('message_attachments')
@Index(['message_id'])
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  message_id: string;

  @Column()
  url: string;

  @Column()
  file_name: string;

  @Column()
  file_type: string;

  @Column('bigint')
  file_size: number;

  @Column({ nullable: true })
  thumbnail_url?: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
  })
  type: AttachmentType;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @Column({ nullable: true })
  duration?: number; // For audio/video in seconds

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}