import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Event } from './Event';
// Removed direct import of User entity from another service
import { AttendeeStatus as AttendeeStatusEnum } from '@hockey-hub/types';
import { UUID, ISODateString } from '@hockey-hub/types';

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
        enum: AttendeeStatusEnum,
        default: AttendeeStatusEnum.INVITED
    })
    status!: AttendeeStatusEnum;

    @Column({ type: 'text', nullable: true })
    reasonForAbsence?: string | null;

    @ManyToOne(() => Event, event => event.attendees, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' })
    event!: Event;

    // Store only userId. Fetch user details from User service when needed.

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 