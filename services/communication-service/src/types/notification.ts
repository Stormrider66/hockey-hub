export interface Notification {
    id: string; // UUID
    userId: string; // UUID of the recipient
    type: string; // e.g., 'new_message', 'event_reminder', 'status_update'
    title: string;
    message: string;
    entityType?: string; // e.g., 'event', 'chat', 'user'
    entityId?: string; // UUID of the related entity
    isRead: boolean;
    createdAt: Date;
} 