import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Middleware
app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Adds various security headers
app.use(express.json()); // Parses incoming JSON requests

// --- Service Routes --- //

// Simple health check endpoint
app.get('/api/gateway/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Proxy requests to User Service (running on port 3001)
app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3001', // Target service URL
  changeOrigin: true, // Recommended for virtual hosted sites
  pathRewrite: {
    '^/api/users': '', // Remove '/api/users' prefix when forwarding
  },
  onProxyReq: (_proxyReq, req: Request, _res: Response) => {
    console.log(`[API Gateway] Proxying request to User Service: ${req.method} ${req.originalUrl}`);
    // You can add custom headers here if needed
    // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('[API Gateway] Proxy error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }
}));

// Proxy requests to Calendar Service (running on port 3003)
app.use('/api/calendar', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/calendar': '', // Remove '/api/calendar' prefix when forwarding
  },
  onProxyReq: (_proxyReq, req: Request, _res: Response) => {
    console.log(`[API Gateway] Proxying request to Calendar Service: ${req.method} ${req.originalUrl}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[API Gateway] Calendar Service Proxy error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Calendar Service Proxy error', details: err.message });
    }
  }
}));

// Proxy requests to Training Service (running on port 3004)
app.use('/api/v1/training', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  onProxyReq: (_proxyReq, req, _res) => {
    console.log(`[API Gateway] Proxying request to Training Service: ${req.method} ${req.originalUrl}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[API Gateway] Training Service Proxy error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Training Service Proxy error', details: err.message });
    }
  }
}));

// Proxy requests to User Service (running on port 3001)
app.use('/api/v1/users', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/users': '', // strip prefix when forwarding to user-service
  },
  onProxyReq: (_proxyReq, req: Request, _res: Response) => {
    console.log(`[API Gateway] Proxying request to User Service: ${req.method} ${req.originalUrl}`);
  },
  onError: (err: Error, _req: Request, res: Response) => {
    console.error('[API Gateway] User Service Proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'User Service Proxy error', details: err.message });
    }
  },
}));

// Add proxies for other services here as they are created
// app.use('/api/calendar', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
// ... etc

// Catch-all for unhandled routes (optional)
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found in API Gateway' });
});

// --- Start Server --- //
app.listen(PORT, () => {
  console.log(`[API Gateway] Server listening on port ${PORT}`);
}); 