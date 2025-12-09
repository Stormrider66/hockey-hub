# Bulk Parallel Sessions Implementation Plan

## Executive Summary

This document outlines the implementation plan for a **Bulk Parallel Sessions** feature in Hockey Hub, enabling physical trainers to efficiently create and manage multiple concurrent workout sessions for different groups using different equipment simultaneously.

**Timeline**: 3-month development cycle  
**Priority**: High - Addresses critical workflow efficiency for enterprise teams  
**Impact**: Reduces session creation time from 30+ minutes to under 5 minutes for multi-group workouts  
**Status**: Frontend implementation complete (January 2025)

---

## 1. Problem Statement

### Current Pain Points
- Creating 3 separate 60-minute workouts for 18 players takes 15-30 minutes
- Manual duplication leads to inconsistencies
- No unified view of related parallel sessions
- Difficult to manage equipment allocation across sessions
- No bulk editing capabilities for related sessions

### Target Scenario
A physical trainer needs to run concurrent training sessions:
- 18 players split into 3 groups of 6
- Each group uses different equipment (Rowing, Bike Erg, Ski Erg)
- All sessions run simultaneously for 60 minutes
- Each group may have different workout programs

---

## 2. User Stories

### Primary User Story
**As a** Physical Trainer  
**I want to** create multiple related workout sessions in one workflow  
**So that** I can efficiently manage concurrent training sessions for multiple groups

### Detailed User Stories

1. **US-001**: Create Multiple Sessions
   - I can specify the number of concurrent sessions (2-8)
   - I can assign different equipment to each session
   - I can set a common duration or individual durations

2. **US-002**: Template Application
   - I can apply a base template to all sessions
   - I can customize each session individually after bulk creation
   - I can save the entire set as a "Session Bundle Template"

3. **US-003**: Player Distribution
   - I can auto-distribute players across sessions based on criteria
   - I can manually adjust player assignments
   - I can see equipment capacity constraints in real-time

4. **US-004**: Unified Management
   - I can view all related sessions in a single dashboard
   - I can make bulk edits to common properties
   - I can monitor all sessions during execution

---

## 3. Technical Architecture

### 3.1 Data Model

```typescript
// New entity: SessionBundle
interface SessionBundle {
  id: string;
  name: string;
  description?: string;
  sessions: string[]; // Array of session IDs
  commonProperties: {
    startDate: Date;
    startTime: string;
    duration: number;
    facilityId: string;
    trainerId: string;
  };
  distributionStrategy: 'manual' | 'automatic' | 'skill-based' | 'random';
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced WorkoutSession
interface WorkoutSession {
  // ... existing fields
  bundleId?: string; // Reference to parent bundle
  bundleOrder?: number; // Order within bundle (1, 2, 3...)
}

// New entity: BulkSessionTemplate
interface BulkSessionTemplate {
  id: string;
  name: string;
  sessions: {
    equipment: WorkoutEquipmentType;
    workoutTemplate?: string; // Reference to workout template
    playerCount: number;
    customName?: string;
  }[];
  defaultDuration: number;
  tags: string[];
}
```

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  BulkSessionWizard │ SessionBundleView │ BulkEditModal      │
│  Components        │ Components       │ Components          │
└────────────────────┬────────────────────┬──────────────────┘
                     │                    │
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 3000)                   │
│              /api/v1/training/session-bundles                │
└────────────────────┬────────────────────┬──────────────────┘
                     │                    │
        ┌────────────┴────────────┐      │
        ▼                         ▼      ▼
