import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('locations')
@Index(['organizationId', 'name'])
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    // Store address components directly
    @Column({ nullable: true })
    street?: string;

    @Column({ nullable: true })
    city?: string;

    @Column({ nullable: true })
    postalCode?: string;

    @Column({ nullable: true })
    country?: string;

    @Column({ nullable: true })
    stateProvince?: string;

    // Optional: Store coordinates for mapping
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude?: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude?: number;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt!: ISODateString;
} 