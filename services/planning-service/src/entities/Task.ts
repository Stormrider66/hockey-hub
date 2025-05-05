import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, Tree, TreeChildren, TreeParent } from 'typeorm';
import { StrategicGoal } from './StrategicGoal';
import { GoalStatus as GoalStatusEnum, TaskPriority as TaskPriorityEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('tasks')
@Index(['organizationId', 'status'])
@Index(['goalId'])
@Index(['assigneeId'])
@Index(['dueDate'])
@Tree('materialized-path') // For handling parent-child (sub-task) relationships
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    goalId?: UUID | null;

    @ManyToOne(() => StrategicGoal, goal => goal.tasks, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'goalId' })
    goal?: StrategicGoal | null;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'enum', enum: GoalStatusEnum, default: GoalStatusEnum.NOT_STARTED })
    status!: GoalStatusEnum;

    @Column({ type: 'enum', enum: TaskPriorityEnum, default: TaskPriorityEnum.MEDIUM })
    priority!: TaskPriorityEnum;

    @Column({ type: 'uuid', nullable: true })
    assigneeId?: UUID | null;

    @Column({ type: 'timestamptz', nullable: true })
    dueDate?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    completionDate?: ISODateString | null;

    // Self-referencing relationship for sub-tasks
    @TreeChildren()
    subTasks?: Task[];

    @TreeParent({ onDelete: 'CASCADE' }) // If parent task is deleted, delete sub-tasks
    parent?: Task | null;
    
    @Column({ nullable: true })
    parentId?: UUID | null; // Explicit parentId column can be useful

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 