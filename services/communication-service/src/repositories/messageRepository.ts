import db from '../db';
import { QueryResult } from 'pg';
import { Message, MessageType } from '../types/message';

// Define the structure of the data needed to create a message
interface CreateMessageData {
    chatId: string;
    senderId: string; 
    messageType: MessageType;
    content?: string;
    attachmentUrl?: string;
    attachmentMetadata?: object;
}

/**
 * Saves a new message to the database.
 * @param messageData - The data for the new message.
 * @returns The saved message object with DB-generated fields (e.g., id, created_at).
 */
export const saveMessage = async (messageData: CreateMessageData): Promise<Message> => {
    const queryText = `
        INSERT INTO messages (chat_id, sender_id, message_type, content, attachment_url, attachment_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, chat_id as "chatId", sender_id as "senderId", message_type as "messageType", content, attachment_url as "attachmentUrl", attachment_metadata as "attachmentMetadata", created_at as "createdAt"
    `; 
    const params = [
        messageData.chatId,
        messageData.senderId,
        messageData.messageType,
        messageData.content || null,
        messageData.attachmentUrl || null,
        messageData.attachmentMetadata || null
    ];

    try {
        console.log('[DB Query] Saving message:', queryText, params);
        const result: QueryResult<Message> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            throw new Error('Failed to save message, no rows returned.');
        }
        console.log('[DB Success] Message saved:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to save message:', error);
        throw new Error('Database error while saving message.'); 
    }
};

/**
 * Fetches message history for a specific chat with pagination.
 * @param chatId - The ID of the chat.
 * @param limit - Max number of messages to return.
 * @param beforeTimestamp - Optional timestamp to fetch messages created before this time (for infinite scroll).
 * @returns An array of message objects.
 */
export const findMessagesByChatId = async (chatId: string, limit: number, beforeTimestamp?: string): Promise<Message[]> => {
    // TODO: Validate chatId, limit, beforeTimestamp
    
    const queryParams: any[] = [chatId, limit];
    let timeClause = '';
    let paramIndex = 3;

    if (beforeTimestamp) {
        try {
            new Date(beforeTimestamp).toISOString(); 
            timeClause = `AND m.created_at < $${paramIndex++}`;
            queryParams.push(beforeTimestamp);
        } catch (e) {
            console.warn(`[DB Warning] Invalid beforeTimestamp format received: ${beforeTimestamp}`);
        }
    }

    const queryText = `
        SELECT 
            m.id,
            m.chat_id as "chatId",
            m.sender_id as "senderId",
            m.message_type as "messageType",
            m.content,
            m.attachment_url as "attachmentUrl",
            m.attachment_metadata as "attachmentMetadata",
            m.created_at as "createdAt",
            u.first_name as "senderFirstName", 
            u.last_name as "senderLastName"     
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id 
        WHERE m.chat_id = $1 ${timeClause}
        ORDER BY m.created_at DESC
        LIMIT $2
    `;

    try {
        console.log('[DB Query] Finding messages by chat ID:', queryText, queryParams);
        const result: QueryResult<Message & { senderFirstName?: string, senderLastName?: string }> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} messages for chat ${chatId}`);
        return result.rows.map(row => ({ 
            ...row, 
            senderName: (row.senderFirstName || row.senderLastName) ? `${row.senderFirstName || ''} ${row.senderLastName || ''}`.trim() : (row.senderId ? 'Unknown User' : 'System')
        }));
    } catch (error) {
        console.error(`[DB Error] Failed to find messages for chat ${chatId}:`, error);
        throw new Error('Database error while fetching chat messages.');
    }
};

// TODO: Add function to count messages in a chat for pagination metadata if needed.
// ... rest of file ...