┌──────────────┐        ┌──────────────┐ ┌──────────────┐
│Training      │        │Calendar      │ │Statistics    │
│Service       │        │Service       │ │Service       │
│(Port 3004)   │        │(Port 3003)   │ │(Port 3007)   │
└──────────────┘        └──────────────┘ └──────────────┘
```

---

## 4. User Interface Design

### 4.1 Entry Points

1. **Sessions Tab Enhancement**
   ```
   [+ Create Session ▼]
      - Single Session
      - Bulk Parallel Sessions ← New
      - From Template
   ```

2. **Quick Action Button**
   - Floating Action Button: "Create Multiple Sessions"
   - Keyboard Shortcut: `Ctrl+Shift+B`

### 4.2 Bulk Session Wizard Flow

#### Step 1: Session Configuration
```
┌─────────────────────────────────────────────────────┐
│ Create Bulk Parallel Sessions          [X] Close    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ How many concurrent sessions?                        │
│ [3] sessions                                         │
│                                                      │
│ Common Settings:                                     │
│ Date: [2025-02-15]  Time: [09:00]                  │
│ Duration: [60] minutes                               │
│ Facility: [Training Center Main ▼]                   │
│                                                      │
│ ☑ Use same base workout for all sessions            │
│ ☐ Auto-distribute players evenly                    │
│                                                      │
│ [Previous] [Next: Configure Sessions →]              │
└─────────────────────────────────────────────────────┘
```

#### Step 2: Individual Session Setup
```
┌─────────────────────────────────────────────────────┐
│ Configure Each Session                   [X] Close   │
├─────────────────────────────────────────────────────┤
│ Session 1                                            │
│ Name: [Rowing Group A        ]                       │
│ Equipment: [🚣 Rowing ▼]     Capacity: 6/6 ✓        │
│ Players: [Select Players...] (0 selected)            │
│ Workout: [Use base ▼] or [Customize]                 │
│                                                      │
│ Session 2                                            │
│ Name: [Bike Erg Group B     ]                        │
│ Equipment: [🚴 Bike Erg ▼]   Capacity: 6/6 ✓        │
│ Players: [Select Players...] (0 selected)            │
│ Workout: [Use base ▼] or [Customize]                 │
│                                                      │
│ Session 3                                            │
│ Name: [Ski Erg Group C      ]                        │
│ Equipment: [⛷️ Ski Erg ▼]    Capacity: 4/6 ⚠️       │
│ Players: [Select Players...] (0 selected)            │
│ Workout: [Use base ▼] or [Customize]                 │
│                                                      │
│ [← Previous] [Next: Review & Create →]               │
└─────────────────────────────────────────────────────┘
```

#### Step 3: Review & Create
```
┌─────────────────────────────────────────────────────┐
│ Review Bulk Sessions                     [X] Close   │
├─────────────────────────────────────────────────────┤
│ Summary: 3 parallel sessions, 18 total players       │
│                                                      │
│ ┌─────────────┬──────────────┬────────────────┐    │
│ │ Session 1   │ Session 2    │ Session 3      │    │
│ ├─────────────┼──────────────┼────────────────┤    │
│ │ 🚣 Rowing   │ 🚴 Bike Erg  │ ⛷️ Ski Erg    │    │
│ │ 6 players   │ 6 players    │ 6 players      │    │
│ │ 09:00-10:00 │ 09:00-10:00  │ 09:00-10:00    │    │
│ └─────────────┴──────────────┴────────────────┘    │
│                                                      │
│ Equipment Reservations:                              │
│ ✓ 6 Rowing machines reserved                         │
│ ✓ 6 Bike Ergs reserved                              │
│ ✓ 6 Ski Ergs reserved                               │
│                                                      │
│ ☑ Save as template: [3-Station Parallel    ]        │
│                                                      │
│ [← Previous] [Create All Sessions]                   │
└─────────────────────────────────────────────────────┘
```

### 4.3 Session Bundle View

```
┌─────────────────────────────────────────────────────┐
│ Team Conditioning Bundle - Feb 15, 09:00             │
├─────────────────────────────────────────────────────┤
│ [📊 Bundle Overview] [👥 Players] [📅 Schedule]      │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Active Sessions (3)              [Bulk Edit] │    │
│ ├─────────────────────────────────────────────┤    │
│ │ ▶ Rowing Group A      🚣 6/6   ████████ 45% │    │
│ │ ▶ Bike Erg Group B    🚴 6/6   ██████░░ 38% │    │
│ │ ▶ Ski Erg Group C     ⛷️ 6/6   █████░░░ 30% │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Quick Actions:                                       │
│ [📢 Broadcast Message] [⏸️ Pause All] [📊 Export]   │
└─────────────────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 New Endpoints

