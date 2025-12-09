import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Message } from './Message';

@Entity('message_mentions')
@Index(['message_id'])
export class MessageMention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  message_id: string;

  @Column('uuid')
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Message, (message) => message.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}


