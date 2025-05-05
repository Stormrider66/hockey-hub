import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { SubscriptionPlan } from './SubscriptionPlan';
import { SubscriptionStatus as SubscriptionStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('subscriptions')
@Index(['organizationId'], { unique: true }) // Usually one active subscription per org
@Index(['planId'])
@Index(['status'])
@Index(['providerSubscriptionId'], { unique: true })
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid', unique: true })
    organizationId!: UUID;

    @Column({ type: 'uuid' })
    planId!: UUID;

    @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' }) // Don't delete plan if subscriptions exist
    @JoinColumn({ name: 'planId' })
    plan!: SubscriptionPlan;

    @Column({ type: 'enum', enum: SubscriptionStatusEnum })
    status!: SubscriptionStatusEnum;

    @Column({ type: 'timestamptz' })
    currentPeriodStart!: ISODateString;

    @Column({ type: 'timestamptz' })
    currentPeriodEnd!: ISODateString;

    @Column({ default: false })
    cancelAtPeriodEnd!: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    cancelledAt?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    trialEndsAt?: ISODateString | null;

    @Column({ unique: true })
    providerSubscriptionId!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 