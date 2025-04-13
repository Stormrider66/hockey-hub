import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3004; // Training Service Port

// Basic Middleware
app.use(cors()); 
app.use(helmet()); 
app.use(express.json()); 

// --- Training Service Routes --- //

// Simple endpoint to confirm service is running
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Training Service is running!');
});

// Add specific training routes here...
// Example: Get training plans, log sessions, etc.
// app.get('/plans', ...);
// app.post('/sessions', ...);

// Catch-all for unhandled routes (optional)
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found in Training Service' });
});

// --- Start Server --- //
app.listen(PORT, () => {
  console.log(`[Training Service] Server listening on port ${PORT}`);
}); 