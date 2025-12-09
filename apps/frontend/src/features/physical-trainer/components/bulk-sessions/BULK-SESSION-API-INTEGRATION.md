# Bulk Session API Integration

This document describes the complete API integration layer for bulk session management in the Physical Trainer dashboard.

## Overview

The bulk session API integration provides comprehensive support for creating, managing, and monitoring multiple training sessions simultaneously. It includes full integration with equipment management, calendar scheduling, player assignment, and real-time session monitoring.

## API Structure

### RTK Query Configuration

**File**: `/apps/frontend/src/store/api/bulkSessionApi.ts`

The API is built using RTK Query with the following configuration:
- Base URL: `/api/v1/training/session-bundles`
- Mock mode enabled for development
- Real-time polling for status updates
- Comprehensive error handling
- TypeScript type safety throughout

### Endpoints

#### Core Bundle Operations

1. **Create Session Bundle**
   ```typescript
   POST /api/v1/training/session-bundles
   useCreateSessionBundleMutation()
   ```
   - Creates a new session bundle with multiple sessions
   - Validates equipment availability and player assignments
   - Creates calendar events and equipment reservations
   - Returns complete bundle configuration

2. **Get Session Bundle**
   ```typescript
   GET /api/v1/training/session-bundles/:id
   useGetSessionBundleQuery(bundleId)
   ```
   - Retrieves complete bundle configuration
   - Includes all sessions, participants, and reservations
   - Provides real-time status information

3. **Update Session Bundle**
   ```typescript
   PATCH /api/v1/training/session-bundles/:id
   useUpdateSessionBundleMutation()
   ```
   - Updates bundle configuration
   - Supports partial updates
   - Validates changes against constraints

4. **Delete Session Bundle**
   ```typescript
   DELETE /api/v1/training/session-bundles/:id
   useDeleteSessionBundleMutation()
   ```
   - Removes bundle and all associated data
   - Cancels equipment reservations
   - Updates calendar events

#### Real-time Monitoring

5. **Get Bundle Status**
   ```typescript
   GET /api/v1/training/session-bundles/:id/status
   useGetBundleStatusQuery(bundleId, { pollingInterval: 5000 })
   ```
   - Real-time status updates (polls every 5 seconds)
   - Session progress tracking
   - Participant connection status
   - Performance metrics aggregation

6. **Bulk Control Operations**
   ```typescript
   POST /api/v1/training/session-bundles/:id/control
   useBulkControlSessionsMutation()
   ```
   - Pause/resume all sessions
   - Broadcast messages to participants
   - Export session data
   - Emergency session termination

#### Integration Features

7. **Equipment Conflict Detection**
   ```typescript
   POST /api/v1/training/session-bundles/equipment-conflicts
   useCheckEquipmentConflictsMutation()
   ```
   - Checks for equipment scheduling conflicts
   - Provides alternative equipment suggestions
   - Validates availability across time slots

8. **Bundle Analytics**
   ```typescript
   GET /api/v1/training/session-bundles/:id/analytics
   useGetBundleAnalyticsQuery(bundleId)
   ```
   - Completion rates and performance metrics
   - Participant statistics
   - Session effectiveness analysis

9. **List Session Bundles**
   ```typescript
   GET /api/v1/training/session-bundles
   useGetSessionBundlesQuery(filters)
   ```
   - Paginated bundle listing
   - Filtering by status, date, creator
   - Search functionality

10. **Duplicate Session Bundle**
    ```typescript
    POST /api/v1/training/session-bundles/:id/duplicate
    useDuplicateSessionBundleMutation()
    ```
    - Creates copy of existing bundle
    - Updates names and schedules
    - Preserves configuration and assignments

## Data Types

### Core Bundle Types

```typescript
interface SessionBundle {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  sessions: BundleSession[];
  totalParticipants: number;
  equipmentReservations: EquipmentReservation[];
  calendarEvents: CalendarEvent[];
}

interface BundleSession {
  id: string;
  name: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  equipment?: string;
  participants: SessionParticipant[];
  status: 'preparing' | 'active' | 'paused' | 'completed';
  progress: number; // 0-100
  startTime?: Date;
  elapsedTime: number;
  estimatedDuration: number;
  currentPhase: string;
  location?: string;
}
```

### Request/Response Types

```typescript
interface CreateSessionBundleRequest {
  name: string;
  sessions: SessionBundleSessionConfig[];
  globalSettings: BundleGlobalSettings;
  equipmentReservations?: EquipmentReservation[];
  calendarEventIds?: string[];
}

interface BundleStatusResponse {
  bundleId: string;
  status: SessionBundle['status'];
  metrics: BundleMetrics;
  sessions: SessionStatusInfo[];
  lastUpdated: string;
}
```

## Mock Data Implementation

### Mock Base Query Integration

**File**: `/apps/frontend/src/store/api/mockBaseQuery.ts`

The mock implementation includes:
- In-memory bundle storage using Map
- Realistic data generation
- Equipment conflict simulation
- Real-time metrics updates
- Calendar event integration
- Error scenario simulation

### Mock Data Generators

1. **generateSessionParticipants**: Creates realistic participant data with metrics
2. **generateParticipantMetrics**: Simulates real-time workout metrics
3. **generateBundleStatus**: Provides real-time status updates
4. **generateBundleAnalytics**: Creates comprehensive analytics data

### Sample Data

The system initializes with sample bundles for testing:
- "Morning Training Block" with active cardio and strength sessions
- Realistic participant data with NHL player names
- Equipment reservations and calendar events
- Real-time metrics simulation

## Integration Features

### Equipment Management

