import db from '../db';
import { QueryResult } from 'pg';

/**
 * Checks if a user is a participant in a specific chat.
 * @param userId - The ID of the user.
 * @param chatId - The ID of the chat.
 * @returns True if the user is a participant, false otherwise.
 */
export const isUserChatParticipant = async (userId: string, chatId: string): Promise<boolean> => {
    // TODO: Add validation for userId and chatId formats (UUID)
    const queryText = `
        SELECT 1 
        FROM chat_participants
        WHERE user_id = $1 AND chat_id = $2
        LIMIT 1
    `;
    const params = [userId, chatId];

    try {
        console.log('[DB Query] Checking chat participation with parameters:', { userId, chatId });
        const result: QueryResult = await db.query(queryText, params);
        // Check if rowCount is not null/undefined before using it
        const isParticipant = result.rowCount ? result.rowCount > 0 : false;
        console.log('[DB Success] User participation check completed:', { userId, chatId, isParticipant });
        return isParticipant;
    } catch (error: any) {
        console.error('[DB Error] Failed to check chat participation:', { userId, chatId, error: error.message });
        // In case of error, assume user is not a participant for safety
        return false; 
    }
};

/**
 * Finds all chats a user is a participant in, ordered by last activity.
 * Includes basic chat information suitable for a list view.
 * @param userId - The ID of the user.
 * @param limit - Max number of chats to return.
 * @param offset - Number of chats to skip (for pagination).
 * @returns An array of chat objects.
 */
export const findChatsByUserId = async (userId: string, limit: number, offset: number): Promise<any[]> => {
    // TODO: Add validation for userId, limit, offset
    const queryText = `
        SELECT 
            c.id,
            c.chat_type as "chatType",
            c.name,
            c.created_at as "createdAt",
            c.updated_at as "updatedAt",
            c.last_message_content as "lastMessageContent",
            c.last_message_timestamp as "lastMessageTimestamp",
            c.last_message_sender_id as "lastMessageSenderId",
            cp.unread_count as "unreadCount"
            -- TODO: Need to determine the name/participants for private chats
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = $1
        ORDER BY c.updated_at DESC
        LIMIT $2 OFFSET $3
    `;
    const params = [userId, limit, offset];

    try {
        console.log('[DB Query] Finding chats by user with parameters:', { userId, limit, offset });
        const result = await db.query(queryText, params);
        console.log('[DB Success] Found chats for user:', { userId, count: result.rows.length });
        return result.rows;
    } catch (error: any) {
        console.error('[DB Error] Failed to find chats for user:', { userId, error: error.message });
        throw new Error('Database error while fetching user chats.');
    }
};

/**
 * Counts the total number of chats a user is a participant in.
 * @param userId - The ID of the user.
 * @returns The total count of chats.
 */
export const countUserChats = async (userId: string): Promise<number> => {
    // TODO: Add validation for userId
    const queryText = `
        SELECT COUNT(*) 
        FROM chat_participants
        WHERE user_id = $1
    `;
    const params = [userId];

    try {
        console.log('[DB Query] Counting chats for user with parameters:', { userId });
        const result = await db.query(queryText, params);
        const count = parseInt(result.rows[0].count, 10);
        console.log('[DB Success] User chat count:', { userId, count });
        return count;
    } catch (error: any) {
        console.error('[DB Error] Failed to count chats for user:', { userId, error: error.message });
        throw new Error('Database error while counting user chats.');
    }
};

// TODO: Add functions for creating chats, getting user's chat list, managing participants etc. 