import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { ISODateString } from '@hockey-hub/types';

@Entity('system_settings')
export class SystemSetting {
    // Use setting key as primary key
    @PrimaryColumn({ type: 'varchar', length: 100 })
    key!: string;

    // Store value as JSONB to allow different types
    @Column({ type: 'jsonb' })
    value!: any;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 