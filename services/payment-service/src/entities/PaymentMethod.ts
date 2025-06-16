import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PaymentMethodType as PaymentMethodTypeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('payment_methods')
@Index(['userId'])
@Index(['organizationId'])
@Index(['providerId'], { unique: true })
export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid', nullable: true })
    userId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    organizationId?: UUID | null;

    @Column({ type: 'varchar', unique: true })
    providerId!: string; // E.g., Stripe PaymentMethod ID pm_...

    @Column({ type: 'enum', enum: PaymentMethodTypeEnum })
    type!: PaymentMethodTypeEnum;

    @Column({ type: 'boolean', default: false })
    isDefault!: boolean;

    @Column({ type: 'varchar', nullable: true })
    billingName?: string | null;

    @Column({ type: 'varchar', nullable: true })
    cardBrand?: string | null;

    @Column({ type: 'varchar', nullable: true })
    cardLast4?: string | null;

    @Column({ type: 'integer', nullable: true })
    cardExpiryMonth?: number | null;

    @Column({ type: 'integer', nullable: true })
    cardExpiryYear?: number | null;

    @Column({ type: 'varchar', nullable: true })
    bankName?: string | null;

    @Column({ type: 'varchar', nullable: true })
    bankLast4?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 