# Hockey Hub - Technical Context

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript (using Next.js)
- **Component Library**: **shadcn/ui** [[memory:4.1]]
- **Styling**: Tailwind CSS (utility-first approach)
- **State Management**: Redux Toolkit (including RTK Query for API communication)
- **Icons**: **lucide-react** [[memory:4.10]]
- **Form Handling**: React Hook Form with Zod for validation
- **Internationalization**: `react-i18next`
- **Data Visualization**: Recharts
- **Testing**: Jest, React Testing Library, Cypress

### Backend
- **Runtime**: Node.js (LTS version)
- **Language**: TypeScript (strict mode)
- **API Framework**: Express.js
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt` for hashing
- **Validation**: `class-validator`, `class-transformer` (used with DTOs and entities)
- **Event Bus**: **NATS** (`nats.js`)
- **Database Access**: TypeORM
- **File Handling**: `multer` for uploads, AWS SDK for S3 interaction
- **Testing**: Jest, Supertest

### Database
- **RDBMS**: PostgreSQL 17
- **Caching**: **Redis**
- **Connection Management**: Connection pooling is used in each service.
- **Migrations**: TypeORM migrations are managed per-service.
- **Backups**: Automated daily backups are configured.
- **Schema**: Each service has its own dedicated database and schema.

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose for local development, Kubernetes planned for production.
- **CI/CD**: GitHub Actions
- **Observability Stack**: [[memory:6384293909347582517]]
  - **Logging**: Winston, ELK Stack (Elasticsearch, Logstash, Kibana)
  - **Monitoring**: Prometheus, Grafana
  - **Tracing**: **Jaeger**
  - **Alerting**: Alertmanager
- **Event Bus / Messaging**: **NATS**

### External Integrations
- **Payment Processing**: Stripe (planned, not yet implemented) [[memory:7952211796137778636]]
- **Cloud Storage**: **Amazon S3** for medical document storage. [[memory:6640872325499110337]]
- **Email Delivery**: Nodemailer with a configurable SMTP provider.
- **SMS Notifications**: Twilio (planned as optional integration)

## Development Environment

### Local Setup
- **Monorepo Management**: `turbo` is used to manage the monorepo, build processes, and dependencies.
- **Container Orchestration**: Docker Compose is used to spin up all services, databases, and infrastructure for local development.
- **Environment Variables**: Each package/service uses its own `.env` file for environment variables. There is no single root `.env` file.
- **Hot Reloading**: Enabled for both frontend and backend services for a smooth development experience.
- **Database Seeding**: The `user-service` contains seed scripts for creating initial development data (e.g., test users).
- **Service Discovery**: Docker Compose networking provides local DNS for inter-service communication.

### Standard Environment Variables
**Note**: The following is a representative sample. Each service has its own `.env` file, and variable names or values may differ slightly. For example, database credentials can be service-specific (e.g., `DB_USER=postgres` for medical-service). [[memory:5747803406406488166]]
```
# Common
NODE_ENV=development
LOG_LEVEL=debug

# Database (example for one service)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=hockey_hub_password
DB_DATABASE=hockeyhub_medical 

# Authentication (from user-service)
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_TOKEN_EXPIRATION_TIME=15m
JWT_REFRESH_TOKEN_EXPIRATION_TIME=7d

# NATS
NATS_URL=nats://nats:4222

# Service Ports
API_GATEWAY_PORT=3000
# ... other service ports ...

