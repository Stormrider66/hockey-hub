import express, { Express, ErrorRequestHandler } from 'express';
import cors from 'cors';
import { errorHandlerMiddleware } from './middlewares/errorHandler'; // Placeholder
// import routes from './routes'; // Placeholder for importing routes
import exerciseRoutes from './routes/exerciseRoutes'; // Import exercise routes
import physicalTemplateRoutes from './routes/physicalTemplateRoutes'; // Import template routes

const app: Express = express(); // Re-add app initialization

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Mount API routes (Placeholder)
// app.use('/api/v1', routes);
app.use('/api/v1', exerciseRoutes); // Mount exercise routes
app.use('/api/v1', physicalTemplateRoutes); // Mount template routes

// Global error handler - needs to be registered last
app.use(errorHandlerMiddleware as ErrorRequestHandler);

export default app; 