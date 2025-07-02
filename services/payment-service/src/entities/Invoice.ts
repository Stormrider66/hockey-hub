import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { Subscription } from './Subscription';
import { Payment } from './Payment';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

@Entity('invoices')
@Index(['organizationId', 'status'])
@Index(['userId', 'status'])
@Index(['dueDate', 'status'])
@Index(['invoiceNumber'], { unique: true })
export class Invoice extends AuditableEntity {

  @Column({ unique: true })
  invoiceNumber: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid', { nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Subscription, subscription => subscription.invoices, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: Subscription;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  status: InvoiceStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column()
  currency: string;

  @Column('jsonb')
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxable: boolean;
  }>;

  @Column('date')
  @Index()
  issueDate: Date;

  @Column('date')
  @Index()
  dueDate: Date;

  @Column('date', { nullable: true })
  paidDate?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  billingAddress?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];

  // Computed property
  get balanceDue(): number {
    return this.totalAmount - this.paidAmount;
  }
}