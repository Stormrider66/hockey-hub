import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { Invoice } from './Invoice';
import { PaymentMethod } from './PaymentMethod';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund'
}

export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CASH = 'cash',
  OTHER = 'other'
}

@Entity('payments')
@Index(['organizationId', 'status'])
@Index(['userId', 'status'])
@Index(['transactionId'], { unique: true })
@Index(['createdAt', 'status'])
export class Payment extends AuditableEntity {

  @Column({ unique: true })
  transactionId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid', { nullable: true })
  invoiceId?: string;

  @ManyToOne(() => Invoice, invoice => invoice.payments, { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice;

  @Column('uuid', { nullable: true })
  paymentMethodId?: string;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentType
  })
  type: PaymentType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  failureReason?: string;

  @Column('timestamp')
  @Index()
  processedAt: Date;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ nullable: true })
  stripeChargeId?: string;

  @Column('jsonb', { nullable: true })
  processorResponse?: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;

  // Computed property
  get netAmount(): number {
    return this.amount - this.refundedAmount;
  }
}