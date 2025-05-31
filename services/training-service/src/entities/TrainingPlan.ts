import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('training_plans')
@Index(['organizationId', 'teamId', 'name'])
export class TrainingPlan {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'timestamptz' })
    startDate!: ISODateString;

    @Column({ type: 'timestamptz' })
    endDate!: ISODateString;

    @Column({ type: 'text', nullable: true })
    goal?: string | null;

    // Relation to sessions - sessions would link back via planId
    // @OneToMany(() => TrainingSession, session => session.trainingPlan)
    // sessions?: TrainingSession[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 