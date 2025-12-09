# User Service

## Overview

The User Service is responsible for user authentication, authorization, and management of users, organizations, and teams in the Hockey Hub platform.

## Features

- JWT-based authentication
- Role-based access control (RBAC)
- User registration and profile management
- Organization and team management
- Parent-child relationships
- Password reset functionality
- Session management

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Password Hashing**: bcrypt

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (for session management)

### Installation

```bash
cd services/user-service
npm install
```

### Environment Variables

Create a `.env` file in the service root:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hockey_hub_users
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test
```

## API Endpoints

See [API Documentation](../../API.md#1-user-service-port-3001) for detailed endpoint information.

### Key Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /users/me` - Get current user profile
- `GET /organizations` - List organizations
- `GET /teams` - List teams

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Organizations Table
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Teams Table
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  category VARCHAR(50), -- U10, U12, Senior, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50), -- player, coach, assistant_coach
  jersey_number INTEGER,
  position VARCHAR(50),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);
```

## User Roles

The system supports the following roles:

- **admin** - System administrator
- **club_admin** - Club/Organization administrator
- **coach** - Team coach
- **assistant_coach** - Assistant coach
- **player** - Team player
- **parent** - Parent/Guardian
- **medical_staff** - Medical personnel
- **equipment_manager** - Equipment manager
- **physical_trainer** - Physical trainer

## Authentication Flow

1. User registers or logs in
2. Server validates credentials
3. Server generates JWT token with user data and permissions
4. Client includes token in Authorization header for subsequent requests
5. Server validates token and extracts user context

## Error Handling

The service uses standard HTTP status codes and returns errors in the format:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID",
    "message": "Invalid email or password"
  }
}
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests with coverage
npm run test:coverage
```

## Deployment

The service is containerized and can be deployed using Docker:

```bash
docker build -t hockey-hub/user-service .
docker run -p 3001:3001 --env-file .env hockey-hub/user-service
```

## Monitoring

The service exposes health check and metrics endpoints:

- `GET /health` - Basic health check
- `GET /metrics` - Prometheus metrics

## Security Considerations

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 7 days (configurable)
- Rate limiting on authentication endpoints
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

## Related Services

- **API Gateway** - Routes requests to this service
- **Communication Service** - Sends emails for password reset
- **Admin Service** - Manages system-wide user settings