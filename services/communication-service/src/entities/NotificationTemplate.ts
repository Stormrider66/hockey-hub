import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType, NotificationChannel } from './Notification';

export enum TemplateFormat {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

@Entity('notification_templates')
@Index(['type', 'channel'])
@Index(['organization_id'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column('uuid', { nullable: true })
  organization_id?: string;

  // Template content
  @Column('varchar', { length: 255 })
  subject_template: string;

  @Column('text')
  body_template: string;

  @Column({
    type: 'enum',
    enum: TemplateFormat,
    default: TemplateFormat.TEXT,
  })
  format: TemplateFormat;

  // Template variables
  @Column({ type: 'jsonb', nullable: true })
  variables?: string[];

  @Column({ type: 'jsonb', nullable: true })
  default_values?: Record<string, any>;

  // Localization
  @Column('varchar', { length: 10, default: 'en' })
  language: string;

  // Template settings
  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_system_template: boolean;

  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid', { nullable: true })
  created_by?: string;

  @Column('uuid', { nullable: true })
  updated_by?: string;
}