import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './Payment';
import { CurrencyCode as CurrencyCodeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('refunds')
@Index(['paymentId'])
@Index(['organizationId'])
@Index(['providerRefundId'], { unique: true })
export class Refund {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    paymentId!: UUID;

    @ManyToOne(() => Payment, payment => payment.refunds, { onDelete: 'CASCADE' }) // If payment deleted, maybe keep refund? Or Cascade?
    @JoinColumn({ name: 'paymentId' })
    payment!: Payment;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'bigint' })
    amount!: number; // Smallest currency unit

    @Column({ type: 'enum', enum: CurrencyCodeEnum })
    currency!: CurrencyCodeEnum;

    @Column({ type: 'text', nullable: true })
    reason?: string | null;

    @Column({ type: 'enum', enum: ['succeeded', 'pending', 'failed'] })
    status!: 'succeeded' | 'pending' | 'failed';

    @Column({ unique: true })
    providerRefundId!: string;

    @Column({ type: 'timestamptz' })
    refundedAt!: ISODateString;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 