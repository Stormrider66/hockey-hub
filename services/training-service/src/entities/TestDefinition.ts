import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('physical_test_definitions')
export class TestDefinition {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 100 })
    category!: string;

    @Column({ name: 'is_on_ice', type: 'boolean', default: false })
    is_on_ice!: boolean;

    @Column({ type: 'text', nullable: true })
    protocol?: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updated_at!: Date;
} 