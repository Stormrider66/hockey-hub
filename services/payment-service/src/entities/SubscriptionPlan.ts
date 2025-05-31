import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CurrencyCode as CurrencyCodeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('subscription_plans')
@Index(['name'], { unique: true })
@Index(['isActive'])
export class SubscriptionPlan {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'integer' }) // Store price in smallest unit (e.g., öre, cents)
    price!: number;

    @Column({ type: 'enum', enum: CurrencyCodeEnum })
    currency!: CurrencyCodeEnum;

    @Column({ type: 'enum', enum: ['month', 'year'] })
    billingInterval!: 'month' | 'year';

    @Column({ type: 'simple-array', nullable: true })
    features?: string[];

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    providerPlanId?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 