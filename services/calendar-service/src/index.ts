import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// --- Data Structure and Storage --- //
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 date string
  end: string;   // ISO 8601 date string
  type: 'ice_training' | 'physical_training' | 'game' | 'rehab_medical' | 'meeting' | 'travel' | 'other'; // Based on workflow.mdc colors
  description?: string;
}

// In-memory storage for simplicity (replace with DB later)
let events: CalendarEvent[] = [
  // Some initial mock data
  {
    id: '1',
    title: 'Morning Ice Practice',
    start: '2024-05-15T09:00:00Z',
    end: '2024-05-15T11:00:00Z',
    type: 'ice_training'
  },
  {
    id: '2',
    title: 'Team Meeting',
    start: '2024-05-15T13:00:00Z',
    end: '2024-05-15T14:00:00Z',
    type: 'meeting',
    description: 'Review video'
  }
];

const app = express();
const PORT = process.env.PORT || 3003; // Calendar Service Port

// Basic Middleware
app.use(cors()); 
app.use(helmet()); 
app.use(express.json()); 

// --- Calendar Service Routes --- //

// Simple endpoint to confirm service is running
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Calendar Service is running!');
});

// GET all calendar events
app.get('/events', (_req: Request, res: Response) => {
  console.log('[Calendar Service] GET /events');
  res.status(200).json(events);
});

// POST a new calendar event
app.post('/events', (req: Request, res: Response) => {
  console.log('[Calendar Service] POST /events', req.body);
  const newEvent: Partial<CalendarEvent> = req.body;

  // Basic validation (improve later)
  if (!newEvent.title || !newEvent.start || !newEvent.end || !newEvent.type) {
    return res.status(400).json({ error: 'Missing required event fields (title, start, end, type)' });
  }

  // Generate a simple ID (replace with UUID later)
  const eventToAdd: CalendarEvent = {
    id: String(Date.now()), // Simple ID for now
    title: newEvent.title,
    start: newEvent.start,
    end: newEvent.end,
    type: newEvent.type,
    description: newEvent.description
  };

  events.push(eventToAdd);
  console.log('[Calendar Service] Added event:', eventToAdd);
  res.status(201).json(eventToAdd);
});

// Add specific calendar routes here...
// Example:
// app.get('/events', (req: Request, res: Response) => { ... });
// app.post('/events', (req: Request, res: Response) => { ... });

// Catch-all for unhandled routes (optional)
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found in Calendar Service' });
});

// --- Start Server --- //
app.listen(PORT, () => {
  console.log(`[Calendar Service] Server listening on port ${PORT}`);
}); 