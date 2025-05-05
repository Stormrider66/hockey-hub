import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { NotificationType, NotificationChannel, NotificationStatus, UUID, ISODateString } from '@hockey-hub/types';

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['type'])
@Index(['channel'])
@Index(['relatedEntityId', 'relatedEntityType'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    userId!: UUID; // The recipient

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'enum', enum: NotificationType })
    type!: NotificationType;

    @Column({ type: 'enum', enum: NotificationChannel })
    channel!: NotificationChannel;

    @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
    status!: NotificationStatus;

    @Column({ nullable: true })
    title?: string | null;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'uuid', nullable: true })
    relatedEntityId?: UUID | null;

    @Column({ nullable: true })
    relatedEntityType?: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    sentAt?: ISODateString | null;

    @Column({ type: 'timestamptz', nullable: true })
    readAt?: ISODateString | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 