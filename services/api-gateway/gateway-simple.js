const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3010', 'http://localhost:3002', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', port: PORT });
});

// Proxy function
function proxyRequest(targetHost, targetPort) {
  return (req, res) => {
    const options = {
      hostname: targetHost,
      port: targetPort,
      path: req.originalUrl,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${targetHost}:${targetPort}`
      }
    };

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> http://${targetHost}:${targetPort}`);

    const proxyReq = http.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode);
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`Proxy error for ${req.originalUrl}:`, err.message);
      res.status(502).json({ 
        error: 'Service temporarily unavailable',
        service: req.originalUrl,
        details: err.message
      });
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
  };
}

// Route all /api/v1/auth requests to user service
app.use('/api/v1/auth', proxyRequest('localhost', 3001));
app.use('/api/v1/users', proxyRequest('localhost', 3001));
app.use('/api/v1/players', proxyRequest('localhost', 3001));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway (Simple) running on port ${PORT}`);
  console.log('📡 Proxying:');
  console.log('   /api/v1/auth -> http://localhost:3001');
  console.log('   /api/v1/users -> http://localhost:3001');
  console.log('   /api/v1/players -> http://localhost:3001');
});