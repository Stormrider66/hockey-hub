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
13. Implemented full CRUD for Development Plans and Items in Planning Service (repositories, services, controllers, routes).
14. Added `GET /api/v1/development-plans/:planId/items` endpoint with full authorization & validation.
15. Updated integration tests to cover item list, add, update, delete flows.
16. Refactored Season Phase logic: added Zod schemas with date-overlap validation and type-safe enums.
17. Introduced custom error classes (`serviceErrors.ts`) and wired global error handler; replaced direct `res.status` usage across Planning Service.
18. Added Jest integration tests for Season and Season Phase endpoints (with repository mocks); all tests passing.
19. **Setup and configured `@hockey-hub/translations` package:**
    - Initialized `packages/translations/package.json` with basic metadata (`name`, `version`, `private`).
    - Added `main`, `types`, `scripts` (build, dev, lint, clean), `devDependencies` (typescript, eslint, parsers), and `files` to `package.json`.
    - Created `packages/translations/tsconfig.json` extending `../../tsconfig.base.json`, configured for `outDir`, `rootDir`, `declaration` files, JSON module resolution, and explicitly included `src/**/*.ts` and `src/**/*.json`.
    - Created `src/index.ts` to import and export `en.json` and `sv.json` files.
    - Added sample `src/en.json` and `src/sv.json` translation files.
    - Successfully ran initial `pnpm install` and `pnpm --filter @hockey-hub/translations build`.
    - **Iteratively configured ESLint for the package:**
        - Created `packages/translations/.eslintrc.json` with base TypeScript ESLint recommendations and `parserOptions.project` pointing to its `tsconfig.json`.
        - Resolved initial ESLint parsing errors for JSON files by adding `extraFileExtensions: [".json"]` to `parserOptions` in `.eslintrc.json`.
        - Resolved subsequent ESLint errors (where it tried to lint root-level JSON config files against the `src`-only `tsconfig.json`) by modifying the `lint` script in `package.json` to specifically target the `src` directory (`eslint src --ext .ts,.tsx,.json`).
    - Final ESLint configuration successfully lints TypeScript and JSON files within the `src` directory of the `@hockey-hub/translations` package.

20. **Comprehensive Calendar Service Implementation (Phased Approach):**
    - **Validation Layer:**
        - Installed `zod` workspace-wide.
        - Added reusable `validateRequest` middleware (`src/middleware/validateRequest.ts`).
        - Created Zod schemas for Events, Locations, Resources, and ResourceTypes (`eventSchemas.ts`, `locationSchemas.ts`, etc.).
        - Integrated validation middleware into all CRUD routes for these entities.
        - Added global `Request.user` augmentation for Express (`src/types/global.d.ts`).
    - **Event Endpoints & Logic:**
        - Refactored `eventController.ts` to use Zod-validated input and `req.user` for authorization context.
        - Implemented robust conflict detection (`src/utils/conflictDetection.ts`) checking for overlapping events based on resources, team, and location; integrated into `createEvent` and `updateEvent` handlers, returning `409 CONFLICT` with details.
        - Added foreign key existence checks for `locationId`, `resourceIds` (using repository lookups).
        - Added `teamId` validation using a stubbed `teamService.ts` (placeholder for future inter-service call).
        - Implemented participant management endpoints (`GET /events/:id/participants`, `POST /events/:id/participants`, `DELETE /events/:id/participants/:userId`), including validation of user existence (stubbed `userService.ts`).
        - Enforced enum validation for `eventType` and `status` against shared `@hockey-hub/types`.
    - **Location, Resource, ResourceType Endpoints:**
        - Fully implemented CRUD operations for Locations, Resources, and ResourceTypes, including authorization checks using `req.user.organizationId`.
    - **Resource Availability Endpoints:**
        - Implemented `GET /resources/:id/availability` for single resource conflict checking within a time window.
        - Implemented bulk `GET /resources/availability?ids=...&start=...&end=...(&granularityMinutes=...)` endpoint for multiple resources, returning per-resource availability and optional time-slot breakdowns.
    - **Transition to TypeORM Repositories:**
        - Created `eventRepository.ts`, `locationRepository.ts`, `resourceRepository.ts`, `resourceTypeRepository.ts`, and `eventAttendeeRepository.ts`.
        - Refactored all controllers (Event, Location, Resource, ResourceType) to use these TypeORM repositories, replacing raw SQL queries. This included migrating transaction management to `AppDataSource.transaction`.
        - The service is now free of direct `pg-pool` usage for CRUD.
    - **Entity Layer & Shared Types Integration:**
        - Initially used local stub type definitions (`src/types/hockey-hub-types.d.ts`) to allow entities to compile.
        - Later, created the actual `@hockey-hub/types` shared workspace package and updated Calendar Service entities to import enums and types from it, removing the local stubs. Ensured the Calendar Service compiles cleanly with `strict` mode.
    - **Database Migrations & CI:**
        - Configured `data-source.ts` for dynamic entity/migration paths (dev vs. prod).
        - Set up `package.json` scripts for TypeORM migration generation and execution.
        - Removed the old `src/db/index.ts` pg-pool wrapper.
        - Added a GitHub Actions workflow (`.github/workflows/calendar-migrations.yml`) to automatically run migrations on pushes to `main`, using repository secrets for DB credentials.
    - **Integration Testing:**
        - Set up Jest and Supertest for integration testing.
        - Configured `data-source.ts` to use an in-memory SQLite database (`sql.js`) for tests (`NODE_ENV=test`).
        - Resolved various Jest configuration issues related to ESM, module mapping (`@hockey-hub/types`), and native dependencies (`sqlite3`).
        - Implemented mocks for `conflictDetection`, shared types, and `DataSource` to facilitate focused testing.
        - Added initial integration tests for health checks and event creation (happy path and conflict scenarios).
        - Added unit tests for the `findConflictingEvents` utility. All tests passing.
    - **Internationalization (i18n) Setup:**
        - Integrated the `@hockey-hub/translations` package.
        - Added `src/utils/translate.ts` in Calendar Service to use shared translation helper.
        - Replaced hard-coded error message strings in `eventController.ts` with translation keys.

