import { Router } from 'express';
import {
    getUserChats,
    getChatMessages
} from '../controllers/chatController';
// TODO: Import other controller functions when created

// TODO: Implement authentication middleware for API routes
// const { requireAuth } = require('../middleware/authMiddleware'); 

const router = Router();

// Apply authentication middleware to all chat routes
// router.use(requireAuth); 

// Get list of user's chats
router.get('/', getUserChats);

// Get message history for a specific chat
router.get('/:chatId/messages', getChatMessages);

// TODO: Add routes for creating chats (POST /)
// TODO: Add routes for getting specific chat details (GET /:id)
// TODO: Add routes for managing participants (POST/DELETE /:id/participants)

export default router; 