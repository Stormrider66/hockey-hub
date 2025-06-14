import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './Game';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('player_game_stats')
@Index(['playerId', 'gameId'], { unique: true })
@Index(['teamId'])
@Index(['gameId'])
@Index(['organizationId'])
export class PlayerGameStats {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid' })
    teamId!: UUID;

    @Column({ type: 'uuid' })
    gameId!: UUID;

    @ManyToOne(() => Game, { onDelete: 'CASCADE' }) // Delete stats if game is deleted
    @JoinColumn({ name: 'gameId' })
    game!: Game;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    opponentTeamId?: UUID | null;

    @Column({ type: 'varchar', nullable: true })
    opponentName?: string | null;

    @Column({ type: 'timestamptz' })
    gameDate!: ISODateString;

    // Common Skater Stats
    @Column({ type: 'integer', nullable: true, default: 0 })
    goals?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    assists?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    points?: number | null;

    @Column({ type: 'integer', nullable: true })
    plusMinus?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    penaltyMinutes?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shotsOnGoal?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shotAttempts?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    hits?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    blockedShots?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    faceoffsWon?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    faceoffsLost?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    timeOnIceSeconds?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    powerPlayTimeOnIceSeconds?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shorthandedTimeOnIceSeconds?: number | null;

    // Goalie Stats
    @Column({ type: 'integer', nullable: true, default: 0 })
    timeOnIceGoalieSeconds?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shotsAgainst?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    goalsAgainst?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    saves?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
    savePercentage?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    goalsAgainstAverage?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shutouts?: number | null;

    // Advanced Stats (placeholders, might be calculated on demand)
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    corsiForPercentage?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    fenwickForPercentage?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    zoneStartsOffensivePercentage?: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    pdo?: number | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 