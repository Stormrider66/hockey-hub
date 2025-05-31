import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('admin_logs')
@Index(['adminUserId'])
@Index(['action'])
@Index(['targetEntityType', 'targetEntityId'])
export class AdminLog {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    adminUserId!: UUID; // User ID of the admin performing the action

    @Column()
    action!: string; // E.g., 'CREATE_ORGANIZATION', 'UPDATE_USER_STATUS', 'DELETE_TEAM'

    @Column({ nullable: true })
    targetEntityType?: string | null; // E.g., 'Organization', 'User', 'Team'

    @Column({ type: 'uuid', nullable: true })
    targetEntityId?: UUID | null;

    @Column({ type: 'text', nullable: true })
    details?: string | null; // Additional details about the action

    // Store original and new state as JSONB for audit trail
    @Column({ type: 'jsonb', nullable: true })
    oldValue?: Record<string, any> | null;

    @Column({ type: 'jsonb', nullable: true })
    newValue?: Record<string, any> | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;
} 