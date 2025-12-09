import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum RuleType {
  KEYWORD_FILTER = 'keyword_filter',
  PATTERN_MATCH = 'pattern_match',
  CONTENT_LENGTH = 'content_length',
  RATE_LIMIT = 'rate_limit',
  ATTACHMENT_FILTER = 'attachment_filter',
  LINK_FILTER = 'link_filter'
}

export enum RuleAction {
  FLAG_FOR_REVIEW = 'flag_for_review',
  AUTO_DELETE = 'auto_delete',
  AUTO_MUTE = 'auto_mute',
  REQUIRE_APPROVAL = 'require_approval',
  QUARANTINE = 'quarantine'
}

export enum RuleSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('moderation_rules')
@Index(['isActive'])
@Index(['ruleType'])
@Index(['severity'])
export class ModerationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: RuleType
  })
  ruleType: RuleType;

  @Column({
    type: 'enum',
    enum: RuleAction
  })
  action: RuleAction;

  @Column({
    type: 'enum',
    enum: RuleSeverity,
    default: RuleSeverity.MEDIUM
  })
  severity: RuleSeverity;

  @Column({ type: 'json' })
  criteria: {
    keywords?: string[];
    patterns?: string[];
    maxLength?: number;
    maxMessagesPerMinute?: number;
    allowedFileTypes?: string[];
    blockedDomains?: string[];
    customRegex?: string;
  };

  @Column({ type: 'json', nullable: true })
  exceptions: {
    roles?: string[];
    users?: string[];
    conversationTypes?: string[];
    timeRanges?: Array<{
      start: string;
      end: string;
      days: string[];
    }>;
  } | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column('uuid')
  @Index()
  createdBy: string;

  @Column('uuid', { nullable: true })
  @Index()
  updatedBy: string | null;

  @Column({ type: 'json', nullable: true })
  statistics: {
    triggeredCount?: number;
    lastTriggered?: string;
    falsePositives?: number;
    effectiveness?: number;
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}