import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import exerciseRoutes from './routes/exerciseRoutes'; // Import exercise routes
import physicalCategoryRoutes from './routes/physicalCategoryRoutes'; // Import category routes
import physicalTemplateRoutes from './routes/physicalTemplateRoutes'; // Import template routes
import testDefinitionRoutes from './routes/testDefinitionRoutes'; // Import test definition routes
import testResultRoutes from './routes/testResultRoutes'; // Import test result routes
import scheduledSessionRoutes from './routes/scheduledSessionRoutes'; // Import scheduled session routes

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);

const servicePort = process.env.TRAINING_SERVICE_PORT || 3004;

// --- Middleware ---
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

// --- API Routes ---
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'Training Service' });
});

// Mount Exercise Routes
app.use('/api/v1/exercises', exerciseRoutes);

// Mount Physical Category Routes
app.use('/api/v1/physical-categories', physicalCategoryRoutes);

// Mount Physical Template Routes
app.use('/api/v1/physical-templates', physicalTemplateRoutes);

// Mount Test Definition Routes
app.use('/api/v1/tests', testDefinitionRoutes);

// Mount Test Result Routes
app.use('/api/v1/test-results', testResultRoutes);

// Mount Scheduled Session Routes
app.use('/api/v1/scheduled-sessions', scheduledSessionRoutes);

// TODO: Add other routes
// app.use('/api/v1/live-sessions', liveSessionRoutes); // May involve WebSockets

// --- Error Handling Middleware ---
app.use((_req: Request, _res: Response, next: NextFunction) => {
    const error = new Error('Not Found');
    (error as any).status = 404;
    next(error);
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[" + (err.status || 500) + "] " + err.message + (err.stack ? "\n" + err.stack : ""));
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR')
        // TODO: Add full standardized error fields later
    });
});

// --- Start Server ---
server.listen(servicePort, () => {
    console.log(`Training Service listening on port ${servicePort}`);
}); 