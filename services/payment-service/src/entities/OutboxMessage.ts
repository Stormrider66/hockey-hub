import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('outbox_messages')
export class OutboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: UUID;

  @Column()
  topic!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: ISODateString;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: ISODateString;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: ISODateString | null;

  @Column({ default: 0 })
  attemptCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  nextAttemptAt?: ISODateString | null;
} 