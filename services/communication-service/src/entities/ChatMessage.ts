import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Conversation } from './Conversation';
import { MessageType as MessageTypeEnum, MessageStatus as MessageStatusEnum, UUID, ISODateString } from '@hockey-hub/types';

@Entity('chat_messages')
@Index(['conversationId', 'createdAt']) // Index for fetching messages in order
@Index(['senderId'])
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    conversationId!: UUID;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' }) // Delete messages if conversation is deleted
    @JoinColumn({ name: 'conversationId' })
    conversation!: Conversation;

    @Column({ type: 'uuid' })
    senderId!: UUID;

    @Column({ type: 'enum', enum: MessageTypeEnum })
    messageType!: MessageTypeEnum;

    @Column({ type: 'text' })
    content!: string; // Text or URL

    @Column({ type: 'enum', enum: MessageStatusEnum, default: MessageStatusEnum.SENT })
    status!: MessageStatusEnum;

    // Store readers as a simple array of UUIDs
    @Column({ type: 'uuid', array: true, default: [] })
    readBy!: UUID[];

    // Store metadata as JSONB
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any> | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 