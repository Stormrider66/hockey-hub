# Rotation System Integration with TrainingSessionViewer

This document demonstrates how the rotation workout system integrates cleanly with the existing TrainingSessionViewer infrastructure, avoiding code duplication while maintaining full functionality.

## Architecture Overview

The integration follows a **coordinator pattern** where the rotation system creates and manages individual training sessions that are then monitored using the existing real-time infrastructure.

```
RotationSchedule → RotationCoordinator → TrainingSession[] → TrainingSessionViewer
       ↓                    ↓                    ↓                    ↓
   Station Config    Session Creation     Live Sessions        Real-time UI
```

## Key Components

### 1. RotationCoordinator
**Location**: `/apps/frontend/src/features/physical-trainer/components/rotation/RotationCoordinator.tsx`

- **Purpose**: Orchestrates the entire rotation lifecycle
- **Key Functions**:
  - Converts rotation schedule to individual training sessions
  - Manages timing and transitions between rotations
  - Coordinates group movements between stations
  - Handles emergency stops and session management

```typescript
// Creates training sessions for each station/group combination
const createRotationSessions = (rotationIndex: number): RotationTrainingSession[] => {
  // For each group, create a session for their current station
  schedule.groups.forEach(group => {
    const currentStationIndex = (group.rotationOrder.indexOf(group.startingStation!) + rotationIndex) % group.rotationOrder.length;
    // ... create session with rotation context
  });
};
```

### 2. Rotation Session Types Integration
**Location**: `/apps/frontend/src/features/physical-trainer/types/rotation.types.ts`

Enhanced rotation types that integrate with training sessions:

```typescript
// Context added to training sessions for rotation awareness
export interface RotationSessionContext {
  rotationScheduleId: string;
  stationId: string;
  groupId: string;
  rotationIndex: number;
  isRotationSession: true;
  nextStation?: string;
  timeUntilRotation?: number;
}

// Individual training session with rotation context
export interface RotationTrainingSession {
  id: string;
  rotationContext: RotationSessionContext;
  stationWorkout: StationWorkout;
  assignedPlayers: string[];
  status: 'pending' | 'active' | 'completed' | 'paused';
  // ... standard session fields
}
```

### 3. Session Conversion Utilities
**Location**: `/apps/frontend/src/features/physical-trainer/utils/rotationSessionUtils.ts`

Utilities that convert rotation configurations to TrainingSessionViewer-compatible format:

```typescript
// Convert station workout to training session
export const stationWorkoutToTrainingSession = (
  rotationSession: RotationTrainingSession,
  station: WorkoutStation,
  location: string,
  createdBy: string
): TrainingSessionData => {
  // Convert based on station workout type
  switch (rotationSession.stationWorkout.type) {
    case 'intervals':
      return { ...baseSession, type: 'CONDITIONING', intervalProgram: intervalData };
    case 'strength':
      return { ...baseSession, type: 'STRENGTH', strengthProgram: strengthData };
    case 'hybrid':
      return { ...baseSession, type: 'HYBRID', hybridProgram: hybridData };
    // ... other types
  }
};
```

### 4. Enhanced TrainingSessionViewer
**Location**: `/apps/frontend/src/features/physical-trainer/components/TrainingSessionViewer.tsx`

The existing TrainingSessionViewer is enhanced to show rotation context without breaking existing functionality:

```typescript
interface TrainingSessionViewerProps {
  // ... existing props
  isRotationSession?: boolean;
  rotationContext?: {
    stationName?: string;
    groupName?: string;
    timeUntilRotation?: number;
    nextStation?: string;
  };
}
```

**Key Enhancement**: Rotation banner showing current station, countdown, and next station information.

### 5. RotationAwareTrainingViewer
**Location**: `/apps/frontend/src/features/physical-trainer/components/rotation/RotationAwareTrainingViewer.tsx`

- **Purpose**: Bridges rotation management with individual session monitoring
- **Key Features**:
  - Overview of all active stations and their sessions
  - Click to drill down into individual sessions using TrainingSessionViewer
  - Real-time rotation progress and transition alerts
  - Integration with existing live session infrastructure

## Integration Benefits

### ✅ No Code Duplication
- **Single WebSocket System**: Uses existing live session infrastructure
- **Reused Components**: TrainingSessionViewer handles all workout types
- **Shared State Management**: Same Redux patterns for session state

### ✅ Clean Separation of Concerns
- **RotationCoordinator**: Handles rotation logic and timing
- **TrainingSessionViewer**: Handles individual session monitoring
- **Session Utils**: Handle conversion between formats

### ✅ Backwards Compatibility
- **Non-breaking Changes**: All existing functionality preserved
- **Optional Integration**: Rotation features are additive
- **Fallback Support**: Works with or without rotation context

