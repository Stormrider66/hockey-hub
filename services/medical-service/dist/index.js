"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const shared_lib_1 = require("@hockey-hub/shared-lib");
// Import routes
const wellnessRoutes_1 = __importDefault(require("./routes/wellnessRoutes"));
const injuryRoutes_1 = __importDefault(require("./routes/injuryRoutes"));
const availabilityRoutes_1 = __importDefault(require("./routes/availabilityRoutes"));
const medicalOverviewRoutes_1 = __importDefault(require("./routes/medicalOverviewRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'medical-service',
        port: PORT,
        database: database_1.AppDataSource.isInitialized ? 'connected' : 'disconnected'
    });
});
// API routes
app.use('/api/v1', wellnessRoutes_1.default);
app.use('/api/v1/injuries', injuryRoutes_1.default);
app.use('/api/v1/availability', availabilityRoutes_1.default);
app.use('/api/v1/medical', medicalOverviewRoutes_1.default);
// Legacy medical routes for backward compatibility
app.get('/api/medical/injuries', (req, res) => {
    res.redirect('/api/v1/injuries');
});
app.post('/api/medical/injuries', (req, res) => {
    res.redirect(307, '/api/v1/injuries');
});
app.get('/api/medical/availability', (req, res) => {
    res.redirect('/api/v1/availability');
});
// Error handling middleware
app.use(shared_lib_1.errorHandler);
// Database initialization and server startup
async function startServer() {
    try {
        // Initialize database connection
        if (!database_1.AppDataSource.isInitialized) {
            await database_1.AppDataSource.initialize();
            console.log('✅ Medical Service database connected');
        }
        // Start the server
        app.listen(PORT, () => {
            console.log(`🏥 Medical Service running on port ${PORT}`);
            console.log(`📊 Redis caching: ${process.env.REDIS_HOST ? 'enabled' : 'disabled'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start Medical Service:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Medical Service...');
    if (database_1.AppDataSource.isInitialized) {
        await database_1.AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map