import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import morgan from 'morgan';
import cors from 'cors';
// import helmet from 'helmet'; // Commented out as unused for now
// import dotenv from 'dotenv'; // dotenv is called in db/index.ts, usually no need to call again here
import seasonRoutes from './routes/seasonRoutes'; // Import season routes
import teamGoalRoutes from './routes/teamGoalRoutes'; // Import team goal routes
import playerGoalRoutes from './routes/playerGoalRoutes'; // Import player goal routes
import developmentPlanRoutes from './routes/developmentPlanRoutes'; // Import development plan routes

// Load environment variables - Handled in db/index.ts
// dotenv.config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);

const servicePort = process.env.PLANNING_SERVICE_PORT || 3006; // Renamed PORT to servicePort as PORT was unused

// --- Middleware ---
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
// app.use(helmet()); // Keep commented out if unused

// --- API Routes ---
app.get('/health', (_req: Request, res: Response) => { // Prefixed _req
    res.status(200).json({ status: 'OK', service: 'Planning Service' });
});

// Mount Season Routes
app.use('/api/v1/seasons', seasonRoutes);

// Mount Goal Routes
app.use('/api/v1/team-goals', teamGoalRoutes);
app.use('/api/v1/player-goals', playerGoalRoutes);

// Mount Development Plan Routes
app.use('/api/v1/development-plans', developmentPlanRoutes);

// TODO: Add other planning routes (e.g., progress reports?)

// --- Error Handling Middleware ---
// ... (existing error handling, _req, _res, _next already prefixed)
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
    });
});

// --- Start Server ---
server.listen(servicePort, () => { // Use servicePort
    console.log(`Planning Service listening on port ${servicePort}`);
});
