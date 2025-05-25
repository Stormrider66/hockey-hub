import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { DevelopmentPlanItem } from './DevelopmentPlanItem'; // Assuming items are linked here
import { GoalStatus as GoalStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('development_plans')
@Index(['organizationId', 'playerId'])
@Index(['teamId'])
@Index(['status'])
export class DevelopmentPlan {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID; // Plan is specific to a player

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null; // Team context when plan was created

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'enum', enum: GoalStatusEnum, default: GoalStatusEnum.NOT_STARTED })
    status!: GoalStatusEnum;

    @Column({ type: 'timestamptz', nullable: true })
    startDate?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    endDate?: ISODateString | null;

    // Relation to plan items
    @OneToMany(() => DevelopmentPlanItem, item => item.developmentPlan, { cascade: true, eager: false })
    items?: DevelopmentPlanItem[];

    @Column({ type: 'uuid', nullable: true })
    createdByUserId?: UUID | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 