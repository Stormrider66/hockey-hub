import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ResourceType } from './ResourceType';
import { EventResource } from './EventResource';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('resources')
@Index(['organizationId', 'name'])
export class Resource {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column()
    name!: string; // E.g., "Main Rink", "Weight Room A", "Conference Room Blue"

    @Column({ type: 'uuid' })
    resourceTypeId!: UUID;

    @ManyToOne(() => ResourceType, { onDelete: 'RESTRICT' }) // Prevent deleting type if resources exist
    @JoinColumn({ name: 'resourceTypeId' })
    resourceType!: ResourceType;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'integer', nullable: true })
    capacity?: number | null;

    @Column({ default: true })
    isBookable!: boolean;

    // Other attributes like location, availability rules, etc. can be added

    @OneToMany(() => EventResource, eventResource => eventResource.resource)
    eventResources?: EventResource[]; // Events this resource is booked for

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 