# Hockey Hub - Active Context

## Current Work Focus

We are currently focused on the **User Service implementation** within Phase 1 (Core Infrastructure).

Significant progress has been made on the core authentication logic (`authService.ts`):
- Implemented JWT-based authentication (access/refresh tokens).
- Integrated TypeORM for database interactions.
- Established proper DTOs and custom error handling.
- Implemented secure secret management using environment variables.
- Completed core functions: `register`, `login`, `logout`, `refreshToken`.
- Implemented password recovery flow: `forgotPassword`, `resetPassword`.
- Integrated email sending via `emailService.ts` (using Nodemailer).
- Set up structured logging (Pino) and request/response logging (`pino-http`).
- Added Request ID middleware.
- Refined CORS configuration.
- Wrote initial unit tests for `authService.ts` using Jest.

Other Phase 1 items like Design System integration, API Gateway setup, and Frontend foundation are proceeding in parallel or are next in line.

## Immediate Next Steps (User Service Focus)

1.  **Implement API Routes:** Create `authRoutes.ts` to expose the `authService` functions via HTTP endpoints (e.g., `/api/v1/auth/register`, `/api/v1/auth/login`, etc.). Include input validation (using a library like `express-validator` or `zod`).
2.  **Implement Role-Based Access Control (RBAC):**
    *   Define roles and permissions (possibly link `Role` entity to specific permission strings).
    *   Create middleware (`checkRole`, `checkPermission`) to protect routes based on user roles extracted from JWT.
3.  **Complete Unit Tests:** Add tests for `emailService.ts` and improve coverage for `authService.ts`.
4.  **Integration Testing:** Set up basic integration tests for the auth endpoints (using `supertest`).
5.  **Implement User/Team/Parent Relationships:** Define the remaining entities (`Team`, `TeamMember`, `PlayerParentLink`) and implement service logic for managing these relationships (likely in a separate `userService.ts` or similar).

## Current Technical Decisions

1. **UI Framework and Design System**
   - Using shadcn/ui components imported via `@/components/ui/`
   - Styling with Tailwind CSS utility classes
   - Component reference pattern in HockeyAppUIComponents.tsx
   - Color system with standardized color codes for events and statuses
   - Using lucide-react for all icons in the application

2. **Authentication Strategy**
   - Using JWT with access and refresh tokens (Implemented)
   - Access tokens with 15-minute lifespan (Configurable via env)
   - Refresh tokens with 7-day lifespan (Configurable via env)
   - Token storage strategy (Client-side storage assumed, needs review for HttpOnly cookies if applicable)
   - Token revocation on logout/password change (Implemented)

3. **Database Approach**
   - Using PostgreSQL 17 as the primary database
   - TypeORM for database access
   - Migration-based schema management
   - Service-specific schemas with some shared tables
   - Connection pooling for efficiency

4. **Development Environment**
   - Docker Compose for local development
   - Hot reloading for both frontend and backend
   - Environment variables through .env files
   - Shared volume mapping for code changes
   - Local service discovery via Docker Compose DNS

5. **Code Quality Standards**
   - ESLint and Prettier for code quality
   - Jest for testing
   - TypeScript strict mode
   - Conventional commits for clarity
   - Pull request reviews required for merges

## Technical Considerations and Questions

1. **Authentication/Authorization:**
    *   Finalize strategy for storing/linking permissions to roles.
    *   How should HttpOnly cookies vs. local storage be handled for tokens, considering microservice architecture and potential frontend needs?
    *   Need for session management alongside JWT?
2. **Email Service:**
    *   Select and configure production email provider.
    *   Implement email templates (consider using a templating engine).
    *   Robust error handling/retry logic for email sending.
3. **Testing:**
    *   Strategy for integration testing involving database (test containers? dedicated test DB?).
    *   E2E testing setup (Cypress?).

## Tools and Resources Needed

1. **Design Tools**
   - Tailwind CSS
   - shadcn/ui component library
   - Figma files for reference (optional)
   - Storybook for component documentation

2. **Development Tools**
   - Docker and Docker Compose
   - Node.js and npm/yarn
   - TypeScript
   - PostgreSQL client
   - Git

3. **Documentation**
   - API documentation tool (Swagger/OpenAPI)
   - Technical documentation repository
   - Code documentation standards
   - Architecture decision records

4. **Testing Tools**
   - Jest for unit testing
   - Cypress for E2E testing
   - Postman/Insomnia for API testing
   - Load testing tools (future)

5. **Monitoring and Logging**
   - Logging framework configuration
   - Local monitoring setup
   - Error tracking planning
   - Performance metric collection

This document reflects the current state, focusing on the progress and next steps for the User Service authentication.
