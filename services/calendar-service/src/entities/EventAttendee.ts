import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Event } from './Event';
// Removed direct import of User entity from another service
import { UUID, ISODateString } from '@hockey-hub/types';

export enum AttendeeStatus {
    INVITED = 'invited',
    ATTENDING = 'attending',
    ABSENT = 'absent',
    MAYBE = 'maybe'
}

@Entity('event_attendees')
@Index(['eventId', 'userId'], { unique: true }) // Ensure user isn't added twice to same event
export class EventAttendee {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    eventId!: UUID;

    @Column({ type: 'uuid' })
    userId!: UUID;

    @Column({
        type: 'enum',
        enum: AttendeeStatus,
        default: AttendeeStatus.INVITED
    })
    status!: AttendeeStatus;

    @Column({ type: 'text', nullable: true })
    reasonForAbsence?: string | null;

    @ManyToOne(() => Event, event => event.attendees, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event!: Event;

    // Store only userId. Fetch user details from User service when needed.

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt!: ISODateString;
} 