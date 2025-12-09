import swaggerJsdoc from 'swagger-jsdoc';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load individual service specifications
const loadServiceSpec = (serviceName: string): any => {
  try {
    const specPath = path.join(__dirname, `../../../${serviceName}-service/src/swagger/${serviceName}-service.yaml`);
    const yamlContent = fs.readFileSync(specPath, 'utf8');
    return yaml.load(yamlContent) as any;
  } catch (error) {
    console.warn(`Could not load spec for ${serviceName} service:`, error);
    return null;
  }
};

// Service configurations
const services = [
  { name: 'user', port: 3001, basePath: '/auth' },
  { name: 'communication', port: 3002, basePath: '/communication' },
  { name: 'calendar', port: 3003, basePath: '/calendar' },
  { name: 'training', port: 3004, basePath: '/training' },
  { name: 'medical', port: 3005, basePath: '/medical' }
];

// Aggregate OpenAPI specification
const createAggregatedSpec = (): any => {
  const aggregatedSpec: any = {
    openapi: '3.0.3',
    info: {
      title: 'Hockey Hub API Documentation',
      description: `
# Hockey Hub Platform API

Welcome to the comprehensive API documentation for the Hockey Hub platform. This documentation aggregates all microservices into a single, easy-to-navigate interface.

## Platform Overview

Hockey Hub is a comprehensive sports management platform built with a microservices architecture. The platform supports multiple user roles and provides features for:

- **User Management & Authentication** - Registration, login, role-based access control
- **Medical Tracking** - Injury management, wellness monitoring, player availability
- **Training Management** - Workout sessions, exercise tracking, performance analytics
- **Calendar & Scheduling** - Event management, resource booking, calendar synchronization
- **Communication** - Real-time messaging, notifications, broadcasts

## Architecture

The platform consists of the following microservices:

- **API Gateway** (Port 3000) - Central entry point and request routing
- **User Service** (Port 3001) - Authentication and user management
- **Communication Service** (Port 3002) - Messaging and notifications
- **Calendar Service** (Port 3003) - Event and resource management
- **Training Service** (Port 3004) - Workout and exercise tracking
- **Medical Service** (Port 3005) - Health and medical data

## Authentication

All API endpoints (except public authentication endpoints) require a valid JWT token obtained from the User Service login endpoint.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited to ensure fair usage:
- General endpoints: 1000 requests/hour
- Authentication endpoints: 100 requests/hour
- Password reset: 5 requests/hour

## Error Handling

All APIs follow a consistent error response format:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`

## Real-time Features

The platform includes real-time features via WebSocket connections:
- Live workout tracking
- Real-time messaging
- Live notifications
- Calendar updates

## Support

For API support, please contact: dev@hockeyhub.com
      `,
      version: '1.0.0',
      contact: {
        name: 'Hockey Hub Development Team',
        email: 'dev@hockeyhub.com',
        url: 'https://hockeyhub.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development API Gateway'
      },
      {
        url: 'https://api.hockeyhub.com',
        description: 'Production API Gateway'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
        externalDocs: {
          description: 'User Service Documentation',
          url: '/api-docs/user'
        }
      },
      {
        name: 'Medical',
        description: 'Medical data and player health tracking',
        externalDocs: {
          description: 'Medical Service Documentation',
          url: '/api-docs/medical'
        }
      },
      {
        name: 'Training',
        description: 'Workout sessions and exercise tracking',
        externalDocs: {
          description: 'Training Service Documentation',
          url: '/api-docs/training'
        }
      },
      {
        name: 'Calendar',
        description: 'Event management and scheduling',
        externalDocs: {
          description: 'Calendar Service Documentation',
          url: '/api-docs/calendar'
        }
      },
      {
        name: 'Communication',
        description: 'Messaging and notifications',
        externalDocs: {
          description: 'Communication Service Documentation',
          url: '/api-docs/communication'
        }
      }
    ],
    paths: {} as Record<string, any>,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login endpoint'
        }
      },
       schemas: {
        // Common schemas used across services
        BaseResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Optional response message'
            }
          },
          required: ['success']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code for programmatic handling'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          },
          required: ['success', 'error']
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page'
            }
          },
          required: ['total', 'page', 'limit', 'totalPages']
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Insufficient permissions',
                code: 'ACCESS_DENIED'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ErrorResponse' },
                  {
                    type: 'object',
                    properties: {
                      details: {
                        type: 'object',
                        additionalProperties: {
                          type: 'array',
                          items: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  email: ['Email is required', 'Email must be valid'],
                  password: ['Password must be at least 8 characters']
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMITED'
              }
            }
          },
          headers: {
            'Retry-After': {
              description: 'Seconds to wait before making another request',
              schema: {
                type: 'integer'
              }
            },
            'X-RateLimit-Limit': {
              description: 'Request limit per time window',
              schema: {
                type: 'integer'
              }
            },
            'X-RateLimit-Remaining': {
              description: 'Requests remaining in current window',
              schema: {
                type: 'integer'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };

  // Load and merge service specifications
  services.forEach(service => {
    const serviceSpec = loadServiceSpec(service.name);
    if (serviceSpec && serviceSpec.paths) {
      // Prefix paths with service base path
      Object.keys(serviceSpec.paths).forEach((pathKey: string) => {
        const fullPath = `${service.basePath}${pathKey}`;
        (aggregatedSpec.paths as any)[fullPath] = (serviceSpec.paths as any)[pathKey];
        
        // Update server URLs in path operations
        Object.values((serviceSpec.paths as any)[pathKey]).forEach((operation: any) => {
          if (operation.servers) {
            operation.servers = [
              {
                url: `http://localhost:3000${service.basePath}`,
                description: 'Development via API Gateway'
              },
              {
                url: `https://api.hockeyhub.com${service.basePath}`,
                description: 'Production via API Gateway'
              }
            ];
          }
        });
      });

      // Merge schemas (avoid conflicts)
      if (serviceSpec.components?.schemas) {
        Object.keys(serviceSpec.components.schemas).forEach(schemaName => {
          const prefixedName = `${service.name.charAt(0).toUpperCase() + service.name.slice(1)}${schemaName}`;
          aggregatedSpec.components.schemas[prefixedName] = serviceSpec.components.schemas[schemaName];
        });
      }
    }
  });

  return aggregatedSpec;
};

