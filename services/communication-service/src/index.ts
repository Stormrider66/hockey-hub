import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { saveMessage } from './repositories/messageRepository';
import { isUserChatParticipant } from './repositories/chatRepository';
import { MessageType } from './types/message';
import chatRoutes from './routes/chatRoutes';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Define a type for the decoded user payload from JWT
// Mirror the structure defined in the user-service API documentation
interface AuthenticatedUser {
    id: string;
    email: string;
    roles: string[];
    organizationId?: string;
    teamIds?: string[];
    preferredLanguage: string;
    firstName?: string;
    lastName?: string;
    // Add other fields present in your JWT payload
}

// Extend the Socket interface to include the authenticated user
interface SocketWithAuth extends Socket {
    user?: AuthenticatedUser; 
}

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*", // Configure properly for production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.COMMUNICATION_SERVICE_PORT || 3020;

// --- Middleware ---
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

// --- API Routes ---
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'Communication Service' });
});

// Mount Chat Routes
app.use('/api/v1/chats', chatRoutes);

// TODO: Add routes for notifications

// --- Socket.IO Setup ---

// Socket.IO Authentication Middleware
io.use((socket: SocketWithAuth, next) => {
    const token = socket.handshake.auth.token;
    const publicKey = process.env.JWT_PUBLIC_KEY;

    if (!token) {
        console.error('[Auth Middleware] No token provided by socket:', socket.id);
        return next(new Error('Authentication error: No token provided'));
    }
    if (!publicKey) {
        console.error('[Auth Middleware] JWT_PUBLIC_KEY is not set in environment variables.');
        return next(new Error('Authentication error: Server configuration issue'));
    }
    
    // Ensure the public key string is formatted correctly (replace escaped newlines)
    const formattedPublicKey = publicKey.replace(/\n/g, '\n');

    try {
        // Verify the token using the public key (assuming RS256 algorithm)
        const decoded = jwt.verify(token, formattedPublicKey, { algorithms: ['RS256'] }) as AuthenticatedUser;
        // Attach the decoded user payload to the socket object
        socket.user = decoded;
        console.log(`[Auth Middleware] User authenticated: ${decoded.email} (ID: ${decoded.id}), Socket ID: ${socket.id}`);
        next(); // Proceed with connection
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            console.error(`[Auth Middleware] Token expired for socket: ${socket.id}`);
            return next(new Error('Authentication error: Token expired'));
        } else if (err instanceof jwt.JsonWebTokenError) {
            console.error(`[Auth Middleware] Invalid token for socket: ${socket.id}`, err.message);
            return next(new Error('Authentication error: Invalid token'));
        } else {
             console.error(`[Auth Middleware] Unknown authentication error for socket: ${socket.id}`, err);
             return next(new Error('Authentication error: Verification failed'));
        }
    }
});

