# Hockey Hub - AI Memory Bank & Project Context

**Purpose**: This document serves as the primary memory bank for AI assistants working on Hockey Hub. It provides essential context and links to detailed documentation.

## 📋 Quick Context

**Hockey Hub** is an enterprise-grade sports management platform for hockey organizations, supporting teams from local clubs to international organizations (500+ players).

- **Status**: Production-ready (9.5/10)
- **Architecture**: Monorepo with 10 microservices
- **Users**: 8 role-based dashboards
- **Scale**: Enterprise-ready, 500+ concurrent users
- **Languages**: 19 European languages
- **Last Updated**: January 2025

## 📚 Documentation System

### How Documentation is Organized

```
Hockey Hub/
├── docs/                           # Primary documentation hub
│   ├── README.md                  # Central navigation portal
│   ├── QUICK-START-GUIDE.md      # 5-minute setup
│   ├── FEATURES-OVERVIEW.md      # Complete feature catalog
│   ├── TECHNICAL-IMPROVEMENTS.md # Technical changes log
│   ├── SECURITY-GUIDE.md         # Security requirements
│   ├── ARCHITECTURE.md           # System design
│   ├── API.md                    # API reference
│   └── reports/                  # Test coverage and analysis
├── services/*/docs/              # Service-specific documentation
├── DOCUMENTATION-INDEX.md        # Master documentation index
├── [Role]-GUIDE.md              # User guides for each role
└── archive/                     # Historical documentation
```

### Key Documentation Links

| Need | Document | Description |
|------|----------|-------------|
| **Get Started** | [docs/QUICK-START-GUIDE.md](./docs/QUICK-START-GUIDE.md) | Frontend-only or full-stack setup |
| **All Features** | [docs/FEATURES-OVERVIEW.md](./docs/FEATURES-OVERVIEW.md) | Comprehensive feature list |
| **Architecture** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design and patterns |
| **Security** | [docs/SECURITY-GUIDE.md](./docs/SECURITY-GUIDE.md) | Critical security requirements |
| **Testing** | [docs/reports/test-coverage.md](./docs/reports/test-coverage.md) | 83.2% coverage, 777+ tests |
| **API Docs** | [docs/API.md](./docs/API.md) | 200+ endpoint documentation |
| **Deployment** | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment guide |

## 🏗️ Technical Architecture

### Stack Overview
- **Frontend**: Next.js 15.3.4, React 18, TypeScript 5.3.3, Redux Toolkit
- **Backend**: Node.js microservices, Express, TypeORM
- **Database**: PostgreSQL (per service), Redis caching
- **Real-time**: Socket.io with TypeScript
- **Testing**: Jest, React Testing Library, Cypress

### Microservices (Ports 3000-3009)
1. **API Gateway** (3000) - Central routing, auth
2. **User Service** (3001) - Identity, RBAC
3. **Communication** (3002) - Chat, notifications
4. **Calendar** (3003) - Scheduling
5. **Training** (3004) - Workouts
6. **Medical** (3005) - Health records
7. **Planning** (3006) - Seasonal plans
8. **Statistics** (3007) - Analytics
9. **Payment** (3008) - Billing
10. **Admin** (3009) - System mgmt

**Frontend**: Port 3010

## 👥 User Roles & Dashboards

All 8 dashboards are complete and production-ready:

1. **Player** - Schedule, wellness, training ([Guide](./PLAYER-GUIDE.md))
2. **Coach** - Team management, planning ([Guide](./COACH-GUIDE.md))
3. **Parent** - Child monitoring, payments ([Guide](./PARENT-GUIDE.md))
4. **Medical Staff** - Health tracking ([Guide](./MEDICAL-STAFF-GUIDE.md))
5. **Equipment Manager** - Inventory, maintenance
6. **Physical Trainer** - 500+ player support, 65 APIs
7. **Club Admin** - Organization management
8. **System Admin** - Platform administration

*Detailed features: [docs/FEATURES-OVERVIEW.md](./docs/FEATURES-OVERVIEW.md)*