#### Create Session Bundle
```http
POST /api/v1/training/session-bundles
{
  "name": "Team Conditioning - 3 Groups",
  "commonProperties": {
    "startDate": "2025-02-15",
    "startTime": "09:00",
    "duration": 60,
    "facilityId": "facility-001"
  },
  "sessions": [
    {
      "name": "Rowing Group A",
      "equipment": "ROWING",
      "playerIds": ["player-001", "player-002", ...],
      "workoutId": "workout-template-001"
    },
    {
      "name": "Bike Erg Group B",
      "equipment": "BIKE_ERG",
      "playerIds": ["player-007", "player-008", ...],
      "workoutId": "workout-template-001",
      "customizations": { /* interval modifications */ }
    }
  ],
  "autoDistribute": false,
  "saveAsTemplate": true,
  "templateName": "3-Station Parallel Template"
}

Response: 201 Created
{
  "bundleId": "bundle-001",
  "sessions": [
    { "id": "session-001", "status": "created" },
    { "id": "session-002", "status": "created" },
    { "id": "session-003", "status": "created" }
  ],
  "equipmentReservations": [...]
}
```

#### Bulk Update Sessions
```http
PATCH /api/v1/training/session-bundles/{bundleId}
{
  "updates": {
    "common": {
      "startTime": "10:00" // Updates all sessions
    },
    "individual": {
      "session-001": { "name": "Updated Rowing Group" }
    }
  }
}
```

#### Get Bundle Status
```http
GET /api/v1/training/session-bundles/{bundleId}/status

Response:
{
  "bundleId": "bundle-001",
  "sessions": [
    {
      "id": "session-001",
      "name": "Rowing Group A",
      "status": "in_progress",
      "progress": 45,
      "activeParticipants": 6,
      "metrics": { /* real-time data */ }
    }
  ],
  "aggregateMetrics": {
    "totalParticipants": 18,
    "averageHeartRate": 142,
    "totalCalories": 1250
  }
}
```

### 5.2 WebSocket Events

```typescript
// New events for bundle coordination
interface BundleEvents {
  'bundle:created': { bundleId: string; sessions: string[] };
  'bundle:started': { bundleId: string; timestamp: Date };
  'bundle:participant_moved': { 
    from: string; 
    to: string; 
    playerId: string 
  };
  'bundle:bulk_update': { 
    bundleId: string; 
    updates: any 
  };
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-3) ✅ COMPLETE
- [x] Create SessionBundle entity and database schema (types defined)
- [x] Implement basic API endpoints for bundle CRUD (mock implementation)
- [x] Create BulkSessionWizard component structure
- [x] Add bundle support to existing WorkoutSession entity

### Phase 2: Core Functionality (Weeks 4-6) ✅ COMPLETE
- [x] Implement 3-step wizard workflow
- [x] Add equipment availability checking across sessions
- [x] Create player distribution algorithms (simplified)
- [x] Implement bulk session creation frontend logic

### Phase 3: Enhanced Features (Weeks 7-9) ✅ FRONTEND COMPLETE
- [x] Add SessionBundleView dashboard
- [x] Implement real-time monitoring UI for bundles
- [x] Add bulk editing capabilities
- [ ] Create bundle templates system (pending)

### Phase 4: Backend Implementation (Weeks 10-12) 🚧 IN PROGRESS
- [ ] Implement actual database schema
- [ ] Create real API endpoints in Training Service
- [ ] Add WebSocket support for real-time updates
- [ ] Integrate with calendar service
- [ ] Performance optimization and testing

---

## 7. Database Schema Changes

### New Tables

```sql
-- Session Bundles
CREATE TABLE session_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES users(id),
  facility_id UUID REFERENCES facilities(id),
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  distribution_strategy VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bundle Sessions Relationship
CREATE TABLE bundle_sessions (
  bundle_id UUID REFERENCES session_bundles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  session_order INTEGER NOT NULL,
  PRIMARY KEY (bundle_id, session_id)
);

-- Bundle Templates
CREATE TABLE bundle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  config JSONB NOT NULL, -- Stores session configurations
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bundles_trainer ON session_bundles(trainer_id);
CREATE INDEX idx_bundles_date ON session_bundles(start_date);
CREATE INDEX idx_bundle_sessions_bundle ON bundle_sessions(bundle_id);
```

### Migrations

```sql
-- Add bundle support to existing tables
ALTER TABLE workout_sessions 
ADD COLUMN bundle_id UUID REFERENCES session_bundles(id),
ADD COLUMN bundle_order INTEGER;

