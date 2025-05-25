import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { UUID, ISODateString, UrlString, ExerciseCategory as ExerciseCategoryEnum } from '@hockey-hub/types';

export enum Difficulty { // Make sure 'export' is here
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
}

@Entity('exercises')
@Index(['organizationId', 'name'])
@Index(['created_by_user_id'])
@Index(['is_public'])
export class Exercise { // Make sure 'export' is here
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid', nullable: true })
    organizationId?: UUID | null; // Null indicates a global/system exercise

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({
        type: 'enum',
        enum: ExerciseCategoryEnum
    })
    category!: ExerciseCategoryEnum;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    videoUrl?: UrlString | null;

    @Column({ type: 'text', nullable: true })
    instructions?: string | null;

    // Using simple-array for basic lists
    @Column({ type: 'simple-array', nullable: true })
    muscleGroups?: string[];

    @Column({ type: 'simple-array', nullable: true })
    equipmentNeeded?: string[];

    @Column({
        type: 'enum',
        enum: Difficulty,
    })
    difficulty!: Difficulty;

    // creator and assets
    @Column({ type: 'varchar', length: 2048, nullable: true })
    imageUrl?: UrlString | null;

    @Column({ type: 'uuid' })
    createdByUserId!: UUID;

    @Column({ default: false })
    is_public!: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date | null;
}