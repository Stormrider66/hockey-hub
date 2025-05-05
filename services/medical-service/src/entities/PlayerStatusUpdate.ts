import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Injury } from './Injury';
import { PlayerAvailabilityStatus as PlayerAvailabilityStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('player_status_updates')
@Index(['playerId', 'effectiveDate'])
@Index(['organizationId'])
@Index(['status'])
@Index(['relatedInjuryId'])
export class PlayerStatusUpdate {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'enum', enum: PlayerAvailabilityStatusEnum })
    status!: PlayerAvailabilityStatusEnum;

    @Column({ type: 'text', nullable: true })
    reason?: string | null;

    @Column({ type: 'uuid', nullable: true })
    relatedInjuryId?: UUID | null;

    @ManyToOne(() => Injury, injury => injury.statusUpdates, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'relatedInjuryId' })
    relatedInjury?: Injury | null;

    @Column({ type: 'timestamptz' })
    effectiveDate!: ISODateString;

    @Column({ type: 'uuid' })
    updatedById!: UUID;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 