// Individual service specs for detailed documentation
const getServiceSpec = (serviceName: string): any => {
  const serviceSpec = loadServiceSpec(serviceName);
  if (!serviceSpec) {
    return {
      openapi: '3.0.3',
      info: {
        title: `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service API`,
        description: `Service specification not found`,
        version: '1.0.0'
      },
      paths: {}
    };
  }
  return serviceSpec;
};

// Swagger configuration
const swaggerOptions = {
  definition: createAggregatedSpec(),
  apis: [], // We're using pre-built specs
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Export individual service specs
export const userServiceSpec = getServiceSpec('user');
export const medicalServiceSpec = getServiceSpec('medical');
export const trainingServiceSpec = getServiceSpec('training');
export const calendarServiceSpec = getServiceSpec('calendar');
export const communicationServiceSpec = getServiceSpec('communication');

// Swagger UI configuration options
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1976d2; }
    .swagger-ui .scheme-container { background: #f5f5f5; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: 'Hockey Hub API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// Generate service list for the main documentation page
export const generateServiceList = (): string => {
  return services.map(service => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; color: #1976d2;">
        ${service.name.charAt(0).toUpperCase() + service.name.slice(1)} Service
      </h3>
      <p style="margin: 0 0 10px 0; color: #666;">
        Port: ${service.port} | Base Path: ${service.basePath}
      </p>
      <a href="/api-docs/${service.name}" style="color: #1976d2; text-decoration: none;">
        View ${service.name} service documentation →
      </a>
    </div>
  `).join('');
};

export default swaggerSpec;