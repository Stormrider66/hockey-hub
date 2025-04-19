import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { PhysicalSessionCategory } from './PhysicalSessionCategory'; // This entity also needs to exist

@Entity('physical_session_templates')
@Index(['categoryId', 'organizationId'])
export class PhysicalSessionTemplate { // Make sure 'export' is here
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column('uuid')
    categoryId!: string;

    // If PhysicalSessionCategory.ts doesn't exist yet, this will cause an error later
    @ManyToOne(() => PhysicalSessionCategory, { lazy: true, nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category!: Promise<PhysicalSessionCategory | null>;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column('uuid')
    created_by_user_id!: string;

    @Column('jsonb')
    structure!: object;

    @Column({ default: false })
    is_public!: boolean;

    @Column('uuid')
    organization_id!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at!: Date;
}