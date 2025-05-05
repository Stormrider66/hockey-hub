# Active Context

## Current Status

- **Database Setup Completed**: All 9 service-specific databases created and verified.
- **Initial Service Connections Verified**: All 9 services confirmed to start and connect to their respective databases.
- **Environment Configuration**: Basic `.env` setup confirmed working for all services.
- **Memory Bank**: Core documentation established and updated.
- **User Service API (Initial Implementation)**: Core endpoints for Auth, User Profile, Teams, Orgs, Roles, and Parent-Child links implemented.
- **Shared Types**: Core types defined and exported from `shared/types/src`.
- **Blocker**: Database schemas and migrations need implementation for services *other than* User Service.

### Recent Changes
1.  Resolved `.env` file loading issues (dotenv path corrections, dotenv-cli usage).
2.  Troubleshooted and resolved PostgreSQL authentication & collation errors.
3.  Created databases for all 9 services.
4.  Resolved PostgreSQL CLI PATH issue.
5.  Resolved persistent native dependency issues (`bcrypt` -> `bcryptjs`).
6.  Resolved filesystem corruption issues (`shared/types` directory).
7.  Verified startup and DB connection for all 9 services.
8.  Implemented initial API endpoints for User Service (Auth, Profile, Teams, Orgs, Roles, Parent-Child).
9.  Configured TypeORM (entities, data-source, migration scripts) for User, Calendar, Training, Communication, Medical, Planning, Statistics, Payment, Admin services.
10. Confirmed existing schemas matched entities for all services (no new migrations needed initially).
11. Created and populated shared type definition files (`shared/types/src/*.ts`).
12. Updated Memory Bank files.

### Current Focus
- Implementing core API endpoints for services beyond User Service (e.g., Calendar, Training).
- Implementing actual database migrations as schemas evolve or require seeding.
- Refining Planning Service (removing stubs/comments).
- Adding tests for User Service.

### Active Decisions
1. Using PostgreSQL 17 for databases.
2. Implementing TypeORM for database interactions.
3. Following microservices architecture with one database per service.
4. Using environment-based configuration (`.env` files per service, loaded via `dotenv-cli` for TypeORM scripts).
5. Database Naming Convention: `hockeyhub_<service_name>`.
6. Using `bcryptjs` instead of `bcrypt` in User Service.
7. Using `workspace:*` for linking shared local packages (`@hockey-hub/types`).

## Next Steps

### Immediate Tasks
1.  **Refine Planning Service**: Implement the controller/validation logic previously stubbed/commented out.
2.  **Implement Core Service APIs**: Implement basic CRUD operations and core logic for other services (e.g., Calendar CRUD, Training CRUD).
3.  **User Service Testing**: Begin adding unit/integration tests for implemented endpoints.

### Upcoming Work
1. Apply authentication/authorization middleware to all relevant service endpoints.
2. Implement inter-service communication patterns (e.g., event bus, direct calls where appropriate).
3. Enhance testing (unit, integration, e2e) for implemented features.
4. API Gateway setup.

## Technical Considerations

### Database Schema
- Initial schemas exist for all services (as confirmed by migration checks). 
- Migrations will be needed for future changes or initial seeding.
- Indexing strategies reviewed during entity creation.

### API Design
- Continue implementing RESTful endpoints.
- Designing request/response structures.
- Implementing validation (Zod).
- Applying error handling middleware consistently.

### Security
- Implementing authentication validation (likely via API Gateway calling User Service).
- Applying authorization middleware (`authorize`) and contextual checks.
- Securing database access (using dedicated service users later?).
- Protecting sensitive data within each service's domain.

## Current Challenges

### Known Issues
1.  **Stubbed Code**: Planning Service has commented-out/stubbed controller and validation logic that needs proper implementation.
2.  **Testing Coverage**: Low / Non-existent for most services.
3.  **Frontend Implementation**: UI development lagging behind backend setup.
4.  **Inter-service Communication**: Patterns defined but not yet implemented.

### Pending Decisions
1. Detailed authentication implementation flow (Gateway interaction).
2. Testing approach for inter-service communication.
3. Deployment process details.

## Recent Progress

### Completed Items
1. Initial service setup/scaffolding (all 9 services).
2. **Database Creation & Connection Verification (All 9 Services)**.
3. Resolution of `.env`, PostgreSQL auth, `bcrypt`, and filesystem issues.
4. Creation & Update of all core Memory Bank documents.
5. Confirmation of multi-database strategy.
6. Basic project structure defined.
7. **User Service API Implementation (Initial)**: Auth, Profile, Teams, Orgs, Roles, Parent-Child endpoints.
8. **TypeORM Setup (All Services)**: Entities defined, `data-source.ts` configured, migration scripts added.
9. **Schema Synchronization Confirmed (All Services)**: `migration:run` confirmed no initial migrations needed.
10. **Shared Types Module Completed** (`shared/types/src`).

### In Progress
1.  **Core API Implementation**: (User Service core done; others pending).
2.  **Refine Planning Service**: (Next immediate task).

## Environment Setup

### Development Environment
- Node.js v20.x (LTS) with TypeScript
- PostgreSQL 17 database (All 9 service databases created & schemas exist)
- pnpm package manager
- VS Code IDE

### Configuration
- Environment variables defined (`.env` files per service, verified).
- Database connections established for all services.
- Service ports configured (3001-3009).
- Development tools set up.

## Current Configuration

### Database Settings (Example - User Service)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=hockey_hub_password # Confirmed
DB_NAME=hockeyhub_users
```
*(Note: Each service has its own configured `.env` file)*

### Service Configuration (Example - User Service)
```env
USER_SERVICE_PORT=3001 # Specific port name used
NODE_ENV=development
JWT_SECRET=<value>
JWT_REFRESH_SECRET=<value>
# etc...
```

## Active Considerations

### Security
- Implementing secure database access credentials for each service.
- Applying authentication/authorization.
- Protecting sensitive data.

### Performance
- Optimizing database queries (as needed).
- Implementing caching (future).
- Managing connection pools (handled by TypeORM DataSource).
- Monitoring performance (future).

### Scalability
- Independent scaling of services/databases enabled by architecture.
- Implementing best practices.
- Considering future needs.

## Documentation Status

### Completed Documentation
1. Project structure definition
2. Database connection verification (all services).
3. Environment setup basics (`.env` files per service).
4. Basic workflows definition.
5. Core Memory Bank Documents (Updated).
6. Shared Types structure.

### Pending Documentation
1.  **Database Connection Details**: Document specific connection strings/configs for each service (files exist, need documenting).
2. API endpoints (detailed, ongoing).
3. Entity relationships (detailed, ongoing).
4. Authentication flows (detailed).
5. Testing procedures (detailed).
6. Planning Service Refinement details.
