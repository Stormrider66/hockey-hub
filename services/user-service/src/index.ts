import dotenv from 'dotenv';

// Load environment variables very first
dotenv.config();

import 'reflect-metadata'; // Required for TypeORM
import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';

// Extend Express Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
import helmet from 'helmet';
// import addRequestId from 'express-request-id'; // Import request-id middleware - removed due to ES module issues
import apiRouter from './routes'; // Import main API router
import jwksRouter from './routes/jwksRoute';
import { errorHandler } from './middleware/errorHandler'; // Import error handler
import AppDataSource from './data-source'; // Import the DataSource
import logger from './config/logger'; // Import the logger
import pinoHttp from 'pino-http'; // Import pino-http
import { startOrgConsumer } from './workers/orgEventConsumer';
import cookieParser from 'cookie-parser';

const app: Application = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// --- Middleware ---
// Add request ID (must be early) - simple custom middleware to avoid ES module issues
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  next();
});

// Setup HTTP logger middleware
app.use(pinoHttp({
  logger: logger, // Use our existing logger instance
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

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) OR
    // Allow requests from whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS: Blocked request from disallowed origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies/authorization headers
};

app.use(cors(corsOptions)); // Use configured CORS options
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// TODO: Add Logger middleware (using req.logger)

// --- API Routes ---
app.use('/api/v1', apiRouter); // Use the main router for API endpoints

// JWKS endpoint (public)
app.use('/.well-known/jwks.json', jwksRouter);

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
app.use(errorHandler); // Use the centralized error handler

// --- Start Server ---
const startServer = async () => {
  try {
    // Initialize Database Connection (TypeORM)
    await AppDataSource.initialize();
    logger.info("Data Source has been initialized!"); // Use logger

    app.listen(PORT, () => {
      logger.info(`User Service listening on port ${PORT}`);
      startOrgConsumer();
    });
  } catch (error) {
    logger.error({ err: error }, 'Error during server startup:'); // Use logger, include error object
    process.exit(1);
  }
};

// Only start server if not in test environment or if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app }; // Export the app instance for testing 