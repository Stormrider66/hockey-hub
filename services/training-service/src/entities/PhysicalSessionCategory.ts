import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { PhysicalSessionTemplate } from './PhysicalSessionTemplate';

@Entity('physical_session_categories')
@Index(['name', 'organizationId'], { unique: true })
export class PhysicalSessionCategory { // Make sure 'export' is here
    @PrimaryGeneratedColumn('uuid')
    id!: string; // Added '!'

    @Column()
    name!: string; // Added '!'

    @Column('uuid')
    created_by_user_id!: string; // Added '!'

    @Column('uuid')
    organization_id!: string; // Added '!'

    @CreateDateColumn()
    created_at!: Date; // Added '!'

    @UpdateDateColumn()
    updated_at!: Date; // Added '!'

    // Optional: Add relationship back to templates if needed
    @OneToMany(() => PhysicalSessionTemplate, template => template.category)
    templates?: Promise<PhysicalSessionTemplate[]>; // Use Promise for lazy loading
}