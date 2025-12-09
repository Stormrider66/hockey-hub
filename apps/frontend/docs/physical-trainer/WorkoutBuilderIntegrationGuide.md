# Workout Builder Error Boundary Integration Guide

This guide shows how to integrate the enhanced `WorkoutBuilderErrorBoundary` into existing and new workout builders.

## Quick Integration Steps

### 1. Import Required Components
```typescript
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../hooks/useAutoSave';
import { useEffect } from 'react';
```

### 2. Rename Your Component Function
```typescript
// Before:
export default function MyWorkoutBuilder(props) {
  // component logic
}

// After:
function MyWorkoutBuilderInternal(props) {
  // component logic
}
```

### 3. Add Auto-Save Hook
```typescript
function MyWorkoutBuilderInternal(props) {
  // Your existing state
  const [workoutData, setWorkoutData] = useState({});
  
  // Add auto-save
  const autoSaveKey = `workout_builder_autosave_${props.workoutType}_${props.sessionId || 'new'}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: workoutData, // Your state to save
    enabled: true,
    delay: 2000,
    onRestore: (data) => {
      setWorkoutData(data);
      toast.success('Auto-save restored');
    }
  });

  // Handle restore events
  useEffect(() => {
    const handleRestoreEvent = (event: CustomEvent) => {
      if (event.detail?.workoutType === props.workoutType) {
        const data = event.detail.data;
        if (data) {
          setWorkoutData(data);
        }
      }
    };

    window.addEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    return () => {
      window.removeEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    };
  }, []);
}
```

### 4. Update Save Handler
```typescript
const handleSave = async () => {
  try {
    // Your save logic here
    await saveMutation(workoutData).unwrap();
    
    // Clear auto-save on successful save
    clearSavedData();
    
    toast.success('Workout saved successfully');
  } catch (error) {
    toast.error('Failed to save workout');
    throw error; // Let error boundary handle it
  }
};
```

### 5. Add Wrapped Export
```typescript
// Export with error boundary wrapper
export default function MyWorkoutBuilder(props: MyWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType={props.workoutType}
      sessionId={props.sessionId}
      onReset={() => {
        console.log('Workout builder reset after error');
      }}
    >
      <MyWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}
```

## Complete Example: Strength Workout Builder

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../hooks/useAutoSave';
import { toast } from 'react-hot-toast';

interface StrengthWorkoutBuilderProps {
  workoutType: 'strength';
  sessionId?: string;
  onSave: (workout: any) => void;
  onCancel: () => void;
}

function StrengthWorkoutBuilderInternal({
  workoutType,
  sessionId,
  onSave,
  onCancel
}: StrengthWorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');

  // Auto-save functionality
  const autoSaveKey = `workout_builder_autosave_${workoutType}_${sessionId || 'new'}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: {
      workoutName,
      exercises,
      notes
    },
    enabled: true,
    delay: 2000,
    onRestore: (data) => {
      setWorkoutName(data.workoutName || '');
      setExercises(data.exercises || []);
      setNotes(data.notes || '');
      toast.success('Auto-save restored');
    }
  });

  // Handle restore events from error boundary
  useEffect(() => {
    const handleRestoreEvent = (event: CustomEvent) => {
      if (event.detail?.workoutType === workoutType) {
        const data = event.detail.data;
        if (data) {
          setWorkoutName(data.workoutName || '');
          setExercises(data.exercises || []);
          setNotes(data.notes || '');
        }
      }
    };

    window.addEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    return () => {
      window.removeEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    };
  }, [workoutType]);

  const handleSave = async () => {
    try {
      const workout = {
        name: workoutName,
        exercises,
        notes,
        type: workoutType
      };

      await onSave(workout);
      
      // Clear auto-save on successful save
      clearSavedData();
      
      toast.success('Strength workout saved successfully');
    } catch (error) {
      toast.error('Failed to save strength workout');
      throw error; // Let error boundary handle it
    }
  };

  return (
    <div>
      {/* Your workout builder UI */}
      <input 
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Workout name"
      />
      {/* More UI components */}
      <button onClick={handleSave}>Save Workout</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

// Export with error boundary wrapper
export default function StrengthWorkoutBuilder(props: StrengthWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType={props.workoutType}
      sessionId={props.sessionId}
      onReset={() => {
        console.log('Strength workout builder reset after error');
      }}
    >
      <StrengthWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}
```

## Error Types and Recovery Actions

The error boundary automatically classifies errors and provides appropriate recovery options:

### Network Errors
- **Detected by**: "network", "fetch", "timeout" in error message
- **Recovery options**: Retry with exponential backoff, check connection
- **User actions**: Wait and retry, check network status

### Authentication Errors  
- **Detected by**: "401", "403", "unauthorized" in error message
- **Recovery options**: Re-authenticate, check permissions
- **User actions**: Sign out/in, contact admin

### Validation Errors
- **Detected by**: "validation", "invalid" in error message  
- **Recovery options**: Fix input data, restore auto-save
- **User actions**: Review inputs, use simpler data

### System Errors
- **Detected by**: "memory", "stack" in error message
- **Recovery options**: Refresh page, clear cache
- **User actions**: Restart browser, try different browser

## Auto-Save Features

### Automatic Saving
- Saves every 2 seconds (configurable)
- Only saves when data changes
- Uses debouncing to prevent excessive saves

### Restoration
- Shows auto-save available notice in error boundary
- One-click restore from auto-save
- Custom restore events for complex state

### Storage Management
- Uses localStorage with fallback
- Automatic cleanup on successful save
- Unique keys per workout type and session

## Best Practices

### 1. State Structure
Keep auto-save data simple and serializable:
```typescript
// Good
const autoSaveData = {
  workoutName: string,
  exercises: Exercise[],
  notes: string
};

// Avoid
const autoSaveData = {
  complexObject: new MyClass(),
  functionReference: () => {},
  circularReference: obj
};
```

### 2. Error Handling
Let the error boundary handle errors:
```typescript
// Good - throw errors to be caught
const handleSave = async () => {
  try {
    await saveWorkout();
    clearSavedData();
  } catch (error) {
    throw error; // Error boundary will handle
  }
};

// Avoid - swallowing errors
const handleSave = async () => {
  try {
    await saveWorkout();
  } catch (error) {
    console.log(error); // Error boundary won't know about this
  }
};
```

### 3. Testing Error Recovery
Use the example component with test error buttons:
```typescript
<button onClick={() => { throw new Error('Network request failed'); }}>
  Test Network Error
</button>
```

## Implementation Checklist

- [ ] Import error boundary and auto-save hook
- [ ] Rename component function to `ComponentInternal`
- [ ] Add auto-save hook with proper data structure
- [ ] Add restore event listener
- [ ] Update save handler to clear auto-save
- [ ] Add wrapped export with error boundary
- [ ] Test error scenarios and recovery
- [ ] Verify auto-save restoration works
- [ ] Check error logging to backend
- [ ] Confirm user-friendly error messages

## Files Created/Modified

### New Files
- `/shared/WorkoutBuilderErrorBoundary.tsx` - Enhanced error boundary
- `/hooks/useAutoSave.ts` - Auto-save functionality
- `/shared/ErrorBoundaryExample.tsx` - Usage examples

### Modified Files
- `ConditioningWorkoutBuilder.tsx` - Added error boundary and auto-save
- `ConditioningWorkoutBuilderSimple.tsx` - Added error boundary and auto-save

### Next Steps
Apply the same pattern to:
- `HybridWorkoutBuilder.tsx`
- `AgilityWorkoutBuilder.tsx`  
- Any new workout builders
- Other complex form components