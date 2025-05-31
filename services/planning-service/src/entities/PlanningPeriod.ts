import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('planning_periods')
@Index(['organizationId', 'season', 'startDate'])
export class PlanningPeriod {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column()
    season!: string;

    @Column()
    name!: string;

    @Column({ type: 'timestamptz' })
    startDate!: ISODateString;

    @Column({ type: 'timestamptz' })
    endDate!: ISODateString;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 