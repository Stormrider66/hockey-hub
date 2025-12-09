# Hockey Hub API Documentation

## Overview

Hockey Hub uses a microservices architecture with an API Gateway pattern. All client requests go through the API Gateway service, which handles authentication, rate limiting, and request routing to appropriate microservices.

## Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.hockeyhub.com`

## Authentication

### JWT Token Authentication

All API requests (except login and public endpoints) require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Login Endpoint

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "player",
      "firstName": "Erik",
      "lastName": "Johansson"
    }
  }
}
```

## Microservices and Endpoints

### 1. User Service (Port: 3001)

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

#### User Management
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

#### Organization Management
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization (admin only)
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

#### Team Management
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/:id/players` - Get team players
- `POST /api/teams/:id/players` - Add player to team
- `DELETE /api/teams/:id/players/:playerId` - Remove player from team

### 2. Calendar Service (Port: 3003)

#### Events
- `GET /api/events` - List events (filtered by user role/team)
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/upcoming` - Get upcoming events
- `POST /api/events/:id/attendance` - Mark attendance

#### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `GET /api/locations/:id` - Get location details
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

#### Resources
- `GET /api/resources` - List resources (ice time, rooms, etc.)
- `POST /api/resources` - Create resource
- `GET /api/resources/:id` - Get resource details
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `GET /api/resources/:id/availability` - Check resource availability

### 3. Training Service (Port: 3004)

#### Training Sessions
- `GET /api/training/sessions` - List training sessions
- `POST /api/training/sessions` - Create training session
- `GET /api/training/sessions/:id` - Get session details
- `PUT /api/training/sessions/:id` - Update session
- `DELETE /api/training/sessions/:id` - Delete session
- `POST /api/training/sessions/:id/complete` - Mark session complete

#### Exercises
- `GET /api/training/exercises` - List exercises
- `POST /api/training/exercises` - Create exercise
- `GET /api/training/exercises/:id` - Get exercise details
- `PUT /api/training/exercises/:id` - Update exercise
- `DELETE /api/training/exercises/:id` - Delete exercise

#### Physical Tests
- `GET /api/training/tests` - List physical tests
- `POST /api/training/tests` - Create test definition
- `GET /api/training/tests/:id` - Get test details
- `POST /api/training/tests/:id/results` - Submit test results
- `GET /api/training/tests/results/:playerId` - Get player test results

#### Training Plans
- `GET /api/training/plans` - List training plans
- `POST /api/training/plans` - Create training plan
- `GET /api/training/plans/:id` - Get plan details
- `PUT /api/training/plans/:id` - Update plan
- `DELETE /api/training/plans/:id` - Delete plan
- `POST /api/training/plans/:id/assign` - Assign plan to players

### 4. Medical Service (Port: 3005)

#### Injuries
- `GET /api/medical/injuries` - List injuries
- `POST /api/medical/injuries` - Report injury
- `GET /api/medical/injuries/:id` - Get injury details
- `PUT /api/medical/injuries/:id` - Update injury
- `POST /api/medical/injuries/:id/updates` - Add injury update

#### Medical Records
- `GET /api/medical/players/:playerId/records` - Get player medical records
- `POST /api/medical/players/:playerId/records` - Add medical record
- `GET /api/medical/records/:id` - Get record details
- `PUT /api/medical/records/:id` - Update record

#### Player Availability
- `GET /api/medical/availability` - Get team availability
- `POST /api/medical/availability` - Update player availability
- `GET /api/medical/availability/:playerId` - Get player availability

#### Treatment Plans
- `GET /api/medical/treatments` - List treatment plans
- `POST /api/medical/treatments` - Create treatment plan
- `GET /api/medical/treatments/:id` - Get treatment details
- `PUT /api/medical/treatments/:id` - Update treatment
- `POST /api/medical/treatments/:id/complete` - Complete treatment

### 5. Communication Service (Port: 3002)

#### Messages
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message details
- `PUT /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message

#### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

