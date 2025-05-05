import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './Game';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('team_game_stats')
@Index(['teamId', 'gameId'], { unique: true })
@Index(['gameId'])
@Index(['organizationId'])
export class TeamGameStats {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

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

    @Column({ nullable: true })
    opponentName?: string | null;

    @Column({ type: 'timestamptz' })
    gameDate!: ISODateString;

    @Column()
    isHomeGame!: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    result?: 'win' | 'loss' | 'otl' | 'tie' | 'scheduled' | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    scoreFor?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    scoreAgainst?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shotsFor?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    shotsAgainst?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    powerPlayGoalsFor?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    powerPlayOpportunities?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    powerPlayGoalsAgainst?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    timesShorthanded?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    faceoffsWon?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    faceoffsLost?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    hitsFor?: number | null;

    @Column({ type: 'integer', nullable: true, default: 0 })
    hitsAgainst?: number | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 