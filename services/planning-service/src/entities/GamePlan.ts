import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('game_plans')
@Index(['organizationId', 'teamId', 'gameDate'])
@Index(['eventId'])
export class GamePlan {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid' })
    teamId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    eventId?: UUID | null;

    @Column()
    opponentName!: string;

    @Column({ type: 'timestamptz' })
    gameDate!: ISODateString;

    @Column({ type: 'text', nullable: true })
    strategyFocus?: string | null;

    @Column({ type: 'text', nullable: true })
    keyPoints?: string | null;

    // Store complex data like line combos and assignments as JSONB
    @Column({ type: 'jsonb', nullable: true })
    lineCombinations?: Record<string, UUID[]> | null;

    @Column({ type: 'jsonb', nullable: true })
    assignments?: Record<UUID, string> | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 