# External Integrations
AWS_S3_BUCKET_NAME=hockey-hub-medical-documents
AWS_ACCESS_KEY_ID=*****
AWS_SECRET_ACCESS_KEY=*****
AWS_REGION=eu-north-1
```

### Development Workflow
- **Branching Strategy**: Feature branches are created from a main `development` branch.
- **Code Reviews**: Pull Requests are required for all merges into `development`, requiring at least one approval.
- **CI/CD Pipeline**: GitHub Actions automatically runs linting, testing, and builds for each PR.
- **Versioning**: Semantic versioning is used for releases.
- **Security Scans**: GitHub CodeQL is used for static analysis security testing. [[memory:1408181784522788330]]

## Actual Project Structure
The project is a monorepo managed with `turbo`.

```
/Hockey-Hub/
├── .github/              # GitHub Actions workflows
├── apps/
│   └── frontend/         # Next.js frontend application
├── docs/                 # Project documentation
├── packages/
│   ├── monitoring/       # Shared monitoring and observability package
│   ├── shared-lib/       # Shared DTOs, entities, validation, etc.
│   └── translations/     # i18next translation files
├── services/
│   ├── admin-service/
│   ├── api-gateway/
│   ├── calendar-service/
│   ├── communication-service/
│   ├── medical-service/
│   ├── payment-service/
│   ├── planning-service/
│   ├── statistics-service/
│   ├── training-service/
│   └── user-service/
├── .gitignore
├── docker-compose.yml
├── package.json
└── turbo.json
```

## Technical Constraints

### Performance Requirements
- API response times < 200ms for critical operations
- Page load time < 2 seconds on standard connections
- Support for at least 1000 concurrent users
- Efficient handling of large datasets (10,000+ records)
- Optimized database queries with proper indexing

### Security Requirements
- HTTPS for all communications
- Secure password storage with `bcrypt`
- Role-based access control (RBAC) and attribute-based access control (ABAC) for all operations
- Comprehensive input validation on all API endpoints and services
- Protection against common web vulnerabilities (XSS, CSRF, SQLi, Path Traversal, SSRF). [[memory:1408181784522788330]]
- Use of cryptographically secure random number generation. [[memory:1408181784522788330]]
- Regular security scans with GitHub CodeQL.

### Scalability Requirements
- Horizontal scaling capability for all services
- Stateless service design where possible
- Database query optimization for large datasets
- Connection pooling for efficient resource usage
- Caching strategy for frequently accessed data

### Compliance Requirements
- GDPR compliance for user data
- Secure handling of medical information
- Proper consent management
- Data minimization principles
- Data retention policies

## Database Schema Overview
The database architecture is distributed. Each microservice is responsible for its own database and schema, ensuring loose coupling and independent scalability. The tables listed below are a logical aggregation of schemas across the different services.

### User Service Schema
- `users`: Core user profile information (UUID primary key).
// ... existing code ...
- `teams`: Team information.
- `team_members`: Associates users with teams and roles.
- `parent_child_relationships`: Links parent accounts to child (player) accounts.
- `organizations`: Top-level tenant organizations.

### Medical Service Schema
- `injuries`: Injury records with details like type, location, and severity.
- `injury_updates`: Chronological updates for an injury's progress.
- `treatments`: Specific treatments administered for an injury.
- `medical_assessments`: Records of medical check-ups.
- `medical_documents`: Metadata for documents stored in S3.
- `player_availability`: Tracks the current training status of a player.

### Training Service Schema
- `exercises`: A library of all possible exercises, including instructions and media links.
- `exercise_categories`: Categories for organizing exercises (e.g., Strength, Cardio).
- `workout_templates`: Pre-defined workout structures.
- `training_sessions`: Scheduled instances of workouts for players or groups.
- `exercise_executions`: Records of completed exercises by players (sets, reps, weight).

### Planning Service Schema
// ... existing code ...
- `seasons`: Season definitions.
- `season_phases`: Phases within seasons (e.g., pre-season, in-season).
- `team_goals`: Team objectives for a season or phase.
- `player_development_plans`: Individual player goals and focus areas.

### Calendar Service Schema
- `events`: All scheduled activities (games, practices, meetings).
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
- `event_participants`: Links users to events.

### Communication Service Schema
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing code ...
// ... existing-code ...
### Error Format
The standardized error response format (Rule 6.1) is enforced across all services:
```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE_STRING",
  "category": "AUTHENTICATION | AUTHORIZATION | VALIDATION | RESOURCE_CONFLICT | EXTERNAL_SERVICE | INTERNAL_ERROR",
  "details": { "field": "description of error" },
  "timestamp": "ISO_8601_TIMESTAMP",
  "path": "/path/that/was/called",
  "transactionId": "UNIQUE_CORRELATION_ID"
}
```

## Deployment Strategy

### Current Status
- **Development**: Fully containerized local environment using Docker Compose.
- **CI/CD**: A robust CI/CD pipeline is set up with GitHub Actions, running tests and builds on every pull request.
- **Staging/Production**: Not yet implemented. Kubernetes is the planned target.

### Deployment Process
1. Code is merged into the `development` branch.
2. GitHub Actions workflow triggers.
3. Linter and Prettier checks are run.
4. Unit and integration tests are executed for all affected packages and services.
5. Docker images are built for each service. (Pushing to a registry is a future step).
6. A success/failure status is reported back to the pull request.

### Scaling Strategy
- All backend services are designed to be stateless to allow for horizontal scaling.
- The use of NATS for asynchronous communication helps decouple services and manage load.
- Redis is used for caching to reduce database load.
- The database layer is designed with read replicas in mind for future scaling.

This document provides an overview of the technologies, architecture, and technical decisions implemented in the Hockey Hub project.