21. **Medical Service Full Implementation (Phase 1 v0.2)**: Completed full CRUD flows (injuries, injury updates, treatments, treatment plans & items, player availability, medical documents with S3 signed URLs); added global JWT authentication and granular role-based authorization; standardized `ErrorResponse` format; published API spec v0.2 and bumped package version to 1.0.1; all integration and unit tests passing.

22. **Storybook MSW Setup & Debugging (Frontend App)**:
    - Successfully configured Mock Service Worker (MSW) for Storybook in the `apps/frontend` application.
    - Ran `npx msw init public --save` in `apps/frontend` to generate `public/mockServiceWorker.js`.
    - Updated `apps/frontend/.storybook/main.ts` to include `staticDirs: ['../public']` to serve the worker file.
    - Migrated `apps/frontend/.storybook/preview.ts` from the deprecated `mswDecorator` to `mswLoader`.
    - Configured MSW `initialize({ onUnhandledRequest: 'bypass' })` in `preview.ts` to allow unmocked requests (e.g., for static assets) to pass through, resolving console warnings.
    - Corrected MSW mock handlers in `preview.ts` for API endpoints used by `TestAnalyticsPanel.stories.tsx`:
        - Ensured `http://localhost:3005/api/v1/tests` mock returns an array of objects with `id` and `name` properties, resolving `TypeError: definitions.map is not a function`.
        - Updated paths for `http://localhost:3005/api/v1/tests/analytics/correlation` and `http://localhost:3005/api/v1/tests/analytics/regression` mocks to be absolute URLs, resolving "Failed to fetch" errors.
    - Storybook for `TestAnalyticsPanel` is now rendering correctly with its API calls properly mocked.

23.  **Planning Service Refinement Completed**: All stubbed controllers, Zod validation, authorization logic fully implemented; entire test-suite (46 tests) passing.
24.  **Calendar Service CRUD Expansion**: Implemented comprehensive Event, Location, ResourceType, Resource controllers with conflict detection and status patch route. Added Zod schemas & validation middleware.
25.  **Calendar Service Test Coverage**:
    - Added unit tests for conflictDetection util.
    - Added integration tests for Event routes (create + conflict), Location/Resource CRUD, and negative-path validations (missing fields, FK constraint simulation).
    - Configured Jest (hoisted 29.x) & mocks; all 18 Calendar tests passing.

26. **Payment Service**: Added Circuit Breaker util (opossum v8), OutboxMessage entity, subscription cancellation saga, event bus integration with NATS, consumers wired.
27. **Admin Service**: Implemented Organization entity, provisioning saga, Outbox dispatcher with real NATS publishing, REST endpoint `POST /api/v1/admin/organizations`.
28. **Cross-Service Event Bus**:
    • Added NATS client (2.15) to Calendar, Payment, User services.
    • Common `lib/eventBus.ts` util and `orgEventConsumer` workers listening to `organization.*` subjects.
