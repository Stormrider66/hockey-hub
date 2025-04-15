import express from 'express';
import cors from 'cors';
import { errorHandlerMiddleware } from './middlewares/errorHandler'; // Placeholder
// import routes from './routes'; // Placeholder for importing routes
import exerciseRoutes from './routes/exerciseRoutes'; // Import exercise routes

const app = express(); // Re-add app initialization

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Mount API routes (Placeholder)
// app.use('/api/v1', routes);
app.use('/api/v1', exerciseRoutes); // Mount exercise routes

// Global error handler
app.use(errorHandlerMiddleware);

export default app; 