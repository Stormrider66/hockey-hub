import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TestDefinition } from './TestDefinition';

@Entity('physical_test_results')
export class TestResult {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'player_id', type: 'uuid' })
    player_id!: string;

    @Column({ name: 'test_definition_id', type: 'uuid' })
    test_definition_id!: string;

    @ManyToOne(() => TestDefinition, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'test_definition_id' })
    test_definition!: TestDefinition;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    value!: number;

    @Column({ type: 'timestamptz' })
    timestamp!: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updated_at!: Date;
} 