## 🚀 Major Achievements

### Technical Excellence
- **TypeScript**: 69% reduction in 'any' types (1,725 → 535)
- **Performance**: 60-80% query reduction via caching
- **Testing**: 777+ tests, 83.2% coverage
- **Security**: Production-hardened, HIPAA/GDPR ready

### Feature Completeness
- ✅ **Chat System**: 100+ components, real-time messaging
- ✅ **Calendar**: Role-specific views, conflict detection
- ✅ **Physical Trainer**: Enterprise-scale workout management with medical integration
- ✅ **Conditioning Workouts**: Interval-based cardio programming with 8 equipment types
- ✅ **Hybrid Workouts**: Combined strength + cardio with block-based structure
- ✅ **Medical Integration**: Real-time injury tracking, exercise restrictions, safe alternatives
- ✅ **Internationalization**: 19 languages, 31,000+ translations
- ✅ **Analytics**: AI-powered insights and optimization

*Full technical improvements: [docs/TECHNICAL-IMPROVEMENTS.md](./docs/TECHNICAL-IMPROVEMENTS.md)*

## 💻 Development Commands

```bash
# Quick start (frontend only - 2 minutes)
cd apps/frontend && pnpm dev

# Full stack development
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

*Complete guide: [docs/QUICK-START-GUIDE.md](./docs/QUICK-START-GUIDE.md)*

## 🏋️ Recent Updates: Conditioning & Hybrid Workouts (January 2025)

### Conditioning Workout Builder
The Physical Trainer dashboard now includes a comprehensive conditioning workout builder:

**Components Created**:
- `ConditioningWorkoutBuilder` - Full interval program builder with drag-and-drop
- `IntervalForm` - Detailed interval configuration (duration, intensity, targets)
- `IntervalTimeline` - Visual workout timeline
- `TestBasedTargets` - Personalization based on player fitness tests
- `ConditioningIntervalDisplay` - Real-time session viewer with countdown timers

**Key Features**:
- 8 equipment types (rowing, bike, treadmill, etc.)
- Heart rate, power, and pace targets
- Test-based personalization (VO2max, FTP, lactate threshold)
- Pre-built templates (HIIT, Steady State, Pyramid, FTP Test)
- Audio cues for interval transitions

**Backend Integration**:
- Extended WorkoutSession entity with `intervalProgram` JSONB field
- Created migration `1736400000000-AddIntervalProgramToWorkoutSession`
- Added DTOs in `interval-program.dto.ts`
- New API endpoints for conditioning workouts

### Hybrid & Agility Workouts (January 2025)

**Hybrid Workout Support**:
- `HybridWorkoutBuilder` - Create workouts mixing exercises with intervals
- Block-based structure (exercise blocks, interval blocks, transitions)
- Drag-and-drop block arrangement
- Pre-built templates (Circuit, CrossFit, Bootcamp)
- Visual timeline preview with print support

**Components**:
- `HybridBlockItem` - Draggable block representation
- `BlockEditor` - Type-specific editors for each block type
- `HybridPreview` - Beautiful timeline with activity distribution

**Backend Updates**:
- Added HYBRID to WorkoutType enum
- Created comprehensive workout type configuration
- Migration `1736500000000-AddHybridWorkoutType`

**Integration**:
- Added Hybrid and Agility buttons to SessionsTab
- Updated TrainingSessionViewer for type-based routing
- Full TypeScript type definitions in `hybrid.types.ts`

### Player Integration
- Players can launch interval workouts from dashboard
- Dedicated interval session page with fullscreen support
- Calendar integration with "Start Interval Training" button
- Progress tracking and wellness integration

**Files Modified**:
- `/apps/frontend/src/features/physical-trainer/components/` (new conditioning & hybrid components)
- `/apps/frontend/src/features/player/` (interval launching)
- `/apps/frontend/src/features/calendar/` (workout launch from events)
- `/services/training-service/` (backend support)

### Agility Workout Implementation (January 2025)

**What Was Completed**:
- `AgilityWorkoutBuilder` - Full drill sequence builder with visual pattern editor
- `AgilityDisplay` - Execution viewer with timing, error tracking, and performance metrics
- 10+ pre-built drill patterns (T-drill, 5-10-5, ladder drills, etc.)
- Visual pattern builder using SVG for cone layouts
- Complete type system in `agility.types.ts`
- Integration with TrainingSessionViewer

**Key Features**:
- Multi-phase workout flow (warmup → drills → cooldown)
- Real-time drill timing with 0.1s precision
- Error tracking and performance analytics
- Previous attempt history display
- Audio cues for phase transitions
- Equipment setup guides

### Hybrid Workout Display (January 2025)

**HybridDisplay Component**:
- Seamless transitions between exercise, interval, and transition blocks
- Different UI for each block type
- Progress tracking with visual indicators
- Audio integration for timing cues
- Manual completion for exercise blocks
- Automatic progression for timed blocks

**Integration Status**:
- All three workout types (Conditioning, Hybrid, Agility) fully implemented
- Complete mock data for testing all scenarios
- Full TypeScript coverage with proper type definitions
- Translations added for all new UI elements

## 🏥 Recent Updates: Medical Integration (January 2025)

### What Was Added
The Physical Trainer dashboard now includes comprehensive medical integration:

**Components Created**:
- `MedicalReportButton` - Heart icon for injured/limited players
- `MedicalReportModal` - 4-tab interface (Overview, Restrictions, Alternatives, Documents)
- `ComplianceWarning` - Alerts for exercise-restriction conflicts
- `ExerciseAlternativesList` - Safe exercise recommendations
- `useMedicalCompliance` - Hook for real-time medical validation

**Key Features**:
- Real-time medical data integration with existing Medical Service (port 3005)
- Automatic exercise filtering based on player restrictions
- Load adjustment calculations for injured players
- Visual severity indicators throughout the UI
- Mock data for testing (Sidney Crosby - injured, Nathan MacKinnon - limited)

**Technical Notes**:
- Fixed i18next namespace issues (use `physicalTrainer:medical.key` syntax)
- Added comprehensive mock medical data in `mockBaseQuery.ts`
- Enhanced `userApi` to use mock-enabled base query
- All components use TypeScript with full type safety

**Files Modified**:
- `/apps/frontend/src/features/physical-trainer/components/SessionBuilder/` (new components)
- `/apps/frontend/src/store/api/mockBaseQuery.ts` (medical endpoints)
- `/apps/frontend/src/store/api/userApi.ts` (mock integration)
- `/apps/frontend/public/locales/en/physicalTrainer.json` (translations)

### Team-Aware Calendar Integration (January 2025)

**What Was Added**:
- Team selector dropdown in Physical Trainer dashboard header
- Dynamic calendar filtering based on selected team
- Team-specific mock data for sessions, players, and events

**Key Features**:
- **Team Selector**: Dropdown with options for All Teams, Personal View, or specific teams
- **Dynamic Data**: All dashboard data (sessions, players, calendar) updates based on selection
- **Calendar Events**: Shows games, ice practice, meetings, and training sessions per team
- **Mock Data**: Different schedules and player rosters for each team
- **Persistent Selection**: Team choice saved in localStorage

**Integration Plan**:
- See `CALENDAR-INTEGRATION-PLAN.md` for full multi-role calendar integration details
- Calendar shows events created by different roles (Club Admin, Ice Coach, Physical Trainer)
- Event types: Games, Ice Practice, Team Meetings, Physical Training, Medical appointments

**Files Modified**:
- `/apps/frontend/src/features/physical-trainer/components/TeamSelector.tsx` (new component)
- `/apps/frontend/src/features/physical-trainer/hooks/usePhysicalTrainerData.ts` (team state management)
- `/apps/frontend/src/features/physical-trainer/hooks/useSessionManagement.ts` (team filtering)
- `/apps/frontend/src/store/api/mockBaseQuery.ts` (team-aware calendar events)
- `/apps/frontend/src/features/calendar/components/CalendarWidget.tsx` (teamId support)

## 🔧 Current Development Context

### Working Environment
- **OS**: Windows with PowerShell
- **Package Manager**: pnpm (not npm)
- **Node Version**: 18+ LTS
- **Port Allocation**: 3000-3009 (services), 3010+ (frontend)

### Important Notes
- Always use PowerShell-compatible commands
- Mock auth enabled by default for quick development
- All services have unique JWT secrets (not hardcoded)
- Redis required for caching (Docker recommended)

### Active Development Areas
- ⏳ Docker compose configuration
- ⏳ APM monitoring setup
- ✅ All features implemented
- ✅ Security hardening complete
- ✅ Medical integration in Physical Trainer dashboard (Jan 2025)
- ✅ Team-aware calendar integration (Jan 2025)
- ✅ Conditioning workout builder with intervals (Jan 2025)
- ✅ Hybrid workout support (exercises + intervals) (Jan 2025)
- ⏳ Agility workout builder (foundation complete)

## 🔐 Security Status

**Critical Issues**: All resolved ✅

Key security features implemented:
- JWT with RSA keys (not hardcoded secrets)
- RBAC with granular permissions
- Medical service authentication fixed
- Input validation on all endpoints
- HIPAA/GDPR compliance ready

*Security details: [docs/SECURITY-GUIDE.md](./docs/SECURITY-GUIDE.md)*

## 📈 Project Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Production Readiness** | 9.5/10 | ✅ Ready |
| **Code Coverage** | 83.2% | ✅ Exceeds target |
| **TypeScript Safety** | 535 any types | ✅ 69% improved |
| **Performance** | <2s load time | ✅ Optimized |
| **Documentation** | 100% coverage | ✅ Complete |
| **Security** | Hardened | ✅ Production-ready |

## 🗺️ Navigation Help

### For AI Assistants
1. **Start here**: Read this file for context
2. **Find details**: Use [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md)
3. **Quick answers**: Check [docs/FEATURES-OVERVIEW.md](./docs/FEATURES-OVERVIEW.md)
4. **Technical info**: See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
5. **User perspective**: Read role-specific guides

### Documentation Philosophy
- **Single Source of Truth**: Each topic has one authoritative location
- **Progressive Disclosure**: Overview → Details → Implementation
- **Cross-Referenced**: Liberal use of links between documents
- **Maintained**: Regular updates with version tracking

## 🎯 Quick Reference

### What's Where
- **Feature details**: `docs/FEATURES-OVERVIEW.md`
- **Setup instructions**: `docs/QUICK-START-GUIDE.md`
- **API documentation**: `docs/API.md`
- **Test results**: `docs/reports/test-coverage.md`
- **Security requirements**: `docs/SECURITY-GUIDE.md`
- **Service docs**: `services/[name]/docs/`
- **Historical info**: `archive/`

### Key Decisions
- Frontend port changed: 3002 → 3010
- Using pnpm, not npm
- Mock auth for quick development
- Service-specific JWT secrets
- Redis caching mandatory

## 📖 Documentation Build System

### How Documentation is Maintained
1. **Source Files**: All docs are in Markdown (.md) format
2. **Version Control**: Documentation updates tracked in Git
3. **Organization**: Hierarchical structure with clear ownership
4. **Cross-References**: Extensive linking between related docs
5. **Archive System**: Historical docs preserved in `archive/`

### Documentation Standards
- **Format**: GitHub-flavored Markdown
- **Structure**: Clear headings, tables for data
- **Code Examples**: Syntax highlighting with language tags
- **Links**: Relative paths for internal docs
- **Updates**: Keep links current when moving files

### For Contributors
When updating documentation:
1. Update the source document
2. Update any referencing documents
3. Update DOCUMENTATION-INDEX.md if structure changes
4. Test all links work correctly
5. Note the update date in the document

---

**Remember**: This is a memory bank. For detailed information, always check the linked documentation. Keep this file concise and up-to-date with links to detailed docs.