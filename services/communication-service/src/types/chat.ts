export type ChatType = 'private' | 'group';

export interface Chat {
    id: string; // UUID
    chatType: ChatType;
    name?: string; // Required for group chats
    createdByUserId?: string; // UUID, relevant for groups
    createdAt: Date;
    updatedAt: Date; // Timestamp of the last message
    // Potentially add last message snippet/timestamp here for chat list previews
    lastMessageContent?: string;
    lastMessageTimestamp?: Date;
    lastMessageSenderId?: string; // UUID
}

export interface ChatParticipant {
    chatId: string; // UUID
    userId: string; // UUID
    joinedAt: Date;
    // Permissions within the chat (e.g., 'admin', 'member')
    roleInChat?: string; 
    unreadCount?: number; // Denormalized count for UI efficiency
} 