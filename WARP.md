# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Hockey Hub is a production-ready monorepo sports management platform built with microservices architecture. It's an enterprise-grade application supporting 8 role-based dashboards for hockey organizations, with 31,000+ translations across 19 European languages.

- **Architecture**: Turborepo monorepo with 10 microservices + frontend
- **Status**: Production-ready (9.5/10)  
- **Scale**: Supports 500+ concurrent users
- **Frontend**: Next.js 15.3.4 with React 18, TypeScript 5.3.3
- **Backend**: Node.js/Express microservices with TypeScript
- **Database**: PostgreSQL per service + Redis caching
- **Package Manager**: pnpm (NOT npm)

## Development Commands

### Quick Start Commands
```bash
# Frontend-only development (2-minute start)
cd apps/frontend && pnpm dev

# Full stack development (all services)
pnpm dev

# Install all dependencies
pnpm install
```

### Build Commands
```bash
# Build all packages and services
pnpm build

# Build only frontend
pnpm run build:frontend

# Build only services  
pnpm run build:services
```

### Testing Commands
```bash
# Run all tests (777+ tests, 83.2% coverage)
pnpm test

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run e2e tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:coverage

# Frontend-specific tests
pnpm run test:frontend
```

### Development Tools
```bash
# Lint all code
pnpm lint

# Type checking
pnpm run type-check

# Format code
pnpm run format:write

# Check formatting
pnpm run format:check

# Start Storybook (frontend components)
cd apps/frontend && pnpm storybook
```

### Service-Specific Commands
```bash
# Start single service in dev mode
cd services/[service-name] && pnpm dev

# Run service tests
cd services/[service-name] && pnpm test

# Run database migrations
cd services/[service-name] && pnpm run migrate
```

## Architecture Deep Dive

### Monorepo Structure
The codebase follows a feature-first, service-oriented architecture:

```
hockey-hub/
├── apps/frontend/           # Next.js app (Port 3010)
│   └── src/
│       ├── features/        # 13 role-based feature modules
│       ├── components/      # 100+ shared UI components  
│       ├── store/           # Redux Toolkit + RTK Query
│       └── lib/             # Utilities and helpers
├── services/                # 10 microservices (Ports 3000-3009)
├── packages/                # Shared libraries
│   ├── shared-lib/          # Common types, middleware
│   ├── translations/        # i18n with 31K+ translations  
│   └── monitoring/          # Logging and metrics
└── docs/                    # Comprehensive documentation
```

### Frontend Architecture
- **Feature-based organization**: Each user role has its own feature module in `src/features/`
- **Component architecture**: Shared components in `src/components/`, feature-specific in `src/features/[role]/components/`
- **State management**: Redux Toolkit with RTK Query for API state
- **Real-time**: Socket.io client integration
- **UI System**: Radix UI + Tailwind CSS with custom design system

### Backend Microservices Architecture
Each service follows a consistent pattern:
- **Port allocation**: 3000 (Gateway), 3001-3009 (Services)
- **Database per service**: Each service has its own PostgreSQL database
- **Shared authentication**: JWT with RSA keys via API Gateway
- **Caching layer**: Redis integration across all services (60-80% query reduction)
- **Real-time**: Socket.io server integration

#### Service Breakdown:
1. **API Gateway** (3000): Central routing, authentication, rate limiting
2. **User Service** (3001): Identity management, RBAC system
3. **Communication Service** (3002): Enterprise chat system (100+ components)
4. **Calendar Service** (3003): Advanced scheduling with conflict detection
5. **Training Service** (3004): Workout tracking, physical training programs
6. **Medical Service** (3005): Health records, injury tracking, HIPAA compliance
7. **Planning Service** (3006): Seasonal planning, strategic management
8. **Statistics Service** (3007): Analytics, performance metrics, reporting
9. **Payment Service** (3008): Financial transactions, billing management
10. **Admin Service** (3009): System administration, configuration management

### Key Architectural Patterns
- **Feature-driven development**: Code organized by business capabilities
- **API-first design**: All services expose REST APIs with TypeScript interfaces
- **Event-driven communication**: Socket.io for real-time features
- **Microservices with shared types**: Common interfaces in `packages/shared-lib/`
- **Progressive Web App**: Offline capabilities and mobile optimization

## Development Context

### Critical Project Information
- **Package manager**: Always use `pnpm`, never npm
- **Environment**: Windows/PowerShell compatible
- **Mock authentication**: Enabled by default for rapid development
- **Port conflicts**: Frontend moved from 3002 to 3010 to avoid service conflicts
- **Database**: PostgreSQL 14+ required, Redis 6+ for caching
- **Node version**: 18+ LTS required

### Feature Module Organization
Each role dashboard in `src/features/` follows this pattern:
```
features/[role]/
├── components/         # Role-specific UI components
├── hooks/             # Custom React hooks  
├── services/          # API integration
├── types/             # TypeScript definitions
└── pages/             # Page components (if applicable)
```

### Key Technologies per Layer
**Frontend Stack:**
- Next.js 15.3.4 with App Router
- React 18 with hooks and concurrent features
- Redux Toolkit + RTK Query for state/API management
- Radix UI for accessible component primitives
- Tailwind CSS for styling with custom design tokens
- Socket.io client for real-time features
- React Hook Form for form management
- Recharts/Chart.js for data visualization

**Backend Stack:**
- Express.js with TypeScript for all services
- TypeORM for database interactions with migrations
- JWT with RSA keys for stateless authentication
- Socket.io for real-time bidirectional communication
- Winston for structured logging
- Redis for high-performance caching and sessions

### Testing Strategy
- **Unit tests**: Jest + React Testing Library (777+ tests)
- **Integration tests**: Service-to-service API testing
- **E2E tests**: Cypress for critical user journeys
- **Component testing**: Storybook for UI component isolation
- **Coverage target**: 83.2% achieved, targeting >85%

### Important Development Notes
1. **Always check CLAUDE.md** for the most current project context and recent changes
2. **Medical integration**: The Physical Trainer dashboard includes real-time medical data integration with automatic exercise restrictions
3. **Internationalization**: All user-facing text must use i18next with proper namespacing
4. **Performance**: Redis caching is mandatory for all database operations
5. **Security**: All API endpoints have input validation and RBAC checks
6. **Real-time features**: Use Socket.io for live updates across all dashboards

### Common Gotchas
- Use `pnpm` not `npm` (project configured for pnpm workspaces)
- Frontend runs on port 3010, not 3000 (to avoid API Gateway conflict)
- Services have individual JWT secrets, not shared hardcoded values
- TypeScript strict mode is enabled - avoid `any` types
- All database changes require migrations in respective service
- i18n keys must follow `[namespace]:[feature].[key]` pattern

### Integration Points
- **Calendar integration**: Events created by any role appear in relevant dashboards
- **Medical integration**: Injury status affects workout recommendations across training features  
- **Chat system**: Enterprise-grade messaging integrated into all role dashboards
- **Real-time updates**: Socket.io ensures live data synchronization
- **Analytics integration**: Performance data flows between training, medical, and statistics services
