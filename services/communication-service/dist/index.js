"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const routes_1 = require("./routes");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const sockets_1 = require("./sockets");
const CachedCommunicationService_1 = require("./services/CachedCommunicationService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3002',
        credentials: true,
    },
    path: '/socket.io/',
});
const PORT = process.env.PORT || 3002;
// Initialize cached service
const cachedService = new CachedCommunicationService_1.CachedCommunicationService();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(shared_lib_1.requestLogger);
// Health check
app.get('/health', async (req, res) => {
    try {
        const healthMetrics = await cachedService.getHealthMetrics();
        res.json({
            status: 'ok',
            service: 'communication-service',
            port: PORT,
            database: database_1.AppDataSource.isInitialized ? 'connected' : 'disconnected',
            redis: database_1.redisClient.status === 'ready' ? 'connected' : 'disconnected',
            ...healthMetrics
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            service: 'communication-service',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// API Routes
app.use('/api/conversations', routes_1.conversationRoutes);
app.use('/api/messages', routes_1.messageRoutes);
app.use('/api/presence', routes_1.presenceRoutes);
app.use('/api/notifications', routes_1.notificationRoutes);
app.use('/api/dashboard', routes_1.dashboardRoutes);
// Error handling
app.use(shared_lib_1.errorHandler);
// Socket.io setup
let chatHandler;
// Apply authentication middleware to Socket.io
io.use(sockets_1.socketAuthMiddleware);
// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id, 'userId:', socket.userId);
    // Initialize chat handler if not already done
    if (!chatHandler) {
        chatHandler = new sockets_1.ChatHandler(io);
    }
    // Handle the connection
    chatHandler.handleConnection(socket);
});
// Initialize database and Redis, then start server
database_1.AppDataSource.initialize()
    .then(async () => {
    shared_lib_1.logger.info('✅ Database connected');
    // Connect to Redis
    await database_1.redisClient.connect();
    shared_lib_1.logger.info('✅ Redis connected');
    httpServer.listen(PORT, () => {
        shared_lib_1.logger.info(`📧 Communication Service running on port ${PORT}`);
        shared_lib_1.logger.info(`🔌 WebSocket server ready`);
        shared_lib_1.logger.info(`🚀 Redis caching enabled for communication data`);
    });
})
    .catch((error) => {
    shared_lib_1.logger.error('❌ Service initialization failed:', error);
    process.exit(1);
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    shared_lib_1.logger.info(`${signal} received, shutting down gracefully...`);
    try {
        // Close Socket.io connections
        io.close(() => {
            shared_lib_1.logger.info('Socket.io server closed');
        });
        // Close database and Redis connections
        await (0, database_1.closeConnections)();
        // Close HTTP server
        httpServer.close(() => {
            shared_lib_1.logger.info('HTTP server closed');
            process.exit(0);
        });
    }
    catch (error) {
        shared_lib_1.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=index.js.map