io.on('connection', (socket: SocketWithAuth) => {
    // Access authenticated user info via socket.user
    if (!socket.user) {
        console.error(`[Socket.IO] Connection established but user not authenticated? Socket ID: ${socket.id}. Disconnecting.`);
        socket.disconnect(true);
        return;
    }
    
    console.log(`[Socket.IO] User connected: ${socket.user.email} (ID: ${socket.user.id}), Socket ID: ${socket.id}`);
    
    // --- Join relevant rooms ---
    try {
        // Re-check user exists for type safety within this block
        if (!socket.user) {
            // This should ideally not be reached due to the check at the start of io.on('connection')
            throw new Error('User object not found on authenticated socket.');
        }
        
        // 1. Join user-specific room (for private messages, notifications)
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);
        console.log(`[Socket.IO] User ${socket.user.id} joined room: ${userRoom}`);

        // 2. Join rooms for each team the user belongs to
        if (socket.user.teamIds && Array.isArray(socket.user.teamIds)) {
            socket.user.teamIds.forEach(teamId => {
                const teamRoom = `team:${teamId}`;
                socket.join(teamRoom);
                console.log(`[Socket.IO] User ${socket.user!.id} joined room: ${teamRoom}`); // Added assertion here too for consistency
            });
        }
        
        // TODO: Potentially join organization room? 
        // if (socket.user.organizationId) { socket.join(`org:${socket.user.organizationId}`); }
        
    } catch (error) {
        // Use socket ID for logging if user info is somehow unavailable at error time
        // Added non-null assertion based on the check at the start of the connection handler
        const identifier = socket.user ? `user ${socket.user!.id}` : `socket ${socket.id}`; 
        console.error(`[Socket.IO] Error joining rooms for ${identifier}:`, error);
        // Decide if we should disconnect the user if room joining fails
        // socket.disconnect(true);
    }
    // --------------------------

    socket.on('disconnect', (reason) => {
        if (socket.user) {
             console.log(`[Socket.IO] User disconnected: ${socket.user.email} (ID: ${socket.user.id}), Socket ID: ${socket.id}, Reason: ${reason}`);
        } else {
             console.log(`[Socket.IO] Unauthenticated user disconnected: ${socket.id}, Reason: ${reason}`);
        }
        // TODO: Handle user disconnection (e.g., update presence status)
    });

    socket.on('send_message', async (data) => {
        if (!socket.user) return; 

        const { chatId, content, attachmentUrl, attachmentMetadata, tempId } = data;
        const senderId = socket.user.id;
        const senderName = `${socket.user.firstName || 'Unknown'} ${socket.user.lastName || 'User'}`;

        console.log(`[Socket.IO] Received message from ${senderId} for chat ${chatId}:`, content);

        // --- 1. Validation ---
        if (!chatId || (!content && !attachmentUrl)) {
            console.error(`[Socket.IO] Invalid message data from ${senderId}:`, data);
            socket.emit('message_error', { tempId, chatId, error: 'Invalid message data: Missing chatId or content/attachment.' });
            return;
        }
        // TODO: Add more specific validation (e.g., content length, attachment types/size)

        try {
            // --- 2. Authorization ---
            const isAllowed = await isUserChatParticipant(senderId, chatId);
            if (!isAllowed) {
                console.warn(`[Socket.IO] Unauthorized attempt by ${senderId} to send to chat ${chatId}`);
                socket.emit('message_error', { tempId, chatId, error: 'You do not have permission to send messages to this chat.' });
                return;
            }
            console.log(`[Auth Check] User ${senderId} has permission for chat ${chatId}`);

            // --- 3. Database Interaction ---
            const messageType: MessageType = attachmentUrl ? (attachmentMetadata?.mimeType?.startsWith('image') ? 'image' : 'file') : 'text';
            const messageToSave = {
                chatId,
                senderId,
                messageType,
                content: content || null,
                attachmentUrl: attachmentUrl || null,
                attachmentMetadata: attachmentMetadata || null,
            };
            
            // Save to DB using the repository function
            const savedMessage = await saveMessage(messageToSave);
            console.log('[DB Success] Saved message:', savedMessage);
            
            // Add senderName for broadcast payload (not stored in DB necessarily)
            const messagePayload = { ...savedMessage, senderName };

            // --- 4. Broadcasting ---
            const targetRoom = `chat:${chatId}`;
            socket.to(targetRoom).emit('new_message', messagePayload);
            console.log(`[Socket.IO] Broadcasted message to room ${targetRoom} from ${senderId}`);

            // Send confirmation back to sender with the final message data (including DB ID and timestamp)
            socket.emit('message_sent_confirmation', { tempId, message: messagePayload });

        } catch (error) {
            console.error(`[Socket.IO] Error processing send_message from ${senderId} for chat ${chatId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message due to a server error.';
            socket.emit('message_error', { tempId, chatId, error: errorMessage });
        }
    });

    socket.on('mark_read', async (data) => {
        if (!socket.user) return;
        console.log(`[Socket.IO] Received mark_read from ${socket.user.email} (ID: ${socket.user.id}):`, data);
        // TODO: Update read status in database (ensure user can mark read for this message/chat)
        // Example: await markMessageAsRead(data.messageId, socket.user.id);
        // TODO: Notify relevant users about read status update
    });

    // Error handling for socket
    socket.on('error', (err) => {
         const userId = socket.user ? socket.user.id : 'unauthenticated';
         console.error(`[Socket.IO] Socket error for user ${userId} (Socket ID: ${socket.id}):`, err);
    });
});

// --- Error Handling Middleware (Express) ---
app.use((_req: Request, _res: Response, next: NextFunction) => {
    const error = new Error('Not Found');
    (error as any).status = 404;
    next(error);
});

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Ensure req is used (e.g., logging path)
    console.error("[" + (err.status || 500) + "] " + err.message + (err.stack ? "\n" + err.stack : "") + " Request Path: " + req.path);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR')
    });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Communication Service (Express + Socket.IO) listening on port ${PORT}`);
}); 