"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_lib_1 = require("@hockey-hub/shared-lib");
const database_1 = require("./config/database");
const CachedStatisticsService_1 = require("./services/CachedStatisticsService");
const repositories_1 = require("./repositories");
const entities_1 = require("./entities");
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
const playerPerformanceRoutes_1 = require("./routes/playerPerformanceRoutes");
const teamAnalyticsRoutes_1 = require("./routes/teamAnalyticsRoutes");
const workloadRoutes_1 = require("./routes/workloadRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3007;
// Initialize services
let statisticsService;
let playerPerformanceRepo;
let teamAnalyticsRepo;
let workloadAnalyticsRepo;
async function initializeServices() {
    try {
        // Initialize database and cache
        await (0, database_1.initializeDatabase)();
        // Initialize repositories
        playerPerformanceRepo = new repositories_1.CachedPlayerPerformanceRepository(database_1.AppDataSource.getRepository(entities_1.PlayerPerformanceStats), database_1.cacheManager);
        teamAnalyticsRepo = new repositories_1.CachedTeamAnalyticsRepository(database_1.AppDataSource.getRepository(entities_1.TeamAnalytics), database_1.cacheManager);
        workloadAnalyticsRepo = new repositories_1.CachedWorkloadAnalyticsRepository(database_1.AppDataSource.getRepository(entities_1.WorkloadAnalytics), database_1.cacheManager);
        // Initialize main service
        statisticsService = new CachedStatisticsService_1.CachedStatisticsService(database_1.AppDataSource, database_1.cacheManager);
        console.log('📊 Statistics Service: All services initialized successfully');
    }
    catch (error) {
        console.error('📊 Statistics Service: Failed to initialize services:', error);
        throw error;
    }
}
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',')
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(shared_lib_1.loggingMiddleware);
// Health check (public route)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'statistics-service',
        port: PORT,
        timestamp: new Date().toISOString(),
        cache: database_1.cacheManager.isConnected() ? 'connected' : 'disconnected',
        database: database_1.AppDataSource.isInitialized ? 'connected' : 'disconnected'
    });
});
// API Routes (after service initialization)
app.get('/api/ready', (req, res) => {
    if (statisticsService && playerPerformanceRepo && teamAnalyticsRepo && workloadAnalyticsRepo) {
        res.json({ ready: true, services: 'all_initialized' });
    }
    else {
        res.status(503).json({ ready: false, error: 'Services not yet initialized' });
    }
});
// Initialize services and then set up routes
initializeServices().then(() => {
    // Dashboard routes (highest priority for performance)
    app.use('/api/dashboard', (0, dashboardRoutes_1.createDashboardRoutes)(statisticsService));
    // Feature-specific routes
    app.use('/api/players', (0, playerPerformanceRoutes_1.createPlayerPerformanceRoutes)(playerPerformanceRepo));
    app.use('/api/teams', (0, teamAnalyticsRoutes_1.createTeamAnalyticsRoutes)(teamAnalyticsRepo));
    app.use('/api/workload', (0, workloadRoutes_1.createWorkloadRoutes)(workloadAnalyticsRepo));
    // Legacy compatibility routes (maintain backward compatibility)
    app.get('/api/stats/players/:playerId', shared_lib_1.authMiddleware, async (req, res) => {
        try {
            const { playerId } = req.params;
            const stats = await playerPerformanceRepo.getPlayerStats(playerId);
            // Transform to legacy format
            const legacyStats = stats.length > 0 ? {
                games: stats.length,
                goals: stats.reduce((sum, s) => sum + s.goals, 0),
                assists: stats.reduce((sum, s) => sum + s.assists, 0),
                points: stats.reduce((sum, s) => sum + s.goals + s.assists, 0)
            } : { games: 0, goals: 0, assists: 0, points: 0 };
            res.json({
                success: true,
                data: { stats: legacyStats }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch player stats' });
        }
    });
    app.get('/api/stats/teams/:teamId', shared_lib_1.authMiddleware, async (req, res) => {
        try {
            const { teamId } = req.params;
            const stats = await teamAnalyticsRepo.getTeamSeasonStats(teamId);
            res.json({
                success: true,
                data: { stats: stats.length > 0 ? stats[0] : {} }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch team stats' });
        }
    });
    // Error handling
    app.use(shared_lib_1.errorHandler);
    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
            availableEndpoints: {
                dashboard: '/api/dashboard/*',
                players: '/api/players/*',
                teams: '/api/teams/*',
                workload: '/api/workload/*',
                health: '/health'
            }
        });
    });
    // Start server
    app.listen(PORT, () => {
        console.log(`📊 Statistics Service running on port ${PORT}`);
        console.log(`📊 Available endpoints:`);
        console.log(`   - Dashboard Analytics: /api/dashboard/analytics`);
        console.log(`   - Player Dashboard: /api/dashboard/player/:playerId`);
        console.log(`   - Coach Dashboard: /api/dashboard/coach/:teamId`);
        console.log(`   - Trainer Dashboard: /api/dashboard/trainer`);
        console.log(`   - Admin Dashboard: /api/dashboard/admin/:organizationId`);
        console.log(`   - Health Check: /health`);
    });
}).catch((error) => {
    console.error('📊 Failed to start Statistics Service:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📊 Statistics Service: Received SIGTERM, shutting down gracefully...');
    try {
        await database_1.AppDataSource.destroy();
        await database_1.cacheManager.disconnect();
        console.log('📊 Statistics Service: Shutdown complete');
        process.exit(0);
    }
    catch (error) {
        console.error('📊 Statistics Service: Error during shutdown:', error);
        process.exit(1);
    }
});
process.on('SIGINT', async () => {
    console.log('📊 Statistics Service: Received SIGINT, shutting down gracefully...');
    try {
        await database_1.AppDataSource.destroy();
        await database_1.cacheManager.disconnect();
        console.log('📊 Statistics Service: Shutdown complete');
        process.exit(0);
    }
    catch (error) {
        console.error('📊 Statistics Service: Error during shutdown:', error);
        process.exit(1);
    }
});
//# sourceMappingURL=index.js.map