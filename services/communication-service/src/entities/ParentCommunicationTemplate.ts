import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { CommunicationType, CommunicationCategory } from './ParentCommunication';

@Entity('parent_communication_templates')
@Index(['organizationId', 'isActive'])
@Index(['organizationId', 'category'])
export class ParentCommunicationTemplate extends BaseEntity {
  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CommunicationType
  })
  type: CommunicationType;

  @Column({
    type: 'enum',
    enum: CommunicationCategory
  })
  category: CommunicationCategory;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  variables?: string[];

  @Column({ type: 'json', nullable: true })
  actionItemTemplates?: {
    description: string;
    defaultAssignee?: string;
    defaultDueDays?: number;
  }[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}