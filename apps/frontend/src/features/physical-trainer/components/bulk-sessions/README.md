# Bulk Sessions Module

This module provides components for creating multiple workout sessions while safely wrapping existing single-session builders.

## Features

- **Feature Flag Controlled**: Uses `NEXT_PUBLIC_ENABLE_BULK_SESSIONS=true` to enable bulk features
- **Safe Wrapper Pattern**: No modifications to existing components
- **Seamless Mode Switching**: Toggle between single and bulk creation modes
- **Preserves Functionality**: All existing props and behaviors are maintained

## Quick Start

### Basic Usage

```tsx
import { BulkSessionWrapper } from '@/features/physical-trainer/components/bulk-sessions';

function MyComponent() {
  const handleSave = (program, playerIds, teamIds) => {
    // Your save logic here
  };

  const handleCancel = () => {
    // Your cancel logic here
  };

  return (
    <BulkSessionWrapper
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={false}
    />
  );
}
```

### Feature Flag Setup

Add to your environment variables:

```env
NEXT_PUBLIC_ENABLE_BULK_SESSIONS=true
```

## Components

### BulkSessionWrapper

Main wrapper component that provides bulk session functionality around `ConditioningWorkoutBuilderSimple`.

**Props**: Same as `ConditioningWorkoutBuilderSimple`
- `onSave`: Function to handle saving workouts
- `onCancel`: Function to handle cancellation
- `isLoading?`: Loading state
- `initialData?`: Initial workout data
- `workoutId?`: Existing workout ID
- `workoutContext?`: Workout creation context

### BulkSessionExample

Example component demonstrating integration.

## Implementation Status

- ✅ **Phase 1**: Safe wrapper with feature flag
- ✅ **Phase 1**: Mode switching UI
- ✅ **Phase 1**: Pass-through props in single mode
- ⏳ **Phase 2**: Bulk creation logic
- ⏳ **Phase 2**: Team copying
- ⏳ **Phase 2**: Date range scheduling
- ⏳ **Phase 3**: Individual session customization

## Architecture

```
BulkSessionWrapper
├── Mode Selector (when feature flag enabled)
├── Bulk Options Panel (in bulk mode)
└── ConditioningWorkoutBuilderSimple (unmodified)
```

## Safety Guarantees

1. **No Breaking Changes**: Existing functionality is preserved
2. **Feature Flag Control**: Bulk features only appear when enabled
3. **Fallback Behavior**: Always falls back to single mode if needed
4. **Zero Dependencies**: No additional dependencies required

## Future Enhancements

- Multiple session creation with customization
- Team-based copying and assignment
- Date range scheduling with intervals
- Template-based bulk creation
- Progress tracking for bulk operations