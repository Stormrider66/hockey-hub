"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainingEventService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const TrainingEventService_1 = require("./services/TrainingEventService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3002',
        credentials: true
    }
});
const PORT = process.env.PORT || 3004;
// Global event service instance
let trainingEventService = null;
// Export for use in routes
const getTrainingEventService = () => {
    if (!trainingEventService) {
        throw new Error('TrainingEventService not initialized');
    }
    return trainingEventService;
};
exports.getTrainingEventService = getTrainingEventService;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Import routes
const workoutRoutes_1 = __importDefault(require("./routes/workoutRoutes"));
const executionRoutes_1 = require("./routes/executionRoutes");
const templateRoutes_1 = __importDefault(require("./routes/templateRoutes"));
const sessionTemplateRoutes_1 = __importDefault(require("./routes/sessionTemplateRoutes"));
const exercise_routes_1 = require("./routes/exercise.routes");
const workoutTypeRoutes_1 = __importStar(require("./routes/workoutTypeRoutes"));
const medicalIntegrationRoutes_1 = __importStar(require("./routes/medicalIntegrationRoutes"));
const workoutData_1 = require("./mocks/workoutData");
const exerciseData_1 = require("./mocks/exerciseData");
const WorkoutTypeService_1 = require("./services/WorkoutTypeService");
const WorkoutType_1 = require("./entities/WorkoutType");
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'training-service',
        port: PORT,
        database: database_1.AppDataSource.isInitialized ? 'connected' : 'disconnected'
    });
});
// Mock endpoints for when database is not available
app.get('/api/training/sessions', (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        const { playerId, date, status } = req.query;
        let filteredSessions = [...workoutData_1.mockWorkoutSessions];
        if (playerId) {
            filteredSessions = filteredSessions.filter(s => s.playerIds?.includes(playerId));
        }
        if (status) {
            filteredSessions = filteredSessions.filter(s => s.status === status);
        }
        return res.json({
            success: true,
            data: filteredSessions,
            mock: true
        });
    }
    next();
});
app.get('/api/training/sessions/:id', (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        const session = workoutData_1.mockWorkoutSessions.find(s => s.id === req.params.id);
        if (session) {
            return res.json({ success: true, data: session, mock: true });
        }
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    next();
});
// Mock endpoints for exercises when database is not available
app.get('/api/v1/training/exercises', (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        const { category, search, skip = 0, take = 50 } = req.query;
        let filteredExercises = [...exerciseData_1.mockExercises];
        if (category) {
            filteredExercises = filteredExercises.filter(e => e.category === category);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filteredExercises = filteredExercises.filter(e => e.name?.toLowerCase().includes(searchLower));
        }
        const total = filteredExercises.length;
        const skipNum = parseInt(skip) || 0;
        const takeNum = parseInt(take) || 50;
        const paginatedExercises = filteredExercises.slice(skipNum, skipNum + takeNum);
        return res.json({
            success: true,
            data: paginatedExercises,
            total,
            skip: skipNum,
            take: takeNum,
            mock: true
        });
    }
    next();
});
app.get('/api/v1/training/exercises/:id', (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        const exercise = exerciseData_1.mockExercises.find(e => e.id === req.params.id);
        if (exercise) {
            return res.json({ success: true, data: exercise, mock: true });
        }
        return res.status(404).json({ success: false, error: 'Exercise not found' });
    }
    next();
});
// API routes (will be used when database is available)
app.use('/api/training', workoutRoutes_1.default);
app.use('/api/training', (0, executionRoutes_1.createExecutionRoutes)(io));
app.use('/api/training', templateRoutes_1.default);
app.use('/api/v1/training', sessionTemplateRoutes_1.default);
app.use('/api/v1/training', exercise_routes_1.exerciseRoutes);
app.use('/api/v1/training/workout-types', workoutTypeRoutes_1.default);
app.use('/api/v1/training/medical-sync', medicalIntegrationRoutes_1.default);
// Error handling middleware (must be last)
app.use(shared_lib_1.errorHandler);
// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Join a workout session room
    socket.on('session:join', (sessionId) => {
        socket.join(`session:${sessionId}`);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });
    // Leave a workout session room
    socket.on('session:leave', (sessionId) => {
        socket.leave(`session:${sessionId}`);
    });
    // Handle workout session events
    socket.on('session:start', (data) => {
        io.to(`session:${data.sessionId}`).emit('session:started', data);
    });
    socket.on('exercise:complete', (data) => {
        io.to(`session:${data.sessionId}`).emit('exercise:completed', data);
    });
    socket.on('metrics:update', (data) => {
        io.to(`session:${data.sessionId}`).emit('metrics:updated', data);
    });
    // Trainer control events
    socket.on('view:change', (data) => {
        io.to(`session:${data.sessionId}`).emit('view:changed', data);
    });
    socket.on('player:focus', (data) => {
        io.to(`session:${data.sessionId}`).emit('player:focused', data);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Start server with database connection
const startServer = async () => {
    try {
        // Initialize database
        if (process.env.SKIP_DB !== 'true') {
            try {
                await (0, database_1.initializeDatabase)();
                console.log('✅ Database connected successfully');
                // Initialize event service
                trainingEventService = new TrainingEventService_1.TrainingEventService(database_1.AppDataSource);
                console.log('✅ Event service initialized');
                // Initialize workout type service
                const workoutTypeRepository = database_1.AppDataSource.getRepository(WorkoutType_1.WorkoutTypeConfig);
                const workoutTypeService = new WorkoutTypeService_1.WorkoutTypeService(workoutTypeRepository);
                (0, workoutTypeRoutes_1.initializeWorkoutTypeRoutes)(workoutTypeService);
                console.log('✅ Workout type service initialized');
                // Initialize medical integration service
                (0, medicalIntegrationRoutes_1.initializeMedicalIntegrationRoutes)();
                console.log('✅ Medical integration service initialized');
            }
            catch (dbError) {
                const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
                console.error('❌ Database connection error:', errorMessage);
                console.log('⚠️  Service will run without database features.');
                console.log('💡 Check your database configuration in .env file');
            }
        }
        // Initialize Redis cache
        try {
            await (0, shared_lib_1.initializeCache)({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '4'),
            });
            console.log('✅ Training Service Redis cache initialized');
        }
        catch (error) {
            console.warn('⚠️ Redis cache initialization failed, continuing without cache:', error);
        }
        httpServer.listen(PORT, () => {
            console.log(`🏃 Training Service running on port ${PORT}`);
            console.log(`🔌 WebSocket server ready`);
            console.log(`📊 Database: ${process.env.DB_NAME || 'hockey_hub_training'} on port ${process.env.DB_PORT || '5432'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    try {
        await (0, shared_lib_1.closeCache)();
        console.log('✅ Cache connection closed');
    }
    catch (error) {
        console.warn('Cache close error:', error);
    }
    if (database_1.AppDataSource.isInitialized) {
        await database_1.AppDataSource.destroy();
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    try {
        await (0, shared_lib_1.closeCache)();
        console.log('✅ Cache connection closed');
    }
    catch (error) {
        console.warn('Cache close error:', error);
    }
    if (database_1.AppDataSource.isInitialized) {
        await database_1.AppDataSource.destroy();
    }
    process.exit(0);
});
//# sourceMappingURL=index.js.map