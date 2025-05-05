import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Event } from './Event';
import { Resource } from './Resource';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('event_resources')
@Index(['eventId', 'resourceId'], { unique: true }) // Ensure a resource isn't booked twice for the same event
export class EventResource {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    eventId!: UUID;

    @Column({ type: 'uuid' })
    resourceId!: UUID;

    // Optional: Store booking time if different from event time?
    // @Column({ type: 'timestamptz', nullable: true })
    // bookingStartTime?: ISODateString;
    // @Column({ type: 'timestamptz', nullable: true })
    // bookingEndTime?: ISODateString;

    @ManyToOne(() => Event, event => event.eventResources, { onDelete: 'CASCADE' }) // Delete booking if event is deleted
    @JoinColumn({ name: 'eventId' })
    event!: Event;

    @ManyToOne(() => Resource, resource => resource.eventResources, { onDelete: 'CASCADE' }) // Delete booking if resource is deleted
    @JoinColumn({ name: 'resourceId' })
    resource!: Resource;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    // No UpdateDateColumn needed for a simple join table usually
} 