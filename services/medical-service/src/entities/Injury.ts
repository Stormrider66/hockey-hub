import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { MedicalNote } from './MedicalNote';
import { PlayerStatusUpdate } from './PlayerStatusUpdate';
import { InjuryType as InjuryTypeEnum, InjuryStatus as InjuryStatusEnum, InjurySeverity as InjurySeverityEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('injuries')
@Index(['playerId', 'dateOfInjury'])
@Index(['organizationId'])
@Index(['status'])
@Index(['injuryType'])
export class Injury {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'enum', enum: InjuryTypeEnum })
    injuryType!: InjuryTypeEnum;

    @Column()
    bodyPart!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'enum', enum: InjuryStatusEnum })
    status!: InjuryStatusEnum;

    @Column({ type: 'enum', enum: InjurySeverityEnum })
    severity!: InjurySeverityEnum;

    @Column({ type: 'timestamptz' })
    dateOfInjury!: ISODateString;

    @Column({ nullable: true })
    expectedRecoveryTime?: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    actualRecoveryDate?: ISODateString | null;

    @Column({ type: 'uuid', nullable: true })
    reportedById?: UUID | null;

    // Relations
    @OneToMany(() => MedicalNote, note => note.injury)
    medicalNotes?: MedicalNote[];

    @OneToMany(() => PlayerStatusUpdate, update => update.relatedInjury)
    statusUpdates?: PlayerStatusUpdate[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 