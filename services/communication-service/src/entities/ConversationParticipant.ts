import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Conversation } from './Conversation';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('conversation_participants')
@Index(['conversationId', 'userId'], { unique: true })
@Index(['userId']) // Index for quickly finding user's conversations
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    conversationId!: UUID;

    @Column({ type: 'uuid' })
    userId!: UUID;

    // Track when the user joined
    @CreateDateColumn({ type: 'timestamptz' })
    joinedAt!: ISODateString;

    // Track when the user last read messages in this conversation
    @Column({ type: 'timestamptz', nullable: true })
    lastReadAt?: ISODateString | null;

    // Optional: Track if user has muted this conversation
    @Column({ default: false })
    isMuted!: boolean;

    @ManyToOne(() => Conversation, conversation => conversation.participants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation!: Conversation;

    // Note: We don't link back to User entity directly across services

    // We don't typically need updatedAt for a join table like this
} 