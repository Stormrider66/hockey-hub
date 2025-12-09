# SessionBundleView Implementation

A comprehensive dashboard component for monitoring and managing multiple parallel training sessions after they've been created.

## Overview

The SessionBundleView provides a unified interface for trainers to monitor 3-8 concurrent training sessions with real-time updates, bulk actions, and detailed individual session management.

## Components

### Main Components

- **SessionBundleView** - Main dashboard component integrating all functionality
- **SessionBundleViewDemo** - Demo component showing usage patterns

### Supporting Components (bundle-view/)

- **SessionCard** - Individual session display with progress, participants, and metrics
- **BundleMetrics** - Aggregated metrics across all sessions
- **BulkActions** - Bulk operations (pause all, resume all, broadcast messages)
- **SessionGridView** - Responsive grid layout with filtering and sorting

## Features

### Real-time Monitoring
- Live progress updates every 5 seconds
- Heart rate and performance metrics
- Session status tracking (active, paused, preparing, completed)
- Participant connection status

### Responsive Layout
- Adapts from 2x2 to 4x2 grid based on session count
- Grid and list view modes
- Mobile-friendly responsive design

### Bulk Operations
- Pause All / Resume All sessions
- Broadcast messages to active sessions
- Export session data
- Session filtering and sorting

### Visual Indicators
- Color-coded workout types (strength: blue, conditioning: red, hybrid: purple, agility: orange)
- Progress bars with type-specific colors
- Status badges with icons
- Equipment type indicators

## Usage

```tsx
import { SessionBundleView } from '@/features/physical-trainer/components/bulk-sessions';

function MyComponent() {
  const handleSessionClick = (sessionId: string) => {
    // Navigate to live session monitoring
    router.push(`/physicaltrainer/live-session/${sessionId}`);
  };

  const handleBulkAction = (action: BulkActionType, sessionIds: string[]) => {
    // Handle bulk operations
    switch (action) {
      case 'pause_all':
        // Pause all sessions
        break;
      case 'resume_all':
        // Resume all sessions
        break;
      case 'broadcast_message':
        // Send message to all active sessions
        break;
      case 'export_data':
        // Export session data
        break;
    }
  };

  return (
    <SessionBundleView
      bundleId="bundle-123"
      onSessionClick={handleSessionClick}
      onBulkAction={handleBulkAction}
    />
  );
}
```

## Data Structure

### SessionBundle
```typescript
interface SessionBundle {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  sessions: BundleSession[];
  totalParticipants: number;
  status: 'preparing' | 'active' | 'paused' | 'completed';
}
```

### BundleSession
```typescript
interface BundleSession {
  id: string;
  name: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  equipment?: string;
  participants: SessionParticipant[];
  status: 'preparing' | 'active' | 'paused' | 'completed';
  progress: number; // 0-100
  startTime?: Date;
  elapsedTime: number; // seconds
  estimatedDuration: number; // seconds
  currentPhase: string;
  location?: string;
}
```

## Mock Data

The implementation includes a comprehensive mock data generator that creates:
- 3-8 randomized sessions per bundle
- 4-12 participants per session
- Various workout types and equipment
- Realistic metrics (heart rate, power, calories)
- Different session states and progress

## Integration Points

### TrainingSessionViewer
- Click individual sessions to open detailed live monitoring
- Maintains existing viewer patterns and error boundaries
- Supports all workout types (strength, conditioning, hybrid, agility)

### WebSocket Integration
- Ready for real-time updates via existing communication service
- Uses existing live session infrastructure
- Compatible with session broadcast hooks

### Translation Support
- Full i18n support with physicalTrainer namespace
- Comprehensive translation keys for all UI elements
- Supports pluralization and interpolation

## Performance Considerations

- Virtual scrolling ready for large session counts
- Lazy loading of detailed session data
- Optimized re-rendering with React.memo patterns
- Debounced real-time updates to prevent excessive API calls

## Future Enhancements

- WebSocket integration for true real-time updates
- Advanced filtering (by team, trainer, location)
- Session templates and bulk scheduling
- Performance analytics and reporting
- Mobile app compatibility

## Dependencies

- React 18+ with hooks
- react-i18next for translations
- Existing UI components (Card, Button, Badge, etc.)
- Existing icon system (@/components/icons)
- TypeScript for type safety