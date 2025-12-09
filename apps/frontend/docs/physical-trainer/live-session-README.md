# Live Session Monitoring Components

This directory contains components for real-time workout session monitoring in the Physical Trainer dashboard.

## Components

### LiveSessionProvider
React context provider that manages WebSocket connections and session state.
- Handles connection lifecycle (connect/disconnect/reconnect)
- Manages session data and real-time updates
- Provides filtering capabilities

### LiveSessionGrid
Overview grid showing all active sessions with participant counts.
- Displays session cards with trainer info, participants, and progress
- Shows connection status and average progress
- Clickable cards to view detailed session

### SessionSpectatorView
Detailed view for monitoring a specific session.
- Three view modes: Grid, List, and Focus
- Real-time participant progress tracking
- Live metrics display
- Auto-refresh capability

### LiveMetricsPanel
Real-time display of player metrics.
- Supports multiple display modes (compact, standard, detailed)
- Shows heart rate, power, pace, distance, etc.
- Heart rate zone visualization

### ParticipantProgress
Individual player progress cards.
- Shows current exercise, set progress, and completion percentage
- Connection status indicator
- Expandable view for detailed information

## Usage

### Basic Integration

```tsx
import { LiveSessionProvider, LiveSessionGrid } from './live-session';

function PhysicalTrainerDashboard() {
  return (
    <LiveSessionProvider>
      <LiveSessionGrid onSessionClick={handleSessionClick} />
    </LiveSessionProvider>
  );
}
```

### With Filtering

```tsx
import { useLiveSession } from './live-session';

function SessionFilters() {
  const { setFilters } = useLiveSession();

  const applyFilters = () => {
    setFilters({
      workoutType: ['strength', 'conditioning'],
      teamIds: ['team-1', 'team-2'],
      status: ['active']
    });
  };

  return <Button onClick={applyFilters}>Apply Filters</Button>;
}
```

### Full Integration Example

```tsx
import { LiveSessionProvider, LiveSessionGrid, SessionSpectatorView } from './live-session';

function LiveMonitorTab() {
  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <LiveSessionProvider>
      {view === 'grid' ? (
        <LiveSessionGrid 
          onSessionClick={(id) => {
            setSelectedId(id);
            setView('detail');
          }}
        />
      ) : (
        <SessionSpectatorView 
          sessionId={selectedId}
          onBack={() => setView('grid')}
        />
      )}
    </LiveSessionProvider>
  );
}
```

## WebSocket Events

The components listen for these WebSocket events:

- `live:sessions` - Initial session data
- `live:session_started` - New session started
- `live:session_ended` - Session completed
- `live:participant_joined` - Player joined session
- `live:participant_left` - Player left session
- `live:metrics_updated` - Player metrics update
- `live:progress_updated` - Progress update
- `live:phase_changed` - Workout phase changed
- `live:session_status_changed` - Session status update

## Mock Data Example

```typescript
const mockSession: LiveSession = {
  id: 'session-123',
  workoutId: 'workout-456',
  workoutName: 'Morning Strength Training',
  workoutType: 'strength',
  trainerId: 'trainer-789',
  trainerName: 'Coach Johnson',
  startTime: new Date(),
  status: 'active',
  currentPhase: 'Main Workout',
  totalDuration: 3600,
  elapsedTime: 1200,
  participants: [
    {
      id: 'participant-1',
      playerId: 'player-1',
      playerName: 'Sidney Crosby',
      playerNumber: 87,
      teamId: 'team-1',
      teamName: 'Penguins',
      status: 'connected',
      progress: 45,
      currentExercise: 'Bench Press',
      currentSet: 3,
      totalSets: 5,
      metrics: {
        heartRate: 142,
        heartRateZone: 'zone3',
        weight: 100,
        reps: 8
      },
      lastUpdate: new Date()
    }
  ]
};
```

## Styling

Components use:
- Tailwind CSS for styling
- shadcn/ui components for UI elements
- Responsive design with mobile support
- Dark mode compatible

## Performance Considerations

- WebSocket connection is established once and reused
- Automatic reconnection with exponential backoff
- Efficient state updates using React Context
- Progress updates are throttled to prevent excessive renders
- Mock mode support for development