#### Announcements
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements/:id` - Get announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### 6. Payment Service (Port: 3008)

#### Invoices
- `GET /api/payments/invoices` - List invoices
- `POST /api/payments/invoices` - Create invoice
- `GET /api/payments/invoices/:id` - Get invoice details
- `PUT /api/payments/invoices/:id` - Update invoice
- `POST /api/payments/invoices/:id/send` - Send invoice

#### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/:id/refund` - Refund payment

#### Subscriptions
- `GET /api/payments/subscriptions` - List subscriptions
- `POST /api/payments/subscriptions` - Create subscription
- `GET /api/payments/subscriptions/:id` - Get subscription
- `PUT /api/payments/subscriptions/:id` - Update subscription
- `DELETE /api/payments/subscriptions/:id` - Cancel subscription

### 7. Statistics Service (Port: 3007)

#### Player Statistics
- `GET /api/stats/players/:playerId` - Get player statistics
- `GET /api/stats/players/:playerId/performance` - Get performance metrics
- `GET /api/stats/players/:playerId/wellness` - Get wellness trends
- `GET /api/stats/players/:playerId/training` - Get training statistics

#### Team Statistics
- `GET /api/stats/teams/:teamId` - Get team statistics
- `GET /api/stats/teams/:teamId/performance` - Team performance metrics
- `GET /api/stats/teams/:teamId/attendance` - Attendance statistics
- `GET /api/stats/teams/:teamId/injuries` - Injury statistics

#### Reports
- `GET /api/stats/reports/generate` - Generate custom report
- `GET /api/stats/reports/:id` - Get report
- `GET /api/stats/reports` - List generated reports

### 8. Planning Service (Port: 3006)

#### Season Planning
- `GET /api/planning/seasons` - List seasons
- `POST /api/planning/seasons` - Create season
- `GET /api/planning/seasons/:id` - Get season details
- `PUT /api/planning/seasons/:id` - Update season

#### Practice Planning
- `GET /api/planning/practices` - List practice plans
- `POST /api/planning/practices` - Create practice plan
- `GET /api/planning/practices/:id` - Get practice details
- `PUT /api/planning/practices/:id` - Update practice
- `POST /api/planning/practices/:id/duplicate` - Duplicate practice

#### Templates
- `GET /api/planning/templates` - List plan templates
- `POST /api/planning/templates` - Create template
- `GET /api/planning/templates/:id` - Get template
- `PUT /api/planning/templates/:id` - Update template
- `DELETE /api/planning/templates/:id` - Delete template

### 9. Admin Service (Port: 3009)

#### System Configuration
- `GET /api/admin/config` - Get system configuration
- `PUT /api/admin/config` - Update configuration
- `GET /api/admin/config/:key` - Get specific config value
- `PUT /api/admin/config/:key` - Update specific config

#### System Health
- `GET /api/admin/health` - System health check
- `GET /api/admin/health/services` - Check all services
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/logs` - View system logs

#### Data Management
- `POST /api/admin/backup` - Create system backup
- `POST /api/admin/restore` - Restore from backup
- `POST /api/admin/export` - Export data
- `POST /api/admin/import` - Import data

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-06-25T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-06-25T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid authentication token |
| `AUTH_EXPIRED` | Authentication token expired |
| `PERMISSION_DENIED` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `CONFLICT` | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting

API rate limits:
- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Auth endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1624632000
```

## Webhooks

Hockey Hub supports webhooks for real-time events:

### Available Events
- `user.created`
- `user.updated`
- `player.injured`
- `player.recovered`
- `event.created`
- `event.updated`
- `event.cancelled`
- `payment.received`
- `payment.failed`

### Webhook Payload
```json
{
  "event": "player.injured",
  "timestamp": "2024-06-25T10:30:00Z",
  "data": {
    // Event-specific data
  },
  "signature": "sha256=..."
}
```

## API Versioning

The API uses URL versioning. Current version: `v1`

Future versions will be available at:
- `/api/v2/...`
- `/api/v3/...`

Deprecated endpoints will include a `Deprecation` header with sunset date.