29. **Calendar Service Auto-Bootstrap**: On `organization.provisioned` event it now creates a default Location record.
30. **Payment Service Outbox Dispatcher Implementation**:
    - Created `outboxDispatcher.ts` with polling mechanism for due messages
    - Implemented retry logic with exponential backoff
    - Added comprehensive unit tests in `outboxDispatcher.test.ts`
    - Resolved module system issues:
      - Converted to CommonJS for runtime compatibility
      - Used `// @ts-ignore` in `index.ts` for TypeScript import
      - Added `// @ts-nocheck` to test file
    - Set up Jest configuration and test infrastructure
    - Implemented proper test cleanup with `afterEach` and `afterAll`
    - Used Jest's timer mocking for testing intervals

- **May 22 2025 – Front-End Dashboards & Data Layer**
    - Scaffolded eight role-based dashboards (Equipment-Manager, Physical-Trainer, Medical-Staff, Coach, Club-Admin, Admin, Player, Parent) inside `apps/frontend/src/features/*` and added matching Storybook stories.
    - Central design tokens consumed from `src/lib/design-utils.ts`; components use shadcn/ui + Tailwind.
    - Added RTK-Query slices for each dashboard (`equipmentApi`, `physicalTrainerApi`, `medicalApi`, `coachApi`, `clubAdminApi`, `adminApi`, `playerApi`, `parentApi`) injecting into global `apiSlice`.
    - Expanded `apiSlice.tagTypes` with `Club` and `System` (Admin) tags.
    - Replaced hard-coded mock arrays in components with hooks (`useGet*OverviewQuery`) and graceful loading fallbacks.
    - Configured Mock Service Worker in Storybook (`.storybook/preview.ts`) with handlers for every new endpoint so dashboards render with sample data.
    - Added "Loading…" placeholders; fixed implicit-any linter errors; Storybook renders without warnings.

### Current Focus
- Expand consumer handlers in User and Payment services (roles seeds, free plan) and add default resource types in Calendar.
- Strengthen Outbox dispatcher with retry/DLQ.
- Update tests for new event flows.
- Plan integration tests for cross-service event flows.

### Active Decisions
1. Using PostgreSQL 17 for databases.
2. Implementing TypeORM for database interactions.
3. Following microservices architecture with one database per service.
4. Using environment-based configuration (`.env` files per service, loaded via `dotenv-cli` for TypeORM scripts).
5. Database Naming Convention: `hockeyhub_<service_name>`.
6. Using `bcryptjs` instead of `bcrypt` in User Service.
7. Using `workspace:*` for linking shared local packages (`@hockey-hub/types`).
4.  **Frontend Component Development with Storybook/MSW**: Utilizing MSW to mock API responses for isolated component development and testing within Storybook.

## Next Steps

### Immediate Tasks
1.  **Refine Planning Service**: Implement the controller/validation logic previously stubbed/commented out.
2.  **Implement Core Service APIs**: Implement basic CRUD operations and core logic for other services (e.g., Calendar CRUD, Training CRUD).
3.  **User Service Testing**: Begin adding unit/integration tests for implemented endpoints.
4.  **Continue Frontend Development**: Leverage the now stable Storybook/MSW setup for building and testing UI components like `TestAnalyticsPanel`.

### Upcoming Work
1. Apply authentication/authorization middleware to all relevant service endpoints.
2. Implement inter-service communication patterns (e.g., event bus, direct calls where appropriate).
3. Enhance testing (unit, integration, e2e) for implemented features.
4. API Gateway setup.
2.  **Frontend UI Development**: Continue building out the user interface for various modules, ensuring each component has relevant Storybook stories and MSW mocks where API calls are involved.

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
2.  **Testing Coverage**: Low / Non-existent for most services (backend). Frontend component testing with Storybook is now better positioned.
3.  **Frontend Implementation**: UI development lagging behind backend setup, but foundational tooling (Storybook/MSW) is improving.
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
11. **May 9 2025**: Resolved all remaining User Service compile errors (qs typings, RolePermission relations, lazy relation awaits, parentService strongly typed). Converted training-session Next.js page to client component, fixing dynamic import SSR build error. Full monorepo `pnpm build` now succeeds across 15 packages.

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