- **Availability Checking**: Validates equipment availability before scheduling
- **Conflict Detection**: Identifies scheduling conflicts across sessions
- **Automatic Reservations**: Creates equipment reservations during bundle creation
- **Alternative Suggestions**: Provides alternatives when conflicts detected

### Calendar Integration

- **Event Creation**: Automatically creates calendar events for each session
- **Participant Assignment**: Links players to calendar events
- **Metadata Storage**: Stores workout details in event metadata
- **Schedule Validation**: Prevents double-booking and conflicts

### Player Assignment

- **Medical Compliance**: Validates player assignments against medical restrictions
- **Team Assignments**: Supports both individual and team-based assignments
- **Load Management**: Considers player workload and recovery status
- **Real-time Updates**: Tracks participant connection and progress

### Real-time Monitoring

- **WebSocket Integration**: Real-time session updates (planned)
- **Progress Tracking**: Live progress monitoring across all sessions
- **Metrics Aggregation**: Combines individual metrics into bundle statistics
- **Status Synchronization**: Keeps all systems in sync

## Testing Components

### BulkSessionApiTest
**File**: `BulkSessionApiTest.tsx`

Demonstrates all API endpoints:
- Bundle creation and management
- Real-time status polling
- Bulk control operations
- Equipment conflict checking

### BulkSessionIntegrationTest
**File**: `IntegrationTest.tsx`

Comprehensive integration testing:
- Equipment availability checking
- Conflict detection workflow
- Calendar event creation
- Complete bundle creation with all integrations
- Error handling and recovery

## Usage Examples

### Creating a Session Bundle

```typescript
import { useCreateSessionBundleMutation } from '@/store/api/bulkSessionApi';

const CreateBundleExample = () => {
  const [createBundle] = useCreateSessionBundleMutation();

  const handleCreate = async () => {
    const result = await createBundle({
      name: 'Morning Training Block',
      sessions: [
        {
          name: 'Cardio Session',
          workoutType: 'conditioning',
          workoutId: 'cardio-1',
          estimatedDuration: 2700,
          location: 'Gym A',
          equipmentIds: ['treadmill-1'],
          playerIds: ['player-1', 'player-2']
        }
      ],
      globalSettings: {
        maxParticipants: 20,
        allowJoinAfterStart: true,
        requireConfirmation: false,
        autoStartNext: true
      }
    }).unwrap();
    
    console.log('Bundle created:', result.id);
  };
};
```

### Real-time Status Monitoring

```typescript
import { useGetBundleStatusQuery } from '@/store/api/bulkSessionApi';

const StatusMonitor = ({ bundleId }: { bundleId: string }) => {
  const { data: status } = useGetBundleStatusQuery(bundleId, {
    pollingInterval: 5000 // Poll every 5 seconds
  });

  return (
    <div>
      <h3>Bundle Status: {status?.status}</h3>
      <p>Active Sessions: {status?.metrics.activeSessions}</p>
      <p>Active Participants: {status?.metrics.activeParticipants}</p>
      {status?.sessions.map(session => (
        <div key={session.id}>
          Session {session.id}: {session.progress}% complete
        </div>
      ))}
    </div>
  );
};
```

### Equipment Conflict Checking

```typescript
import { useCheckEquipmentConflictsMutation } from '@/store/api/bulkSessionApi';

const ConflictChecker = () => {
  const [checkConflicts] = useCheckEquipmentConflictsMutation();

  const handleCheck = async () => {
    const result = await checkConflicts([
      {
        equipmentId: 'treadmill-1',
        timeSlots: [
          {
            startTime: '2025-01-25T09:00:00Z',
            endTime: '2025-01-25T10:00:00Z',
            sessionId: 'session-1'
          }
        ]
      }
    ]).unwrap();

    if (result.totalConflicts > 0) {
      console.log('Conflicts found:', result.conflicts);
    }
  };
};
```

## Store Integration

The bulk session API is fully integrated into the Redux store:

```typescript
// apps/frontend/src/store/store.ts
import { bulkSessionApi } from './api/bulkSessionApi';

const store = configureStore({
  reducer: {
    [bulkSessionApi.reducerPath]: bulkSessionApi.reducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      bulkSessionApi.middleware,
      // ... other middleware
    ),
});
```

## Error Handling

The API includes comprehensive error handling:
- Network failure recovery
- Validation error reporting
- Conflict resolution guidance
- User-friendly error messages
- Automatic retry with exponential backoff

## Performance Optimizations

- **Selective polling**: Only poll active bundles
- **Data normalization**: Efficient state management
- **Caching strategies**: Minimize redundant requests
- **Background sync**: Queue operations when offline
- **Memory management**: Cleanup inactive sessions

## Future Enhancements

1. **WebSocket Integration**: Real-time bidirectional communication
2. **Offline Support**: Queue operations for offline execution
3. **Advanced Analytics**: ML-powered insights and recommendations
4. **Mobile Optimization**: Reduced payload sizes for mobile devices
5. **Export Formats**: Additional export formats (XML, JSON, etc.)

## Development Notes

- Always use pnpm for package management
- Mock mode enabled by default for development
- Type safety enforced throughout
- Error boundaries protect against API failures
- Performance monitoring included
- Comprehensive test coverage provided

## Files Overview

- `bulkSessionApi.ts` - RTK Query API definition
- `mockBaseQuery.ts` - Mock data handlers (updated)
- `BulkSessionApiTest.tsx` - Basic API testing component
- `IntegrationTest.tsx` - Comprehensive integration testing
- `bulk-sessions.types.ts` - TypeScript type definitions
- `store.ts` - Redux store integration (updated)

This integration provides a robust, scalable foundation for bulk session management with full equipment, calendar, and player management integration.