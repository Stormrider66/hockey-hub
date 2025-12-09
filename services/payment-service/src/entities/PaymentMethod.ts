import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';

export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal'
}

@Entity('payment_methods')
@Index(['userId', 'isActive'])
@Index(['organizationId', 'isActive'])
@Index(['stripePaymentMethodId'], { unique: true, where: 'stripePaymentMethodId IS NOT NULL' })
export class PaymentMethod extends AuditableEntity {

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType
  })
  type: PaymentMethodType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  stripePaymentMethodId?: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  // Card details (masked)
  @Column({ nullable: true })
  brand?: string; // visa, mastercard, amex, etc.

  @Column({ nullable: true })
  last4?: string;

  @Column({ nullable: true })
  expMonth?: number;

  @Column({ nullable: true })
  expYear?: number;

  @Column({ nullable: true })
  holderName?: string;

  // Bank account details (masked)
  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  accountLast4?: string;

  @Column({ nullable: true })
  routingNumber?: string;

  // PayPal details
  @Column({ nullable: true })
  paypalEmail?: string;

  @Column('jsonb', { nullable: true })
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  isExpired(): boolean {
    if (this.type !== PaymentMethodType.CARD || !this.expMonth || !this.expYear) {
      return false;
    }
    
    const now = new Date();
    const expDate = new Date(this.expYear, this.expMonth - 1);
    return now > expDate;
  }

  getMaskedDisplay(): string {
    switch (this.type) {
      case PaymentMethodType.CARD:
        return `${this.brand || 'Card'} ending in ${this.last4 || 'XXXX'}`;
      case PaymentMethodType.BANK_ACCOUNT:
        return `${this.bankName || 'Bank Account'} ending in ${this.accountLast4 || 'XXXX'}`;
      case PaymentMethodType.PAYPAL:
        return `PayPal (${this.paypalEmail || 'unknown'})`;
      default:
        return 'Unknown payment method';
    }
  }
}