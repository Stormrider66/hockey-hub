import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { InvoiceItem } from './InvoiceItem';
import { InvoiceStatus as InvoiceStatusEnum, CurrencyCode as CurrencyCodeEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('invoices')
@Index(['organizationId', 'status'])
@Index(['userId'])
@Index(['invoiceNumber'], { unique: true })
@Index(['providerInvoiceId'], { unique: true, sparse: true }) // Unique if not null
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    userId?: UUID | null;

    @Column({ type: 'enum', enum: InvoiceStatusEnum })
    status!: InvoiceStatusEnum;

    @Column({ unique: true })
    invoiceNumber!: string;

    @Column({ type: 'enum', enum: CurrencyCodeEnum })
    currency!: CurrencyCodeEnum;

    @Column({ type: 'bigint' }) // Use bigint for monetary values to avoid precision issues
    totalAmount!: number; // In smallest currency unit (e.g., öre, cents)

    @Column({ type: 'bigint', default: 0 })
    amountDue!: number;

    @Column({ type: 'bigint', default: 0 })
    amountPaid!: number;

    @Column({ type: 'bigint', default: 0 })
    amountRemaining!: number;

    @Column({ type: 'timestamptz', nullable: true })
    dueDate?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    paidDate?: ISODateString | null;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    invoicePdfUrl?: string | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    providerInvoiceId?: string | null;

    @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true, eager: false })
    items?: InvoiceItem[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 