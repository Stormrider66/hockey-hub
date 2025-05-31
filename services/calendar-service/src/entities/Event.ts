import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Location } from './Location';
import { EventAttendee } from './EventAttendee';
import { EventResource } from './EventResource';
import { EventType as EventTypeEnum, EventStatus as EventStatusEnum, EventRepetition as EventRepetitionEnum } from '@hockey-hub/types';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('events')
@Index(['organizationId', 'startTime'])
@Index(['organizationId', 'eventType'])
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;
    // Relation to Organization can be resolved via API call to User Service when needed.

    // Store team IDs as an array of UUIDs
    @Column({ type: 'uuid', array: true, nullable: true })
    teamIds?: UUID[];

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({
        type: 'enum',
        enum: EventTypeEnum,
    })
    eventType!: EventTypeEnum;

    @Column({
        type: 'enum',
        enum: EventStatusEnum,
        default: EventStatusEnum.PLANNED
    })
    status!: EventStatusEnum;

    @Column({ type: 'datetime' })
    startTime!: ISODateString;

    @Column({ type: 'datetime' })
    endTime!: ISODateString;

    @Column({ default: false })
    isAllDay!: boolean;

    @Column({ type: 'uuid', nullable: true })
    locationId?: UUID | null;

    @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'locationId' })
    location?: Location;

    // If storing denormalized address directly
    // @Column({ type: 'jsonb', nullable: true })
    // locationDetails?: { street: string; city: string; postalCode: string; country: string; stateProvince?: string };

    @Column({ type: 'varchar', length: 2048, nullable: true })
    locationUrl?: string | null;

    @OneToMany(() => EventResource, eventResource => eventResource.event)
    eventResources?: EventResource[]; // Resources booked for this event

    @OneToMany(() => EventAttendee, attendee => attendee.event)
    attendees?: EventAttendee[];

    // Store attendee IDs directly if simpler access needed?
    // @Column({ type: 'uuid', array: true, nullable: true })
    // requiredAttendeeIds?: UUID[]; 
    // @Column({ type: 'uuid', array: true, nullable: true })
    // optionalAttendeeIds?: UUID[]; 

    @Column({
        type: 'enum',
        enum: EventRepetitionEnum,
        default: EventRepetitionEnum.NONE
    })
    repetition!: EventRepetitionEnum;

    @Column({ type: 'datetime', nullable: true })
    repetitionEndDate?: ISODateString | null;

    @Column({ type: 'uuid', nullable: true })
    parentId?: UUID | null; // Link to the parent recurring event template

    // Foreign keys to other services (store only ID)
    @Column({ type: 'uuid', nullable: true })
    relatedTrainingSessionId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    relatedGameId?: UUID | null;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt!: ISODateString;
} 