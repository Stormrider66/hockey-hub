export type MessageType = 'text' | 'image' | 'file' | 'system'; // System messages for joins/leaves etc.

export interface Message {
    id: string; // UUID or potentially a sequence number per chat
    chatId: string; // UUID
    senderId: string; // UUID (could be 'system' for system messages)
    messageType: MessageType;
    content?: string; // Text content
    attachmentUrl?: string; // URL for images/files
    attachmentMetadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        thumbnailUrl?: string; // For image previews
    };
    createdAt: Date;
    // Optional: Add read receipts directly here or use a separate table
    readBy?: string[]; // Array of User IDs who have read the message
}

// Represents the status of a message for a specific user
export interface MessageReadStatus {
    messageId: string; // UUID
    userId: string; // UUID
    chatId: string; // UUID (for partitioning/indexing)
    readAt: Date;
} 