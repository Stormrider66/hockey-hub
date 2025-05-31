import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Invoice } from './Invoice';
import { CurrencyCode as CurrencyCodeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('invoice_items')
@Index(['invoiceId'])
export class InvoiceItem {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    invoiceId!: UUID;

    @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'invoiceId' })
    invoice!: Invoice;

    @Column()
    description!: string;

    @Column({ type: 'integer' })
    quantity!: number;

    @Column({ type: 'bigint' }) // Smallest currency unit
    unitAmount!: number;

    @Column({ type: 'bigint' }) // Smallest currency unit
    totalAmount!: number;

    @Column({ type: 'enum', enum: CurrencyCodeEnum })
    currency!: CurrencyCodeEnum;

    @Column({ nullable: true })
    productId?: string | null;

    @Column({ nullable: true })
    subscriptionItemId?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 