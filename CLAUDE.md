# Hockey Hub - Project Memory Bank

## Project Overview
Hockey Hub is a comprehensive sports management platform for hockey teams, built as a monorepo with microservices architecture. The platform supports multiple user roles including players, coaches, parents, medical staff, equipment managers, and administrators.

## Architecture

### Technology Stack
- **Frontend**: Next.js 15.3.4, React 18, TypeScript 5.3.3
- **UI Library**: Custom components built with Radix UI and Tailwind CSS (shadcn/ui pattern)
- **State Management**: Redux Toolkit with RTK Query
- **Backend**: Node.js microservices with Express
- **Database**: PostgreSQL with TypeORM
- **Package Manager**: pnpm with workspaces
- **Testing**: Jest, React Testing Library
- **Documentation**: Storybook

### Project Structure
```
hockey-hub/
├── apps/
│   └── frontend/           # Next.js frontend application
│       ├── src/
│       │   ├── components/ # Reusable UI components
│       │   ├── features/   # Feature-based modules
│       │   ├── hooks/      # Custom React hooks
│       │   ├── lib/        # Utilities and helpers
│       │   └── store/      # Redux store configuration
│       └── public/         # Static assets
├── services/               # Microservices
│   ├── admin-service/      # System administration
│   ├── api-gateway/        # API routing and authentication
│   ├── calendar-service/   # Event and schedule management
│   ├── communication-service/ # Notifications and messaging
│   ├── medical-service/    # Health tracking and medical records
│   ├── payment-service/    # Billing and payments
│   ├── planning-service/   # Training plans and scheduling
│   ├── statistics-service/ # Analytics and reporting
│   ├── training-service/   # Workout tracking
│   └── user-service/       # User management and auth
├── packages/               # Shared packages
│   ├── monitoring/         # Logging, metrics, error handling
│   ├── shared-lib/         # Common utilities and types
│   └── translations/       # i18n support
└── shared/                 # Shared types and utilities
```

## User Roles and Dashboards

### Implemented Dashboards
1. **Player Dashboard** (`PlayerDashboard.tsx`)
   - Today's schedule and upcoming events
   - Wellness tracking with HRV monitoring
   - Training assignments and progress
   - Performance metrics and analytics
   - Development goals tracking

2. **Coach Dashboard** (`CoachDashboard.tsx`)
   - Team management and roster
   - Training planning
   - Performance analytics
   - Communication tools

3. **Parent Dashboard** (`ParentDashboard.tsx`)
   - Child's schedule and activities
   - Medical information access
   - Payment management
   - Communication with coaches

4. **Medical Staff Dashboard** (`MedicalStaffDashboard.tsx`)
   - Injury tracking and management
   - Medical records
   - Treatment plans
   - Player availability status

5. **Equipment Manager Dashboard** (`EquipmentManagerDashboard.tsx`)
   - Inventory management
   - Equipment assignments
   - Maintenance schedules
   - Order tracking

6. **Physical Trainer Dashboard** (`PhysicalTrainerDashboard.tsx`)
   - Physical test management
   - Training program creation
   - Performance tracking
   - Injury prevention

7. **Club Admin Dashboard** (`ClubAdminDashboard.tsx`)
   - Organization management
   - User administration
   - System configuration
   - Analytics overview

8. **Admin Dashboard** (`AdminDashboard.tsx`)
   - System-wide administration
   - Service monitoring
   - User management
   - Configuration management

## Key Features Implemented

### Frontend Components
- **UI Component Library**: Complete set of reusable components (buttons, cards, forms, etc.)
- **Design System**: Consistent styling with Tailwind CSS
- **Type Safety**: Full TypeScript coverage with strict typing
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components with proper ARIA labels

### State Management
- Redux store with RTK Query for API calls
- Player API with endpoints for:
  - Player overview data
  - Wellness submission
  - Training completion
- Type-safe Redux setup with proper TypeScript interfaces

### Development Tools
- Storybook stories for component documentation
- Jest configuration for testing
- ESLint and TypeScript for code quality
- Git hooks for pre-commit checks

## Recent Updates (June 2024)

### Major Accomplishments
1. **Complete Application Architecture**: Built entire monorepo structure with 676 files
2. **TypeScript Migration**: Fixed all type errors, added proper interfaces
3. **Redux Integration**: Set up RTK Query with playerApi
4. **Dashboard Completion**: All 8 role-based dashboards fully implemented
5. **Microservices Setup**: 10 backend services with full TypeScript support

### Technical Improvements
- Fixed all TypeScript 'any' type errors
- Added proper type definitions for wellness data
- Implemented React.ComponentType for icon props
- Created comprehensive API types and interfaces
- Set up proper module resolution paths

## Development Commands

### Frontend
```bash
cd apps/frontend
npm run dev         # Start development server on port 3002
npm run build       # Build for production
npm run lint        # Run ESLint
npm run test        # Run tests
npm run storybook   # Start Storybook on port 6006
```

### Running Services
Each service can be started individually:
```bash
cd services/[service-name]
npm run dev         # Start service in development mode
npm run build       # Build service
npm run test        # Run tests
```

## Git Workflow
- Main branch: `main`
- Feature branches: `feature/[feature-name]`
- Commit convention: Use conventional commits (feat:, fix:, docs:, etc.)
- All commits are co-authored by Claude

## Environment Variables
Each service has its own `.env` file. Frontend uses `.env.local` for local development.

## Known Issues and TODOs
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive test coverage
- [ ] Implement authentication flow
- [ ] Connect frontend to backend services
- [ ] Add real-time features with Socket.io
- [ ] Implement payment integration
- [ ] Add email notification system

## Dependencies to Note
- Using pnpm for package management
- Recharts for data visualization
- Lucide React for icons
- Radix UI for accessible components
- Chart.js for additional charts
- Socket.io for real-time features

## Project Status
- ✅ Complete frontend architecture
- ✅ All dashboards implemented
- ✅ TypeScript fully configured
- ✅ Redux store setup
- ✅ All microservices scaffolded
- ⏳ Backend implementation in progress
- ⏳ API integration pending
- ⏳ Authentication system pending

Last updated: June 25, 2024