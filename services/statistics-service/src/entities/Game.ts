import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

// Minimal Game entity to link stats together
// More details might live in Calendar or Planning services

@Entity('games')
@Index(['organizationId', 'gameDate'])
@Index(['homeTeamId'])
@Index(['awayTeamId'])
@Index(['eventId'])
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    eventId?: UUID | null; // Link to Calendar service event

    @Column({ type: 'timestamptz' })
    gameDate!: ISODateString;

    @Column({ type: 'uuid' })
    homeTeamId!: UUID;

    @Column({ type: 'uuid' })
    awayTeamId!: UUID;

    @Column({ nullable: true })
    homeScore?: number | null;

    @Column({ nullable: true })
    awayScore?: number | null;

    @Column({ nullable: true })
    status?: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 