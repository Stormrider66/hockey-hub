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
import { Message } from './Message';

@Entity('message_reactions')
@Unique(['message_id', 'user_id', 'emoji'])
@Index(['message_id'])
@Index(['user_id'])
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  message_id: string;

  @Column('uuid')
  user_id: string;

  @Column({ length: 50 })
  emoji: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  // Virtual fields
  user?: any; // Will be populated from user service
}