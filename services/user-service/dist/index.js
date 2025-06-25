"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables very first
dotenv_1.default.config();
require("reflect-metadata"); // Required for TypeORM
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// import addRequestId from 'express-request-id'; // Import request-id middleware - removed due to ES module issues
const routes_1 = __importDefault(require("./routes")); // Import main API router
const jwksRoute_1 = __importDefault(require("./routes/jwksRoute"));
const errorHandler_1 = require("./middleware/errorHandler"); // Import error handler
const data_source_1 = __importDefault(require("./data-source")); // Import the DataSource
const logger_1 = __importDefault(require("./config/logger")); // Import the logger
const pino_http_1 = __importDefault(require("pino-http")); // Import pino-http
const orgEventConsumer_1 = require("./workers/orgEventConsumer");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.USER_SERVICE_PORT || 3001;
// --- Middleware ---
// Add request ID (must be early) - simple custom middleware to avoid ES module issues
app.use((req, res, next) => {
    req.requestId = Math.random().toString(36).substring(2, 15);
    next();
});
// Setup HTTP logger middleware
app.use((0, pino_http_1.default)({
    logger: logger_1.default, // Use our existing logger instance
    // Define custom serializers
    serializers: {
        req(req) {
            req.body = '[REDACTED]'; // Redact request body by default for security
            return req;
        },
        res(res) {
            return res;
        }
    },
    // Customize log message (optional)
    // customSuccessMessage: function (req, res) { return `${req.method} ${req.url} completed with status ${res.statusCode}` },
    // customErrorMessage: function (req, res, err) { return `${req.method} ${req.url} failed with status ${res.statusCode}` }
}));
// Configure CORS
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) OR
        // Allow requests from whitelisted origins
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        }
        else {
            logger_1.default.warn({ origin }, 'CORS: Blocked request from disallowed origin');
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow cookies/authorization headers
};
app.use((0, cors_1.default)(corsOptions)); // Use configured CORS options
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// TODO: Add Logger middleware (using req.logger)
// --- API Routes ---
app.use('/api/v1', routes_1.default); // Use the main router for API endpoints
// JWKS endpoint (public)
app.use('/.well-known/jwks.json', jwksRoute_1.default);
// --- Health Check Route ---
app.get('/health', (_req, res) => {
    // TODO: Add checks for database connection, etc.
    res.status(200).json({ status: 'UP' });
});
// --- Root Route ---
app.get('/', (_req, res) => {
    res.send('User Service is running!');
});
// --- Error Handling Middleware ---
app.use(errorHandler_1.errorHandler); // Use the centralized error handler
// --- Start Server ---
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Initialize Database Connection (TypeORM)
        yield data_source_1.default.initialize();
        logger_1.default.info("Data Source has been initialized!"); // Use logger
        app.listen(PORT, () => {
            logger_1.default.info(`User Service listening on port ${PORT}`);
            (0, orgEventConsumer_1.startOrgConsumer)();
        });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Error during server startup:'); // Use logger, include error object
        process.exit(1);
    }
});
// Only start server if not in test environment or if run directly
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
//# sourceMappingURL=index.js.map