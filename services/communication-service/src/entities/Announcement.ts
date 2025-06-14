import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserRole, UUID, ISODateString } from '@hockey-hub/types';

@Entity('announcements')
@Index(['organizationId', 'publishDate'])
@Index(['teamId'])
export class Announcement {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column({ type: 'uuid' })
    authorId!: UUID;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    // Store roles as a simple array
    @Column({ type: 'simple-array', nullable: true })
    audienceRoles?: UserRole[] | null;

    // Store user IDs as a simple array
    @Column({ type: 'uuid', array: true, nullable: true })
    audienceUserIds?: UUID[] | null;

    @Column({ type: 'timestamptz' })
    publishDate!: ISODateString;

    @Column({ type: 'timestamptz', nullable: true })
    expiryDate?: ISODateString | null;

    @Column({ default: false })
    isPublished!: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 