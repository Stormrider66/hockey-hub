import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('player_training_loads')
@Index(['playerId', 'date'])
@Index(['sessionId'])
@Index(['planId'])
export class PlayerTrainingLoad {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    sessionId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    planId?: UUID | null;

    @Column({ type: 'timestamptz' })
    date!: ISODateString;

    @Column({ type: 'integer' })
    durationMinutes!: number;

    @Column({ type: 'integer', nullable: true })
    rpe?: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    internalLoad?: number | null;

    // Store complex external load data as JSONB
    @Column({ type: 'jsonb', nullable: true })
    externalLoadMetrics?: Record<string, any> | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 