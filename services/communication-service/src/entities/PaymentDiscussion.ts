import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './Conversation';
import { Message } from './Message';

export enum PaymentDiscussionType {
  INVOICE = 'invoice',
  PAYMENT_PLAN = 'payment_plan',
  DISPUTE = 'dispute',
  RECEIPT_REQUEST = 'receipt_request',
  REFUND_REQUEST = 'refund_request',
  SEASONAL_FEES = 'seasonal_fees',
  GENERAL_INQUIRY = 'general_inquiry',
}

export enum PaymentDiscussionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('payment_discussions')
@Index(['paymentId', 'status'])
@Index(['parentUserId', 'createdAt'])
@Index(['organizationId', 'type'])
export class PaymentDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PaymentDiscussionType,
  })
  type: PaymentDiscussionType;

  @Column({
    type: 'enum',
    enum: PaymentDiscussionStatus,
    default: PaymentDiscussionStatus.OPEN,
  })
  status: PaymentDiscussionStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    nullable: true,
  })
  paymentStatus?: PaymentStatus;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Link to payment service data
  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  invoiceId?: string;

  @Column({ nullable: true })
  paymentPlanId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  outstandingAmount?: number;

  @Column({ nullable: true })
  currency?: string;

  // Participants
  @Column('uuid')
  parentUserId: string;

  @Column('uuid', { array: true, default: [] })
  billingStaffIds: string[];

  @Column('uuid')
  organizationId: string;

  @Column('uuid', { nullable: true })
  teamId?: string;

  // Related conversation
  @Column('uuid')
  conversationId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  // Payment plan negotiation details
  @Column({ type: 'jsonb', nullable: true })
  paymentPlanProposal?: {
    proposedBy: string;
    proposedAt: Date;
    installments: Array<{
      amount: number;
      dueDate: Date;
      description?: string;
    }>;
    notes?: string;
    approved?: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  };

  // Quick actions tracking
  @Column({ type: 'jsonb', nullable: true })
  quickActions?: {
    receiptRequested?: boolean;
    receiptRequestedAt?: Date;
    paymentPlanRequested?: boolean;
    paymentPlanRequestedAt?: Date;
    disputeRaised?: boolean;
    disputeRaisedAt?: Date;
    refundRequested?: boolean;
    refundRequestedAt?: Date;
  };

  // Attached documents
  @Column({ type: 'jsonb', nullable: true })
  attachedDocuments?: Array<{
    id: string;
    type: 'invoice' | 'receipt' | 'statement' | 'agreement' | 'other';
    fileName: string;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: Date;
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
  }>;

  // Audit trail
  @Column({ type: 'jsonb', default: [] })
  auditLog: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
    ipAddress?: string;
  }>;

  // Security and compliance
  @Column({ default: false })
  containsSensitiveInfo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  complianceFlags?: {
    requiresEncryption?: boolean;
    requiresSecureTransmission?: boolean;
    retentionPeriodDays?: number;
    lastComplianceCheck?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  resolvedBy?: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;

  // Metadata for additional context
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    relatedDiscussionIds?: string[];
    seasonalFeePeriod?: string;
    playerIds?: string[]; // For bulk discussions
    customFields?: Record<string, any>;
  };
}

export class PaymentDiscussionAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  paymentDiscussionId: string;

  @ManyToOne(() => PaymentDiscussion)
  @JoinColumn({ name: 'paymentDiscussionId' })
  paymentDiscussion: PaymentDiscussion;

  @Column('uuid')
  messageId: string;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column()
  fileName: string;

  @Column()
  fileType: string;

  @Column()
  fileSize: number;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: ['invoice', 'receipt', 'statement', 'agreement', 'other'],
  })
  documentType: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedBy?: string;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column('uuid')
  uploadedBy: string;
}