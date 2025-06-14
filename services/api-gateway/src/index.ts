import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate } from './middleware/authMiddleware';
import fetch from 'node-fetch';

// Helper to build proxy with common settings
function buildProxy(target: string, stripPrefix: string = '') {
  const config: Record<string, any> = {
    target,
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 10000, // 10 second timeout
    onProxyReq: (proxyReq: any, req: any, _res: any) => {
      // Forward cookies and other headers
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
      
      // Forward Authorization header if present
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      
      // If no Authorization header but we have a validated user, add it
      if (!req.headers.authorization && req.user && req.headers.cookie) {
        // Extract access token from cookies and add as Bearer token
        const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        
        if (cookies.accessToken) {
          proxyReq.setHeader('Authorization', `Bearer ${cookies.accessToken}`);
        }
      }
    },
    onProxyRes: (proxyRes: any, _req: any, res: any) => {
      // Forward Set-Cookie headers back to client
      if (proxyRes.headers['set-cookie']) {
        res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
      }
    },
    onError: (err: any, req: any, res: any) => {
      console.error(`[API Gateway] Proxy error for ${req.url}:`, err.message);
      res.status(502).json({ error: 'Service temporarily unavailable' });
    },
  };
  
  // Only add pathRewrite if stripPrefix is provided and not empty
  if (stripPrefix) {
    config.pathRewrite = { [stripPrefix]: '' };
  }
  
  return createProxyMiddleware(config);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000'], // Frontend and any other allowed origins
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
})); // Enable CORS for all routes
app.use(helmet()); // Adds various security headers
app.use(express.json()); // Parses incoming JSON requests

// --- Health Check ---
app.get('/api/gateway/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// --- Public Auth Routes (no JWT needed) ---
console.log('[API Gateway] Setting up auth proxy to http://127.0.0.1:3001');
app.all('/api/v1/auth/*', async (req: Request, res: Response) => {
  console.log(`[API Gateway] Manual proxy: ${req.method} ${req.url}`);
  console.log(`[API Gateway] Headers:`, req.headers);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const targetUrl = `http://127.0.0.1:3001${req.url}`;
    console.log(`[API Gateway] Forwarding to: ${targetUrl}`);
    
    // Forward all headers including cookies
    const forwardHeaders: Record<string, any> = {};
    Object.keys(req.headers).forEach(key => {
      if (key !== 'host') { // Don't forward host header
        forwardHeaders[key] = req.headers[key];
      }
    });
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });
    
    console.log(`[API Gateway] User Service responded with ${response.status}`);
    
    // Forward response status
    res.status(response.status);
    
    // Forward all response headers including Set-Cookie
    response.headers.forEach((value, key) => {
      console.log(`[API Gateway] Forwarding header: ${key} = ${value}`);
      if (key.toLowerCase() === 'set-cookie') {
        // Handle Set-Cookie specially to preserve multiple values
        const setCookieValues = response.headers.raw()['set-cookie'];
        if (setCookieValues) {
          res.setHeader('Set-Cookie', setCookieValues);
          console.log(`[API Gateway] Set-Cookie forwarded:`, setCookieValues);
        }
      } else {
        res.setHeader(key, value);
      }
    });
    
    const data = await response.text();
    console.log(`[API Gateway] Response data length: ${data.length}`);
    res.send(data);
    
  } catch (error) {
    console.error(`[API Gateway] Manual proxy error:`, error);
    res.status(502).json({ error: 'Service temporarily unavailable', service: 'user-service' });
  }
});

// --- Authentication Middleware (protects everything below) ---
app.use('/api', authenticate);

// --- Protected Proxies ---
// User Service (general)
app.use('/api/v1/users', buildProxy('http://127.0.0.1:3001'));

// Calendar Service
app.use('/api/v1/calendar', buildProxy('http://127.0.0.1:3003'));

// Training Service
app.use('/api/v1/training', buildProxy('http://127.0.0.1:3004'));

// Communication Service
app.use('/api/v1/communication', buildProxy('http://127.0.0.1:3020'));

// Medical Service
app.use('/api/v1/medical', buildProxy('http://127.0.0.1:3005'));

// Planning Service
app.use('/api/v1/planning', buildProxy('http://127.0.0.1:3006'));

// Statistics Service
app.use('/api/v1/statistics', buildProxy('http://127.0.0.1:3007'));

// Payment Service
app.use('/api/v1/payment', buildProxy('http://127.0.0.1:3008'));

// Admin Service
app.use('/api/v1/admin', buildProxy('http://127.0.0.1:3009'));

// Add more service proxies here following the same pattern...

// Catch-all 404
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found in API Gateway' });
});

// --- Start Server --- //
app.listen(PORT, () => {
  console.log(`[API Gateway] Server listening on port ${PORT}`);
}); 