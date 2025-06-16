import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('resource_types')
@Index(['organizationId', 'name'], { unique: true })
export class ResourceType {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ unique: true })
    name!: string; // E.g., "Ice Rink", "Gym", "Meeting Room", "Bus"

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    // Add any specific attributes for resource types if needed
    // e.g., defaultCapacity?: number;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt!: ISODateString;
} 