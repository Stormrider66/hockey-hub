import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Message } from './Message';

@Entity('message_read_receipts')
@Index(['message_id'])
@Index(['user_id'])
export class MessageReadReceipt {
  @PrimaryColumn('uuid')
  message_id: string;

  @PrimaryColumn('uuid')
  user_id: string;

  @CreateDateColumn()
  read_at: Date;

  // Relations
  @ManyToOne(() => Message, (message) => message.read_receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  // Virtual fields
  user?: any; // Will be populated from user service
}