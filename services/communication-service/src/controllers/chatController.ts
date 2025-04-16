import { Request, Response, NextFunction } from 'express';
import * as ChatRepository from '../repositories/chatRepository';
import * as MessageRepository from '../repositories/messageRepository';
// import { Chat } from '../types/chat'; // Ensure Chat import is removed

// TODO: Add proper error handling and authorization

/**
 * Get the list of chats for the currently authenticated user.
 */
export const getUserChats = async (req: Request, res: Response, next: NextFunction) => {
    // Assume authentication middleware adds user info to req.user
    // TODO: Define a proper type for req.user based on your auth middleware
    const userId = (req as any).user?.id; 

    if (!userId) {
        // This should ideally be caught by authentication middleware earlier
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User not authenticated' });
    }

    // TODO: Add pagination query parameters (page, limit)
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
        console.log(`Fetching chats for user ${userId} with limit ${limit}, offset ${offset}`);
        const chats = await ChatRepository.findChatsByUserId(userId, Number(limit), offset);
        
        // TODO: Potentially enrich private chat names with the other participant's name
        // This might involve calls to the User service if names aren't replicated

        // TODO: Get total count for pagination metadata
        const totalChats = await ChatRepository.countUserChats(userId); 

        res.status(200).json({
            success: true, 
            data: chats,
            meta: { 
                pagination: { 
                    page: Number(page), 
                    limit: Number(limit), 
                    total: totalChats,
                    pages: Math.ceil(totalChats / Number(limit))
                }
            }
        });
    } catch (err) {
        console.error(`[Error] Failed to fetch chats for user ${userId}:`, err);
        next(err);
    }
};

/**
 * Get message history for a specific chat.
 */
export const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query; // Default limit 50, `before` is for cursor pagination (timestamp)
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User not authenticated' });
    }
    // TODO: Validate chatId format (UUID)
    const limitNumber = Number(limit);
    if (isNaN(limitNumber) || limitNumber <= 0 || limitNumber > 100) { // Add limit validation
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid limit parameter. Must be between 1 and 100.' });
    }

    try {
        // --- Authorization Check ---
        const isAllowed = await ChatRepository.isUserChatParticipant(userId, chatId);
        if (!isAllowed) {
            console.warn(`[API Auth] Unauthorized attempt by ${userId} to access messages for chat ${chatId}`);
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'You do not have permission to access this chat.' });
        }

        // --- Fetch Messages ---
        console.log(`Fetching messages for chat ${chatId}, user ${userId}, limit ${limitNumber}, before ${before}`);
        const messages = await MessageRepository.findMessagesByChatId(chatId, limitNumber, before as string | undefined);

        // TODO: Implement logic to mark messages as read implicitly upon fetching, or handle explicitly via socket event/API call
        // Example: await ChatRepository.updateLastReadTimestamp(userId, chatId, new Date());
        // Example: await ChatRepository.resetUnreadCount(userId, chatId);

        res.status(200).json({ 
            success: true, 
            data: messages,
            // Optional: Add pagination cursor info for infinite scroll
            meta: {
                limit: limitNumber,
                // Indicate if there are potentially more older messages
                hasMore: messages.length === limitNumber, 
                // The timestamp of the oldest message fetched, to use as the next 'before' cursor
                nextCursor: messages.length > 0 ? messages[messages.length - 1].createdAt : null 
            }
         });
    } catch (err) {
        console.error(`[Error] Failed to fetch messages for chat ${chatId}:`, err);
        next(err);
    }
};

// TODO: Add other chat controller functions (createChat, getChatById, addParticipant, etc.) later 