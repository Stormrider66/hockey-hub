"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const injuryRoutes_1 = __importDefault(require("./routes/injuryRoutes")); // Import injury routes
const treatmentRoutes_1 = __importDefault(require("./routes/treatmentRoutes"));
const treatmentPlanRoutes_1 = __importDefault(require("./routes/treatmentPlanRoutes"));
const treatmentPlanItemRoutes_1 = __importDefault(require("./routes/treatmentPlanItemRoutes"));
const playerAvailabilityRoutes_1 = __importDefault(require("./routes/playerAvailabilityRoutes"));
const medicalDocumentRoutes_1 = __importDefault(require("./routes/medicalDocumentRoutes"));
const overviewRoutes_1 = __importDefault(require("./routes/overviewRoutes"));
// import { authenticateToken } from './middleware/auth'; // temporarily disabled for testing
const crypto_1 = require("crypto");
// Load environment variables
dotenv_1.default.config({ path: '../../.env' });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.MEDICAL_SERVICE_PORT || 3005;
// --- Middleware ---
app.use((0, cors_1.default)({
    origin: ['http://localhost:3002', 'http://localhost:3000'], // Frontend and API Gateway
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
// --- API Routes ---
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', service: 'Medical Service' });
});
// Apply authentication middleware to all API routes (temporarily disabled for testing)
// app.use('/api/v1', authenticateToken);
// Mount Medical Routes (API Gateway strips /medical prefix before forwarding)
app.use('/injuries', injuryRoutes_1.default);
app.use('/treatments', treatmentRoutes_1.default);
app.use('/', treatmentPlanRoutes_1.default);
app.use('/', treatmentPlanItemRoutes_1.default);
app.use('/', playerAvailabilityRoutes_1.default);
app.use('/', medicalDocumentRoutes_1.default);
app.use('/', overviewRoutes_1.default);
// TODO: Add other routes
// app.use('/api/v1/player-status', playerStatusRoutes);
// app.use('/api/v1/player-medical', playerMedicalRoutes);
// --- Error Handling Middleware ---
// Handle 404 Not Found
app.use((_req, _res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});
// Global error handler
app.use((err, req, res, _next) => {
    const status = err.status || 500;
    const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
    let category;
    if (status === 401)
        category = 'AUTHENTICATION';
    else if (status === 403)
        category = 'AUTHORIZATION';
    else if (status === 400)
        category = 'VALIDATION';
    else if (status === 409)
        category = 'RESOURCE_CONFLICT';
    else if (status >= 500)
        category = 'INTERNAL_ERROR';
    else
        category = 'INTERNAL_ERROR';
    const transactionId = (0, crypto_1.randomUUID)();
    console.error(`[${status}] ${err.message}${err.stack ? '\n' + err.stack : ''} Request Path: ${req.path} TransactionId: ${transactionId}`);
    res.setHeader('transactionId', transactionId);
    res.status(status).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code,
        category,
        details: err.details || undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
        transactionId
    });
});
// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Medical Service listening on port ${PORT}`);
});
