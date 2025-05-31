import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Invoice } from './Invoice';
import { Subscription } from './Subscription';
import { PaymentMethod } from './PaymentMethod';
import { Refund } from './Refund';
import { PaymentStatus as PaymentStatusEnum, CurrencyCode as CurrencyCodeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('payments')
@Index(['organizationId'])
@Index(['userId'])
@Index(['invoiceId'])
@Index(['subscriptionId'])
@Index(['providerPaymentId'], { unique: true })
@Index(['status'])
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid', nullable: true })
    invoiceId?: UUID | null;

    @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'invoiceId' })
    invoice?: Invoice | null;

    @Column({ type: 'uuid', nullable: true })
    subscriptionId?: UUID | null;

    @ManyToOne(() => Subscription, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'subscriptionId' })
    subscription?: Subscription | null;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    userId?: UUID | null;

    @Column({ type: 'bigint' })
    amount!: number; // Smallest currency unit

    @Column({ type: 'enum', enum: CurrencyCodeEnum })
    currency!: CurrencyCodeEnum;

    @Column({ type: 'enum', enum: PaymentStatusEnum })
    status!: PaymentStatusEnum;

    @Column({ type: 'uuid', nullable: true })
    paymentMethodId?: UUID | null; // Link to our internal payment method record

    @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'paymentMethodId' })
    paymentMethod?: PaymentMethod | null;

    @Column({ unique: true })
    providerPaymentId!: string; // Stripe Charge ID / PaymentIntent ID

    @Column({ nullable: true })
    providerPaymentMethodId?: string | null;

    @Column({ type: 'timestamptz' })
    paidAt!: ISODateString;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @OneToMany(() => Refund, refund => refund.payment)
    refunds?: Refund[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 