"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./data-source");
const exerciseRoutes_1 = __importDefault(require("./routes/exerciseRoutes")); // Import exercise routes
const physicalCategoryRoutes_1 = __importDefault(require("./routes/physicalCategoryRoutes")); // Import category routes
const physicalTemplateRoutes_1 = __importDefault(require("./routes/physicalTemplateRoutes")); // Import template routes
const testDefinitionRoutes_1 = __importDefault(require("./routes/testDefinitionRoutes")); // Import test definition routes
const testResultRoutes_1 = __importDefault(require("./routes/testResultRoutes")); // Import test result routes
const testAnalyticsRoutes_1 = __importDefault(require("./routes/testAnalyticsRoutes")); // Import analytics routes
const scheduledSessionRoutes_1 = __importDefault(require("./routes/scheduledSessionRoutes")); // Import scheduled session routes
const socket_io_1 = require("socket.io");
const liveMetricsSocket_1 = require("./websocket/liveMetricsSocket");
const sessionIntervalSocket_1 = require("./websocket/sessionIntervalSocket");
// Load environment variables
dotenv_1.default.config(); // Load from service directory .env
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
const servicePort = process.env.TRAINING_SERVICE_PORT || 3004;
// --- Middleware ---
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
// --- API Routes ---
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', service: 'Training Service' });
});
// Mount Exercise Routes
app.use('/api/v1/exercises', exerciseRoutes_1.default);
// Mount Physical Category Routes
app.use('/api/v1/physical-categories', physicalCategoryRoutes_1.default);
// Mount Physical Template Routes
app.use('/api/v1/physical-templates', physicalTemplateRoutes_1.default);
// Mount Test Definition Routes
app.use('/api/v1/tests', testDefinitionRoutes_1.default);
// Mount Test Result Routes
app.use('/api/v1/test-results', testResultRoutes_1.default);
// Mount Test Analytics Routes
app.use('/api/v1/tests/analytics', testAnalyticsRoutes_1.default);
// Mount Scheduled Session Routes
app.use('/api/v1/scheduled-sessions', scheduledSessionRoutes_1.default);
// TODO: Add other routes
// app.use('/api/v1/live-sessions', liveSessionRoutes); // May involve WebSockets
// --- Error Handling Middleware ---
app.use((_req, _res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use((err, _req, res, _next) => {
    console.error("[" + (err.status || 500) + "] " + err.message + (err.stack ? "\n" + err.stack : ""));
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR')
        // TODO: Add full standardized error fields later
    });
});
// --- Initialize TypeORM and Start Server ---
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('TypeORM Data Source has been initialized!');
    server.listen(servicePort, () => {
        console.log(`Training Service listening on port ${servicePort}`);
    });
    // Initialize WebSocket handlers after DataSource is ready
    (0, liveMetricsSocket_1.initLiveMetricsSocket)(io);
    (0, sessionIntervalSocket_1.initSessionIntervalSocket)(io);
})
    .catch((err) => {
    console.error('Error during Data Source initialization:', err);
    process.exit(1);
});
