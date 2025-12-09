# Calendar Integration Example

## Complete Data Flow Example

### Scenario: Physical Trainer Creates HIIT Conditioning Workout

#### 1. Frontend - Workout Builder Save Action

```typescript
// ConditioningWorkoutBuilder.tsx
const handleSave = async () => {
  const workoutData = {
    title: "Morning HIIT Bike Session",
    description: "High-intensity interval training on bike ergometers",
    type: "conditioning",
    scheduledDate: "2025-01-22T09:00:00Z",
    location: "Cardio Room A",
    teamId: "team-skelleftea-aik",
    playerIds: ["player-1", "player-2", "player-3"],
    estimatedDuration: 45,
    intervalProgram: {
      name: "HIIT Bike Intervals",
      equipment: "bike_erg",
      totalDuration: 2700, // 45 minutes
      estimatedCalories: 350,
      intervals: [
        { id: '1', type: 'warmup', duration: 300, equipment: 'bike_erg' },
        { id: '2', type: 'work', duration: 120, targetMetrics: { heartRate: { value: 85 } } },
        { id: '3', type: 'rest', duration: 60 },
        { id: '4', type: 'work', duration: 120, targetMetrics: { heartRate: { value: 90 } } },
        { id: '5', type: 'cooldown', duration: 300 }
      ],
    }
  };

  // API call to training service
  await createWorkoutSession(workoutData);
};
```

#### 2. Training Service - Workout Creation

```typescript
// workoutRoutes.ts - POST /sessions
router.post('/sessions', async (req, res) => {
  // 1. Create workout in database
  const workout = await workoutService.createWorkoutSession(workoutData);
  
  // 2. Create calendar event
  const user = req.user;
  const organizationId = user?.organizationId || teamId;
  
  await calendarService.createWorkoutEvent(
    workout,
    organizationId,
    workoutData.createdBy
  );
  
  res.status(201).json({ success: true, data: workout });
});
```

#### 3. Calendar Integration Service - Data Transformation

```typescript
// CalendarIntegrationService.ts
convertWorkoutToCalendarEvent(workout, userId) {
  return {
    id: workout.id,
    title: "Morning HIIT Bike Session",
    description: "High-intensity interval training on bike ergometers",
    startTime: "2025-01-22T09:00:00Z",
    endTime: "2025-01-22T09:45:00Z", // calculated from duration
    location: "Cardio Room A",
    trainerId: userId,
    participants: ["player-1", "player-2", "player-3"],
    teamId: "team-skelleftea-aik",
    type: "conditioning",
    workoutType: "CONDITIONING",
    estimatedDuration: 45,
    metadata: {
      exercises: [],
      intervalProgram: { /* full interval program */ },
      intensity: "high", // calculated from heart rate targets
      focus: "Cardiovascular Fitness",
      equipment: ["Bike Erg"],
      preview: {
        intervalCount: 5,
        mainEquipment: "bike_erg",
        estimatedLoad: "high"
      }
    }
  };
}
```

#### 4. Calendar Service - Enhanced Event Creation

```typescript
// trainingIntegrationService.ts
async syncTrainingSession(session, organizationId) {
  const enhancedMetadata = {
    workoutId: session.id,
    sessionId: session.id,
    trainingType: "conditioning",
    workoutType: "CONDITIONING",
    estimatedDuration: 45,
    intervalProgram: session.metadata.intervalProgram,
    workoutPreview: {
      type: "Conditioning",
      duration: "45 min",
      equipment: "bike_erg",
      intervals: 5,
      estimatedCalories: 350,
      intensity: "high"
    },
    programData: {
      intervalProgram: session.metadata.intervalProgram
    }
  };

  return await this.eventService.createEvent({
    title: session.title,
    description: this.generateEnhancedDescription(session),
    type: EventType.TRAINING,
    startTime: new Date(session.startTime),
    endTime: endTime,
    location: session.location,
    organizationId,
    teamId: session.teamId,
    createdBy: session.trainerId,
    visibility: EventVisibility.TEAM,
    participants: session.participants.map(userId => ({
      userId,
      role: 'required',
    })),
    metadata: enhancedMetadata,
    sendReminders: true,
    reminderMinutes: [60, 15],
    color: "#EF4444" // Red for conditioning
  });
}
```

#### 5. Generated Enhanced Description

```
High-intensity interval training on bike ergometers

🏃‍♂️ Conditioning Workout
⏱️ Duration: 45 min
🏋️ Equipment: bike_erg
🔥 Intervals: 5
🔥 Est. Calories: 350
```

#### 6. Frontend - Calendar Display

```typescript
// CalendarWidget.tsx - Event Display
const renderEvent = (event) => {
  const preview = event.metadata?.workoutPreview;
  
  return (
    <div 
      className="calendar-event" 
      style={{ backgroundColor: event.color }}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">09:00 - 09:45</div>
      {preview && (
        <div className="workout-preview">
          <span className="workout-type">{preview.type}</span>
          <span className="workout-equipment">{preview.equipment}</span>
          {preview.intervals && (
            <span className="workout-intervals">{preview.intervals} intervals</span>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 7. Player - Event Details Modal

```typescript
// EventDetailsModal.tsx
const WorkoutPreview = ({ event }) => {
  const preview = event.metadata?.workoutPreview;
  const programData = event.metadata?.programData;
  
  return (
    <div className="workout-details">
      <h3>{preview.type}</h3>
      <div className="workout-stats">
        <div>Duration: {preview.duration}</div>
        <div>Equipment: {preview.equipment}</div>
        <div>Intervals: {preview.intervals}</div>
        <div>Est. Calories: {preview.estimatedCalories}</div>
        <div>Intensity: {preview.intensity}</div>
      </div>
      
      {/* Launch workout button */}
      <button onClick={() => launchWorkout(event)}>
        Start Conditioning Session
      </button>
    </div>
  );
};

const launchWorkout = (event) => {
  const workoutType = event.metadata?.workoutType;
  const workoutId = event.metadata?.workoutId;
  
  switch (workoutType) {
    case 'CONDITIONING':
      router.push(`/player/workout/conditioning/${workoutId}`);
      break;
    case 'STRENGTH':
      router.push(`/player/workout/${workoutId}`);
      break;
    case 'HYBRID':
      router.push(`/player/workout/hybrid/${workoutId}`);
      break;
    case 'AGILITY':
      router.push(`/player/workout/agility/${workoutId}`);
      break;
  }
};
```

### Result: Complete Integration

1. **Physical Trainer** creates conditioning workout in workout builder
2. **Training Service** saves workout and calls calendar service
3. **Calendar Service** creates enhanced event with rich metadata
4. **Calendar** displays workout with preview information and color coding
5. **Players** see workout in calendar with all details
6. **Players** can launch the correct workout viewer directly from calendar
7. **Workout Viewer** receives complete program data for execution

### Key Benefits

1. **Unified View**: All workouts appear in team calendar automatically
2. **Rich Context**: Players see workout details before starting
3. **Correct Routing**: Calendar launches appropriate workout viewer
4. **Complete Data**: All workout information preserved through integration
5. **Visual Coding**: Color-coded events for quick workout type identification
6. **Seamless UX**: No manual calendar entry needed - everything automatic

This integration successfully bridges the gap between workout creation and calendar scheduling, providing a seamless experience for both trainers and players.