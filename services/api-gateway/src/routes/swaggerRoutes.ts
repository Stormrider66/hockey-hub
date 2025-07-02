import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { 
  swaggerSpec, 
  userServiceSpec,
  medicalServiceSpec,
  trainingServiceSpec,
  calendarServiceSpec,
  communicationServiceSpec,
  swaggerUiOptions,
  generateServiceList 
} from '../swagger/swaggerConfig';

const router = Router();

// Custom HTML template for the main API docs page
const createMainDocumentationHTML = (): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hockey Hub API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            margin: 0 0 20px 0;
            color: #1976d2;
            font-size: 1.8em;
            font-weight: 400;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .service-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
            transition: all 0.3s ease;
        }
        .service-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        .service-card h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 1.3em;
        }
        .service-card .meta {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 15px;
        }
        .service-card .description {
            color: #555;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        .service-card a {
            display: inline-block;
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
            padding: 8px 16px;
            border: 1px solid #1976d2;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .service-card a:hover {
            background: #1976d2;
            color: white;
        }
        .quick-links {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .quick-links h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .quick-links ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .quick-links li a {
            color: #1976d2;
            text-decoration: none;
            padding: 5px 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
            font-size: 0.9em;
        }
        .quick-links li a:hover {
            background: #1976d2;
            color: white;
        }
        .info-section {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
        }
        .info-section h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
        }
        .info-section p {
            margin: 0;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            margin-top: 40px;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        .badge {
            display: inline-block;
            background: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: 500;
            margin-left: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hockey Hub API Documentation</h1>
            <p>Comprehensive API documentation for the Hockey Hub platform</p>
        </div>
        
        <div class="content">
            <div class="quick-links">
                <h3>Quick Navigation</h3>
                <ul>
                    <li><a href="#overview">Platform Overview</a></li>
                    <li><a href="#authentication">Authentication</a></li>
                    <li><a href="#services">Service Documentation</a></li>
                    <li><a href="#getting-started">Getting Started</a></li>
                </ul>
            </div>

            <section class="section" id="overview">
                <h2>Platform Overview</h2>
                <p>Hockey Hub is a comprehensive sports management platform built with a microservices architecture. 
                The platform provides role-based access for players, coaches, parents, medical staff, and administrators.</p>
                
                <div class="info-section">
                    <h3>🏗️ Microservices Architecture</h3>
                    <p>The platform consists of 5 core microservices, each handling specific domain functionality. 
                    All services communicate through the API Gateway, which provides centralized authentication, 
                    rate limiting, and request routing.</p>
                </div>
            </section>

            <section class="section" id="authentication">
                <h2>Authentication & Authorization</h2>
                <p>All API endpoints (except public authentication endpoints) require a valid JWT token. 
                The token must be included in the Authorization header of each request.</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0;">
                    <strong>Authorization Header Format:</strong><br>
                    <code>Authorization: Bearer &lt;your-jwt-token&gt;</code>
                </div>
                
                <p><strong>Obtaining a Token:</strong> Use the <code>POST /auth/login</code> endpoint to authenticate 
                and receive a JWT token. The token expires after 1 hour and can be refreshed using the 
                <code>POST /auth/refresh</code> endpoint.</p>
            </section>

            <section class="section" id="services">
                <h2>Service Documentation</h2>
                <div class="services-grid">
                    <div class="service-card">
                        <h3>User Service <span class="badge">Auth</span></h3>
                        <div class="meta">Port: 3001 | Base Path: /auth</div>
                        <div class="description">
                            Handles user authentication, registration, role-based access control, and user profile management.
                            Core authentication provider for the entire platform.
                        </div>
                        <a href="/api-docs/user">View Documentation →</a>
                    </div>
                    
                    <div class="service-card">
                        <h3>Medical Service <span class="badge">Health</span></h3>
                        <div class="meta">Port: 3005 | Base Path: /medical</div>
                        <div class="description">
                            Manages player health data, injury tracking, wellness monitoring, and medical availability status.
                            Includes HRV monitoring and team wellness analytics.
                        </div>
                        <a href="/api-docs/medical">View Documentation →</a>
                    </div>
                    
                    <div class="service-card">
                        <h3>Training Service <span class="badge">Performance</span></h3>
                        <div class="meta">Port: 3004 | Base Path: /training</div>
                        <div class="description">
                            Handles workout session management, exercise tracking, real-time workout execution, 
                            and training performance analytics with WebSocket support.
                        </div>
                        <a href="/api-docs/training">View Documentation →</a>
                    </div>
                    
                    <div class="service-card">
                        <h3>Calendar Service <span class="badge">Scheduling</span></h3>
                        <div class="meta">Port: 3003 | Base Path: /calendar</div>
                        <div class="description">
                            Manages events, scheduling, resource booking, recurring events, and calendar synchronization.
                            Supports iCal export and external calendar integration.
                        </div>
                        <a href="/api-docs/calendar">View Documentation →</a>
                    </div>
                    
                    <div class="service-card">
                        <h3>Communication Service <span class="badge">Messaging</span></h3>
                        <div class="meta">Port: 3002 | Base Path: /communication</div>
                        <div class="description">
                            Provides real-time messaging, notifications, email/SMS delivery, team broadcasts, 
                            and communication analytics with chat bot support.
                        </div>
                        <a href="/api-docs/communication">View Documentation →</a>
                    </div>
                </div>
            </section>

            <section class="section" id="getting-started">
                <h2>Getting Started</h2>
                
                <h3>1. Authentication Flow</h3>
                <ol>
                    <li>Register a new account: <code>POST /auth/register</code></li>
                    <li>Login to get JWT token: <code>POST /auth/login</code></li>
                    <li>Include token in subsequent requests</li>
                    <li>Refresh token when needed: <code>POST /auth/refresh</code></li>
                </ol>

                <h3>2. Rate Limits</h3>
                <ul>
                    <li><strong>General API:</strong> 1000 requests/hour</li>
                    <li><strong>Authentication:</strong> 100 requests/hour</li>
                    <li><strong>Password Reset:</strong> 5 requests/hour</li>
                </ul>

                <h3>3. Response Format</h3>
                <p>All API responses follow a consistent format:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                    <strong>Success Response:</strong><br>
                    <code>{ "success": true, "data": {...}, "meta": {...} }</code><br><br>
                    <strong>Error Response:</strong><br>
                    <code>{ "success": false, "error": "Error message", "code": "ERROR_CODE" }</code>
                </div>

                <h3>4. Pagination</h3>
                <p>List endpoints support pagination with <code>page</code> and <code>limit</code> query parameters. 
                Response includes pagination metadata in the <code>meta</code> field.</p>
            </section>
        </div>
        
        <div class="footer">
            <p>Hockey Hub API Documentation | Version 1.0.0 | 
            <a href="mailto:dev@hockeyhub.com" style="color: #1976d2;">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
  `;
};

// Main API documentation route with custom HTML
router.get('/', (req, res) => {
  res.send(createMainDocumentationHTML());
});

// Aggregated API documentation (all services)
router.use('/all', swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions), swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Individual service documentation routes
router.use('/user', swaggerUi.serveFiles(userServiceSpec, swaggerUiOptions), swaggerUi.setup(userServiceSpec, swaggerUiOptions));
router.use('/medical', swaggerUi.serveFiles(medicalServiceSpec, swaggerUiOptions), swaggerUi.setup(medicalServiceSpec, swaggerUiOptions));
router.use('/training', swaggerUi.serveFiles(trainingServiceSpec, swaggerUiOptions), swaggerUi.setup(trainingServiceSpec, swaggerUiOptions));
router.use('/calendar', swaggerUi.serveFiles(calendarServiceSpec, swaggerUiOptions), swaggerUi.setup(calendarServiceSpec, swaggerUiOptions));
router.use('/communication', swaggerUi.serveFiles(communicationServiceSpec, swaggerUiOptions), swaggerUi.setup(communicationServiceSpec, swaggerUiOptions));

// JSON spec endpoints for programmatic access
router.get('/specs/aggregated.json', (req, res) => {
  res.json(swaggerSpec);
});

router.get('/specs/user.json', (req, res) => {
  res.json(userServiceSpec);
});

router.get('/specs/medical.json', (req, res) => {
  res.json(medicalServiceSpec);
});

router.get('/specs/training.json', (req, res) => {
  res.json(trainingServiceSpec);
});

router.get('/specs/calendar.json', (req, res) => {
  res.json(calendarServiceSpec);
});

router.get('/specs/communication.json', (req, res) => {
  res.json(communicationServiceSpec);
});

// Health check for documentation service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'API Documentation',
    timestamp: new Date().toISOString(),
    services: {
      user: userServiceSpec ? 'available' : 'unavailable',
      medical: medicalServiceSpec ? 'available' : 'unavailable',
      training: trainingServiceSpec ? 'available' : 'unavailable',
      calendar: calendarServiceSpec ? 'available' : 'unavailable',
      communication: communicationServiceSpec ? 'available' : 'unavailable'
    }
  });
});

export default router;