import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString, PhoneString } from '@hockey-hub/types';

@Entity('player_medical_journals')
@Index(['organizationId'])
export class PlayerMedicalJournal {
    // Use playerId as the primary key, assuming 1:1 relationship
    @PrimaryColumn({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'text', nullable: true })
    allergies?: string | null;

    @Column({ type: 'text', nullable: true })
    chronicConditions?: string | null;

    @Column({ type: 'text', nullable: true })
    pastInjuriesSummary?: string | null;

    @Column({ type: 'text', nullable: true })
    medications?: string | null;

    @Column({ nullable: true })
    emergencyContactName?: string | null;

    @Column({ nullable: true })
    emergencyContactPhone?: PhoneString | null;

    @Column({ type: 'text', nullable: true })
    insuranceDetails?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 