### ✅ Real-time Synchronization
- **Live Updates**: Rotation state changes reflected immediately
- **Transition Alerts**: Automatic warnings at 30 seconds before rotation
- **Session Status**: Real-time status updates for all stations

## Usage Examples

### Basic Integration
```typescript
import { RotationCoordinator, EnhancedRotationExecutionView } from '@/features/physical-trainer/components/rotation';

// Use in rotation builder/execution
<EnhancedRotationExecutionView
  schedule={rotationSchedule}
  onBack={() => navigate('/rotations')}
  onComplete={() => handleComplete()}
/>
```

### Session Monitoring
```typescript
import { RotationAwareTrainingViewer } from '@/features/physical-trainer/components/rotation';

// Monitor rotation sessions
<RotationAwareTrainingViewer
  schedule={schedule}
  executionState={executionState}
  trainingSessions={trainingSessions}
  onSessionSelect={handleSessionSelect}
/>
```

### Individual Session View
```typescript
import TrainingSessionViewer from '@/features/physical-trainer/components/TrainingSessionViewer';

// View individual rotation session with context
<TrainingSessionViewer
  sessionData={sessionData}
  isRotationSession={true}
  rotationContext={{
    stationName: 'Rowing Station',
    groupName: 'Red Group',
    timeUntilRotation: 450,
    nextStation: 'Bike Erg Station'
  }}
/>
```

## Demo Implementation

### Demo Component
**Location**: `/apps/frontend/src/features/physical-trainer/components/rotation/RotationIntegrationDemo.tsx`

A comprehensive demonstration showing:
- 4-station rotation with 24 NHL players
- Multiple workout types (intervals, strength, recovery)
- Full integration with TrainingSessionViewer
- Real-time monitoring and transitions

### Demo Schedule
- **4 Stations**: Rowing, Bike Erg, Ski Erg, Active Recovery  
- **4 Groups**: 6 players each (Red, Blue, Green, Yellow)
- **15-minute rotations** with 2-minute transitions
- **68-minute total duration**

## File Structure

```
/apps/frontend/src/features/physical-trainer/
├── components/
│   ├── rotation/
│   │   ├── RotationCoordinator.tsx              # Main coordinator logic
│   │   ├── RotationAwareTrainingViewer.tsx      # Session monitoring UI
│   │   ├── EnhancedRotationExecutionView.tsx    # Complete execution interface
│   │   ├── RotationIntegrationDemo.tsx          # Demo implementation
│   │   └── index.ts                             # Component exports
│   └── TrainingSessionViewer.tsx                # Enhanced with rotation context
├── types/
│   └── rotation.types.ts                        # Enhanced with session integration
├── utils/
│   └── rotationSessionUtils.ts                  # Session conversion utilities
└── hooks/
    └── useSessionBroadcast.ts                   # Existing WebSocket hooks (reused)
```

## Translation Keys

All rotation integration strings use the `physicalTrainer:rotation` namespace:

```json
{
  "rotation": {
    "integrationDemo": "Rotation System Integration Demo",
    "liveSessionMonitoring": "Live Session Monitoring",
    "currentStation": "Current Station",
    "nextStation": "Next Station",
    "rotationProgress": "Rotation Progress",
    "transitionWarning": "Rotation transition in {{seconds}} seconds",
    "status": {
      "preparing": "Preparing",
      "active": "Active",
      "transitioning": "Transitioning",
      "completed": "Completed"
    }
  }
}
```

## Testing the Integration

1. **Launch Demo**: Use `RotationIntegrationDemo` component
2. **Start Rotation**: Click "Launch Demo" to see full execution
3. **Monitor Sessions**: Click on individual stations to view sessions
4. **Test Transitions**: Watch automatic transitions every 15 minutes
5. **Emergency Stop**: Test pause/resume functionality

## Next Steps for Full Implementation

1. **Backend Integration**: Connect with training service WebSocket endpoints
2. **Real Player Data**: Replace mock players with actual team rosters  
3. **Metrics Integration**: Connect with biometric data streams
4. **Persistence**: Save rotation execution history
5. **Notifications**: Add coach/trainer alerts for transitions

## Conclusion

This integration demonstrates a clean architectural approach that:

- **Leverages existing infrastructure** rather than duplicating it
- **Maintains separation of concerns** between rotation logic and session monitoring
- **Provides seamless user experience** with rotation-aware UI enhancements
- **Scales efficiently** for multiple concurrent rotation sessions
- **Preserves backwards compatibility** with all existing functionality

The result is a robust rotation system that feels native to the existing application while requiring minimal changes to the core TrainingSessionViewer infrastructure.