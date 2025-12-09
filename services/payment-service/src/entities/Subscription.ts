import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { Invoice } from './Invoice';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid'
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual'
}

export enum SubscriptionTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

@Entity('subscriptions')
@Index(['organizationId', 'status'])
@Index(['currentPeriodEnd', 'status'])
@Index(['stripeSubscriptionId'], { unique: true, where: 'stripeSubscriptionId IS NOT NULL' })
export class Subscription extends AuditableEntity {

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionTier
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: BillingInterval
  })
  billingInterval: BillingInterval;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column('timestamp')
  @Index()
  currentPeriodStart: Date;

  @Column('timestamp')
  @Index()
  currentPeriodEnd: Date;

  @Column('timestamp', { nullable: true })
  trialStart?: Date;

  @Column('timestamp', { nullable: true })
  trialEnd?: Date;

  @Column('timestamp', { nullable: true })
  cancelledAt?: Date;

  @Column('timestamp', { nullable: true })
  endedAt?: Date;

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column('jsonb')
  features: {
    maxUsers: number;
    maxTeams: number;
    maxPlayers: number;
    hasAdvancedAnalytics: boolean;
    hasVideoAnalysis: boolean;
    hasMedicalTracking: boolean;
    hasCustomReports: boolean;
    supportLevel: 'basic' | 'priority' | 'dedicated';
    dataRetentionDays: number;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Invoice, invoice => invoice.subscription)
  invoices: Invoice[];

  // Helper methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || 
           this.status === SubscriptionStatus.TRIALING;
  }

  isInTrial(): boolean {
    return this.status === SubscriptionStatus.TRIALING && 
           this.trialEnd && 
           new Date() < new Date(this.trialEnd);
  }

  daysUntilRenewal(): number {
    const now = new Date();
    const end = new Date(this.currentPeriodEnd);
    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}