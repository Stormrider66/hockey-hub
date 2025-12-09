# Training Session WebSocket Infrastructure

## Overview

The Training Session WebSocket infrastructure enables real-time monitoring and control of live training sessions. It provides a dedicated namespace (`/training`) within the communication service for handling all training-related real-time events.

## Architecture

### Backend Components

1. **Communication Service (Port 3002)**
   - Hosts the WebSocket server with `/training` namespace
   - `TrainingSessionHandler` - Manages session state and player interactions
   - `NamespaceManager` - Handles namespace initialization and routing
   - Rate limiting for metric updates (2-second intervals by default)

2. **Training Service (Port 3004)**
   - `TrainingSessionSocketService` - Client service to connect to communication service
   - REST endpoints for session control
   - Integration with existing workout session database

### Frontend Components

1. **React Hook**
   - `useTrainingSessionSocket` - Comprehensive hook for WebSocket operations
   - Automatic reconnection handling
   - Type-safe event handling

## Event Types

### Session Lifecycle Events
- `training:session:join` - Join a session as trainer/player/observer
- `training:session:leave` - Leave current session
- `training:session:start` - Start the session (trainer only)
- `training:session:end` - End the session (trainer only)
- `training:session:pause` - Pause the session (trainer only)
- `training:session:resume` - Resume the session (trainer only)

### Player Events
- `training:player:join` - Player joins the session
- `training:player:leave` - Player leaves the session
- `training:player:metrics` - Update player metrics (HR, power, pace)
- `training:player:exercise:progress` - Update exercise completion
- `training:player:interval:progress` - Update interval progress
- `training:player:status` - Update player status (waiting/active/paused/completed)

### Admin Events
- `training:session:force:end` - Force end a session
- `training:player:kick` - Remove a player from session

## Usage Examples

### Frontend - Trainer Dashboard

```typescript
import { useTrainingSessionSocket } from '@/features/physical-trainer/hooks/useTrainingSessionSocket';

function TrainerLiveSessionView({ sessionId }: { sessionId: string }) {
  const {
    connected,
    session,
    error,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    kickPlayer,
  } = useTrainingSessionSocket({
    sessionId,
    role: 'trainer',
    autoConnect: true,
  });

  if (!connected) {
    return <div>Connecting to live session...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>{session?.workoutName}</h2>
      <p>Status: {session?.status}</p>
      <p>Active Players: {session?.activePlayers}/{session?.totalPlayers}</p>
      
      <div>
        {session?.status === 'scheduled' && (
          <button onClick={startSession}>Start Session</button>
        )}
        {session?.status === 'active' && (
          <>
            <button onClick={pauseSession}>Pause</button>
            <button onClick={endSession}>End Session</button>
          </>
        )}
        {session?.status === 'paused' && (
          <button onClick={resumeSession}>Resume</button>
        )}
      </div>

      <div>
        <h3>Players</h3>
        {session?.players.map(player => (
          <div key={player.playerId}>
            <span>{player.playerName}</span>
            <span>Status: {player.status}</span>
            {player.metrics && (
              <span>HR: {player.metrics.heartRate} bpm</span>
            )}
            <button onClick={() => kickPlayer(player.playerId)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Frontend - Player App

```typescript
import { useTrainingSessionSocket } from '@/features/physical-trainer/hooks/useTrainingSessionSocket';

function PlayerWorkoutView({ sessionId, playerId }: Props) {
  const {
    connected,
    session,
    updatePlayerMetrics,
    updateExerciseProgress,
    updatePlayerStatus,
  } = useTrainingSessionSocket({
    sessionId,
    role: 'player',
    playerId,
    autoConnect: true,
  });

  // Update metrics from device
  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && deviceConnected) {
        updatePlayerMetrics({
          playerId,
          sessionId,
          timestamp: new Date(),
          heartRate: device.heartRate,
          power: device.power,
          cadence: device.cadence,
        });
      }
    }, 2000); // Rate limited to 2 seconds

    return () => clearInterval(interval);
  }, [connected, deviceConnected]);

  // Mark exercise complete
  const completeExercise = (exercise: Exercise, setData: SetData) => {
    updateExerciseProgress({
      playerId,
      sessionId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      setNumber: setData.setNumber,
      totalSets: exercise.sets,
      reps: setData.reps,
      weight: setData.weight,
      completed: true,
      timestamp: new Date(),
    });
  };

  return (
    <div>
      <h2>{session?.workoutName}</h2>
      <WorkoutDisplay
        workout={workout}
        onExerciseComplete={completeExercise}
        onStatusChange={(status) => updatePlayerStatus(playerId, status)}
      />
    </div>
  );
}
```

### Backend - Training Service Integration

```typescript
// In training service controller
import { trainingSessionSocketService } from '../services/TrainingSessionSocketService';

export const startWorkoutSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  // Start session in database
  const session = await WorkoutSession.findById(sessionId);
  session.status = 'in_progress';
  session.startTime = new Date();
  await session.save();
  
  // Notify via WebSocket
  if (trainingSessionSocketService.isConnected()) {
    trainingSessionSocketService.startSession(sessionId);
  }
  
  res.json({ success: true, session });
};
```

## Rate Limiting

To prevent overwhelming the system with metric updates:

- Default rate limit: 2 seconds between updates
- Maximum 30 updates per minute per player
- Burst allowance of 5 updates
- Automatic rate limit enforcement on server

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Role-based permissions (trainer vs player vs observer)
3. **Session Access**: Players can only update their own metrics
4. **Trainer Controls**: Only trainers can start/end/pause sessions

## Monitoring & Debugging

### Server Logs
```bash
# Communication service logs
tail -f logs/communication-service.log | grep "training"

# Training service logs
tail -f logs/training-service.log | grep "session"
```

### Client Debugging
```javascript
// Enable Socket.io debugging
localStorage.debug = 'socket.io-client:*';

// Monitor events in console
socket.on('*', (event, data) => {
  console.log('Socket event:', event, data);
});
```

## Performance Optimization

1. **Session State Caching**: Active sessions stored in memory
2. **Automatic Cleanup**: Stale sessions removed after 1 hour
3. **Efficient Updates**: Only changed data transmitted
4. **Room-based Broadcasting**: Messages only sent to relevant participants

## Future Enhancements

1. **Session Recording**: Store all events for playback
2. **Analytics Dashboard**: Real-time team performance metrics
3. **Video Integration**: Sync with video streams
4. **AI Coaching**: Real-time form corrections based on metrics
5. **Multi-trainer Support**: Allow assistant coaches to monitor