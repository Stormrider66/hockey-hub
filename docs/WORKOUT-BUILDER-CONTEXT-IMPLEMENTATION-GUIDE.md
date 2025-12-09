# Workout Builder Context Implementation Guide

## Overview
This guide outlines how to implement session context support in the remaining workout builders (Hybrid, Agility, Strength) following the pattern established in ConditioningWorkoutBuilder.

## Implementation Pattern

### 1. Update Workout Builder Props
Each builder needs to accept `workoutContext` prop:

```typescript
interface WorkoutBuilderProps {
  onSave: (program: ProgramType, playerIds?: string[], teamIds?: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: ProgramType;
  workoutId?: string;
  workoutContext?: WorkoutCreationContext | null; // Add this
}
```

### 2. Add Session Context Banner
Display session information when context is provided:

```typescript
{workoutContext && (
  <Card className="border-blue-200 bg-blue-50/50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Creating workout for training session
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{workoutContext.playerName} ({workoutContext.teamName})</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{format(sessionDate, 'MMM d')} at {workoutContext.sessionTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{workoutContext.sessionLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>{workoutContext.sessionType}</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### 3. Pre-fill Form Fields
Use context to set initial values:

```typescript
const [workoutName, setWorkoutName] = useState(
  initialData?.name || 
  (workoutContext ? `${workoutContext.sessionType} - ${workoutContext.playerName}` : '')
);

const [description, setDescription] = useState(
  initialData?.description || 
  (workoutContext ? `Personalized ${workoutContext.sessionType.toLowerCase()} workout for ${workoutContext.playerName}` : '')
);

const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
  workoutContext ? [workoutContext.playerId] : []
);
```

### 4. Include Session Metadata in Save
Add session metadata when saving:

```typescript
const handleSave = () => {
  const program = {
    // ... other fields
    metadata: workoutContext ? {
      sessionId: workoutContext.sessionId,
      sessionType: workoutContext.sessionType,
      sessionDate: workoutContext.sessionDate instanceof Date ? 
        workoutContext.sessionDate.toISOString() : 
        workoutContext.sessionDate,
      sessionTime: workoutContext.sessionTime,
      sessionLocation: workoutContext.sessionLocation
    } : undefined
  };
  
  onSave(program, selectedPlayers, selectedTeams);
};
```

### 5. Update Save Button Text
Show context-aware save button:

```typescript
<Button onClick={handleSave}>
  {isLoading ? 'Saving...' : workoutContext ? 'Save & Link to Session' : 'Save Workout'}
</Button>
```

## Builder-Specific Implementation

### HybridWorkoutBuilder
1. Import required components and types
2. Add session context banner after header
3. Pre-fill workout name with context
4. Pre-select player in assignment
5. Include metadata in HybridProgram save

### AgilityWorkoutBuilder
1. Add Players tab if not present
2. Import PlayerTeamAssignment component
3. Show session context banner
4. Pre-fill drill sequence name
5. Include metadata in AgilityProgram save

### SessionBuilder (Strength)
1. Add workoutContext to props interface
2. Show session context banner
3. Pre-fill session name and description
4. Pre-select players in assignment
5. Include metadata in template save

## SessionsTab Integration

Each save handler needs to:
1. Extract session context from metadata
2. Link workout to session via API
3. Navigate back after save
4. Clear context after successful save

Example for Hybrid:
```typescript
const handleSaveHybridWorkout = async (program: HybridProgram, playerIds: string[] = [], teamIds: string[] = []) => {
  try {
    const sessionContext = program.metadata;
    const workoutData = {
      // ... workout data
      sessionId: sessionContext?.sessionId,
      metadata: sessionContext
    };
    
    await createHybridWorkout(workoutData).unwrap();
    
    setWorkoutContext(null);
    setActiveBuilder(null);
    
    if (workoutContext?.returnPath) {
      router.push(workoutContext.returnPath);
    } else if (workoutContext) {
      router.push('/physicaltrainer?tab=overview');
    }
    
    toast.success(sessionContext ? 
      `Workout created and linked to ${sessionContext.sessionType} session` : 
      'Hybrid workout created successfully'
    );
  } catch (error) {
    // ... error handling
  }
};
```

## Testing Checklist

For each workout builder:
- [ ] Context banner displays correctly
- [ ] Form fields pre-filled from context
- [ ] Player pre-selected in assignment
- [ ] Save includes session metadata
- [ ] Navigation returns to overview
- [ ] Session link is established
- [ ] Toast shows appropriate message
- [ ] URL parameters cleared properly

## Common Issues to Avoid

1. **Date Handling**: Always check if sessionDate is string or Date object
2. **Player Selection**: Ensure player arrays are initialized properly
3. **Navigation Timing**: Clear context after save, not before
4. **URL Parameters**: Use setTimeout when clearing to avoid race conditions
5. **Metadata Structure**: Keep consistent across all workout types

## Benefits

- **Reduced Manual Entry**: ~80% less data entry required
- **Context Preservation**: Session details maintained throughout
- **Error Prevention**: Pre-filled data reduces mistakes
- **Workflow Efficiency**: Direct path from need to solution
- **Audit Trail**: Workouts linked to their originating sessions