import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export enum Difficulty { // Make sure 'export' is here
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
}

@Entity('exercises')
@Index(['category', 'difficulty'])
@Index(['created_by_user_id'])
@Index(['organization_id'])
@Index(['is_public'])
export class Exercise { // Make sure 'export' is here
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column({
        type: 'enum',
        enum: Difficulty,
    })
    difficulty: Difficulty;

    @Column('varchar', { array: true, nullable: true })
    equipment: string[];

    @Column('varchar', { array: true, nullable: true })
    muscle_groups: string[];

    @Column('text')
    description: string;

    @Column('text')
    instructions: string;

    @Column({ nullable: true })
    video_url: string;

    @Column({ nullable: true })
    image_url: string;

    @Column('uuid')
    created_by_user_id: string;

    @Column('uuid', { nullable: true })
    organization_id: string;

    @Column({ default: false })
    is_public: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;
}