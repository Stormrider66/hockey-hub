# Hockey Hub - Active Context

## Current Work Focus

We are currently focusing on establishing the design system for the Hockey Hub project. According to our implementation plan, we're working on:

1. **Design System Implementation**
   - Implementing shadcn/ui components
   - Configuring Tailwind CSS for consistent styling
   - Creating reusable UI patterns and components
   - Establishing a color system for different event types and player statuses
   - Setting up dark mode and internationalization support

2. **Core Service Planning**
   - Designing detailed API contracts for all services
   - Planning database schema for each service
   - Defining communication patterns between services
   - Establishing coding standards and patterns

3. **User Service Implementation**
   - User authentication system with JWT
   - Role-based access control
   - Team and user relationships
   - Parent-child account linking

4. **API Gateway Setup**
   - Initial routing configuration
   - Authentication middleware
   - CORS and security headers
   - Request validation framework

5. **Internationalization Foundation**
   - Setting up i18next structure
   - Creating initial translation files
   - Implementing language switching
   - Database schema for translation management

## Immediate Next Steps

1. **Complete Design System Integration**
   - Install and configure Tailwind CSS and shadcn/ui
   - Implement the color palette and theme configuration
   - Create core shared components based on the design system
   - Set up ThemeProvider for dark mode support
   - Set up I18nProvider for multilingual support

2. **Develop Module-Specific Components**
   - Create calendar module components using the design system
   - Implement training module components following established patterns
   - Build medical module UI with consistent status indicators
   - Develop communication module interface using shadcn/ui components

3. **Database Initialization**
   - Create initial PostgreSQL schema
   - Set up migration framework
   - Define core tables (users, roles, teams)
   - Create database seeding for development

4. **User Service Foundation**
   - Set up Express server with TypeScript
   - Create core user model and repository
   - Implement authentication endpoints
   - Set up JWT token generation and validation

5. **Frontend Project Setup**
   - Initialize React project with TypeScript
   - Configure Tailwind CSS and shadcn/ui
   - Set up routing and state management
   - Create initial layout components based on the design system

## Current Technical Decisions

1. **UI Framework and Design System**
   - Using shadcn/ui components imported via `@/components/ui/`
   - Styling with Tailwind CSS utility classes
   - Component reference pattern in HockeyAppUIComponents.tsx
   - Color system with standardized color codes for events and statuses
   - Using lucide-react for all icons in the application

2. **Authentication Strategy**
   - Using JWT with access and refresh tokens
   - Access tokens with 15-minute lifespan
   - Refresh tokens with 7-day lifespan
   - Token storage in HttpOnly cookies
   - Token revocation strategy to be determined

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

1. **Design System Integration**
   - How to maintain consistency across all microservices
   - Best practices for sharing design tokens between frontend services
   - Strategies for component reuse across different modules
   - Approach for ensuring responsive design on all devices
   - Methods for testing design system components

2. **Service Communication**
   - Deciding between REST, GraphQL, and gRPC for different communication needs
   - Determining when to use direct service calls vs. event-based communication
   - Planning circuit breaker patterns for resilience
   - Defining retry and timeout policies

3. **Database Schema Details**
   - Finalizing schema for complex relationships
   - Designing optimal indexes for query patterns
   - Planning for data partitioning if needed
   - Determining cascade behaviors for related entities

4. **State Management**
   - Deciding on Redux patterns for complex state
   - Planning caching strategies for API responses
   - Designing real-time data synchronization
   - Optimizing for performance and re-renders

5. **Authentication Edge Cases**
   - Handling token expiration during active use
   - Managing multiple devices and sessions
   - Implementing secure password reset flows
   - Designing multi-factor authentication (future)

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

This document reflects the current state of the Hockey Hub project with a focus on design system implementation and initial service setup.
