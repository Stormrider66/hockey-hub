import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import injuryRoutes from './routes/injuryRoutes'; // Import injury routes

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);

const PORT = process.env.MEDICAL_SERVICE_PORT || 3005;

// --- Middleware ---
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

// --- API Routes ---
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'Medical Service' });
});

// Mount Injury Routes
app.use('/api/v1/injuries', injuryRoutes);

// TODO: Add other routes
// app.use('/api/v1/treatment-plans', treatmentPlanRoutes);
// app.use('/api/v1/player-status', playerStatusRoutes);
// app.use('/api/v1/player-medical', playerMedicalRoutes);

// --- Error Handling Middleware ---
app.use((_req: Request, _res: Response, next: NextFunction) => {
    const error = new Error('Not Found');
    (error as any).status = 404;
    next(error);
});

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error("[" + (err.status || 500) + "] " + err.message + (err.stack ? "\n" + err.stack : "") + " Request Path: " + req.path);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR')
        // TODO: Add full standardized error fields later
    });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Medical Service listening on port ${PORT}`);
}); 