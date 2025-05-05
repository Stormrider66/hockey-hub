import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DevelopmentPlan } from './DevelopmentPlan';
import { GoalStatus as GoalStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('development_plan_items')
@Index(['planId', 'category'])
@Index(['status'])
export class DevelopmentPlanItem {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    planId!: UUID;

    @ManyToOne(() => DevelopmentPlan, plan => plan.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'planId' })
    developmentPlan!: DevelopmentPlan;

    @Column() // E.g., "Skating", "Shooting", "Strength", "Nutrition"
    category!: string; 

    @Column({ type: 'text' })
    focusArea!: string; // E.g., "Edge Control", "Wrist Shot Accuracy", "Upper Body Power"

    @Column({ type: 'text', nullable: true })
    description?: string | null; // Specific drills or targets

    @Column({ type: 'enum', enum: GoalStatusEnum, default: GoalStatusEnum.NOT_STARTED })
    status!: GoalStatusEnum;

    @Column({ type: 'text', nullable: true })
    notes?: string | null; // Coach/Player notes on progress

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 