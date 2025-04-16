import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import eventRoutes from './routes/eventRoutes'; // Import event routes
import locationRoutes from './routes/locationRoutes'; // Import location routes
import resourceTypeRoutes from './routes/resourceTypeRoutes'; // Import resource type routes
import resourceRoutes from './routes/resourceRoutes'; // Import resource routes
// TODO: Import other routes (locations, resources) later

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
const PORT = process.env.CALENDAR_SERVICE_PORT || 3003;

// Middleware
app.use(cors()); // Configure allowed origins properly in production
app.use(morgan('dev')); // Logging
app.use(express.json()); // Body parser
app.use(helmet()); // Security headers

// --- Routes ---

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'Calendar Service' });
});

// Mount Core Routes
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/resource-types', resourceTypeRoutes);
app.use('/api/v1/resources', resourceRoutes);

// Locations
app.get('/api/v1/locations', (req: Request, res: Response) => { 
    console.log('GET /locations requested');
    res.status(200).json({ message: 'Get Locations Placeholder' }); 
});
app.post('/api/v1/locations', (req: Request, res: Response) => { 
    console.log('POST /locations requested with body:', req.body);
    res.status(201).json({ message: 'Create Location Placeholder', data: req.body }); 
});
app.get('/api/v1/locations/:id', (req: Request, res: Response) => { 
    console.log(`GET /locations/${req.params.id} requested`);
    res.status(200).json({ message: `Get Location ${req.params.id} Placeholder` }); 
});
app.put('/api/v1/locations/:id', (req: Request, res: Response) => { 
    console.log(`PUT /locations/${req.params.id} requested with body:`, req.body);
    res.status(200).json({ message: `Update Location ${req.params.id} Placeholder`, data: req.body }); 
});
app.delete('/api/v1/locations/:id', (req: Request, res: Response) => { 
    console.log(`DELETE /locations/${req.params.id} requested`);
    res.status(200).json({ message: `Delete Location ${req.params.id} Placeholder` }); 
});


// Resource Types
app.get('/api/v1/resource-types', (req: Request, res: Response) => { 
    console.log('GET /resource-types requested');
    res.status(200).json({ message: 'Get Resource Types Placeholder' }); 
});
app.post('/api/v1/resource-types', (req: Request, res: Response) => { 
    console.log('POST /resource-types requested with body:', req.body);
    res.status(201).json({ message: 'Create Resource Type Placeholder', data: req.body }); 
});
app.get('/api/v1/resource-types/:id', (req: Request, res: Response) => { 
    console.log(`GET /resource-types/${req.params.id} requested`);
    res.status(200).json({ message: `Get Resource Type ${req.params.id} Placeholder` }); 
});
app.put('/api/v1/resource-types/:id', (req: Request, res: Response) => { 
    console.log(`PUT /resource-types/${req.params.id} requested with body:`, req.body);
    res.status(200).json({ message: `Update Resource Type ${req.params.id} Placeholder`, data: req.body }); 
});
app.delete('/api/v1/resource-types/:id', (req: Request, res: Response) => { 
    console.log(`DELETE /resource-types/${req.params.id} requested`);
    res.status(200).json({ message: `Delete Resource Type ${req.params.id} Placeholder` }); 
});


// Resources
app.get('/api/v1/resources', (req: Request, res: Response) => { 
    console.log('GET /resources requested with query:', req.query);
    res.status(200).json({ message: 'Get Resources Placeholder', filters: req.query }); 
});
app.post('/api/v1/resources', (req: Request, res: Response) => { 
    console.log('POST /resources requested with body:', req.body);
    res.status(201).json({ message: 'Create Resource Placeholder', data: req.body }); 
});
app.get('/api/v1/resources/:id', (req: Request, res: Response) => { 
    console.log(`GET /resources/${req.params.id} requested`);
    res.status(200).json({ message: `Get Resource ${req.params.id} Placeholder` }); 
});
app.put('/api/v1/resources/:id', (req: Request, res: Response) => { 
    console.log(`PUT /resources/${req.params.id} requested with body:`, req.body);
    res.status(200).json({ message: `Update Resource ${req.params.id} Placeholder`, data: req.body }); 
});
app.delete('/api/v1/resources/:id', (req: Request, res: Response) => { 
    console.log(`DELETE /resources/${req.params.id} requested`);
    res.status(200).json({ message: `Delete Resource ${req.params.id} Placeholder` }); 
});
app.get('/api/v1/resources/:id/availability', (req: Request, res: Response) => { 
    console.log(`GET /resources/${req.params.id}/availability requested with query:`, req.query);
    res.status(200).json({ message: `Get Resource ${req.params.id} Availability Placeholder`, query: req.query }); 
});

// --- Error Handling ---
app.use((req: Request, res: Response, next: NextFunction) => {
  // Forward to the error handler if no routes matched
  const error = new Error('Not Found');
  (error as any).status = 404;
  next(error);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => { // Changed Error to any to access status/code
  console.error("[" + (err.status || 500) + "] " + err.message + (err.stack ? "\n" + err.stack : "")); 
  
  // Use standardized error response format
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
    // category: err.category || 'INTERNAL_ERROR', // Add category later if needed
    // details: err.details || {}, // Add details later if needed
    // timestamp: new Date().toISOString(),
    // path: req.path,
    // transactionId: req.headers['x-transaction-id'] || 'N/A' // Add transaction ID later
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Calendar Service listening on port ${PORT}`);
}); 