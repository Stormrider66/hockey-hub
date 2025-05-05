import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { Task } from './Task';
import { GoalType as GoalTypeEnum, GoalStatus as GoalStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('strategic_goals')
@Index(['organizationId', 'type'])
@Index(['teamId'])
@Index(['playerId'])
@Index(['ownerId'])
@Index(['status'])
export class StrategicGoal {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    playerId?: UUID | null;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'enum', enum: GoalTypeEnum })
    type!: GoalTypeEnum;

    @Column({ type: 'enum', enum: GoalStatusEnum, default: GoalStatusEnum.NOT_STARTED })
    status!: GoalStatusEnum;

    @Column({ type: 'timestamptz', nullable: true })
    startDate?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    targetDate?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    completionDate?: ISODateString | null;

    @Column({ type: 'jsonb', nullable: true })
    metrics?: Record<string, any> | null;

    @Column({ type: 'uuid', nullable: true })
    ownerId?: UUID | null;

    // Relation to tasks linked to this goal
    @OneToMany(() => Task, task => task.goal)
    tasks?: Task[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 