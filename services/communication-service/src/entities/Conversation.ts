import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ChatMessage } from './ChatMessage';
import { ConversationParticipant } from './ConversationParticipant';
import { ConversationType as ConversationTypeEnum, UUID, ISODateString, UrlString } from '@hockey-hub/types';

@Entity('conversations')
@Index(['organizationId', 'type'])
@Index(['teamId'])
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'enum', enum: ConversationTypeEnum })
    type!: ConversationTypeEnum;

    @Column({ nullable: true })
    name?: string | null;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    avatarUrl?: UrlString | null;

    // Use a separate join entity for participants
    @OneToMany(() => ConversationParticipant, participant => participant.conversation)
    participants?: ConversationParticipant[];

    @Column({ type: 'uuid', nullable: true })
    lastMessageId?: UUID | null;

    // Consider adding a LastMessage relation or denormalizing timestamp
    @Column({ type: 'timestamptz', nullable: true })
    lastMessageAt?: ISODateString | null;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 