CREATE INDEX idx_sessions_bundle ON workout_sessions(bundle_id);
```

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Bundle creation logic
- Player distribution algorithms
- Equipment availability calculations
- Validation rules

### 8.2 Integration Tests
- Multi-session creation workflow
- Equipment reservation conflicts
- Real-time updates across bundles
- Calendar integration

### 8.3 E2E Tests
- Complete wizard flow
- Bulk editing operations
- Live session monitoring
- Error handling scenarios

### 8.4 Performance Tests
- Creating bundles with 8+ sessions
- 100+ players distribution
- Real-time updates with multiple active bundles
- Database query optimization

---

## 9. Success Metrics

### Efficiency Metrics
- **Time to create 3 parallel sessions**: < 5 minutes (from 30+ minutes)
- **Click reduction**: 80% fewer clicks for multi-session setup
- **Error rate**: < 2% failed bundle creations

### Adoption Metrics
- **Feature usage**: 60% of trainers use bulk creation within first month
- **Template reuse**: Average 3x reuse per template
- **User satisfaction**: > 4.5/5 rating

### Performance Metrics
- **Bundle creation time**: < 2 seconds for 3 sessions
- **Real-time update latency**: < 100ms
- **Dashboard load time**: < 1 second for 8 sessions

---

## 10. Future Enhancements

### V2 Features (3-6 months)
1. **Smart Scheduling**: AI-powered session scheduling based on player availability
2. **Progressive Programs**: Multi-week bundle templates with progression
3. **Cross-Bundle Analytics**: Compare performance across different bundle configurations
4. **Mobile Companion**: Dedicated mobile view for bundle monitoring

### V3 Features (6-12 months)
1. **Adaptive Bundles**: Automatically adjust based on player attendance
2. **Integration Hub**: Connect with wearables for automatic player assignment
3. **Venue Management**: Multi-facility bundle coordination
4. **Coach Collaboration**: Multiple trainers managing different sessions in a bundle

---

## 11. Risk Analysis & Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance with many bundles | High | Implement pagination, caching, and indexes |
| WebSocket scalability | Medium | Use Redis pub/sub for distributed systems |
| Complex state management | Medium | Use Redux Toolkit with normalized state |

### UX Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Wizard complexity | High | Progressive disclosure, clear progress indicators |
| Information overload | Medium | Collapsible sections, smart defaults |
| Learning curve | Medium | Interactive tutorial, tooltips |

---

## 12. Implementation Checklist

### Backend Tasks
- [ ] Create database schema and migrations
- [ ] Implement SessionBundle service
- [ ] Add API endpoints with validation
- [ ] Create equipment allocation algorithm
- [ ] Implement WebSocket handlers
- [ ] Add bulk operation support
- [ ] Create template management system

### Frontend Tasks
- [ ] Design and implement wizard components
- [ ] Create bundle dashboard views
- [ ] Add state management for bundles
- [ ] Implement real-time updates
- [ ] Add keyboard shortcuts
- [ ] Create responsive layouts
- [ ] Build error handling flows

### Integration Tasks
- [ ] Calendar service integration
- [ ] Equipment service enhancement
- [ ] Statistics service updates
- [ ] Notification system integration
- [ ] Export functionality

### Documentation Tasks
- [ ] API documentation
- [ ] User guide with screenshots
- [ ] Video tutorials
- [ ] Developer documentation
- [ ] Migration guide

---

## Conclusion

The Bulk Parallel Sessions feature will transform how physical trainers manage multi-group training sessions. By reducing setup time by 80% and providing unified management capabilities, this feature will significantly improve workflow efficiency for enterprise-level training programs.

The phased implementation approach ensures we can deliver value incrementally while building toward a comprehensive solution that scales with user needs.

**Next Steps**:
1. Review and approve implementation plan
2. Set up development environment and branches
3. Begin Phase 1 development
4. Schedule weekly progress reviews

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: Hockey Hub Development Team*