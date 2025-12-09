# API Standardization - Unified Training API

This document outlines the comprehensive API standardization implemented across all workout types in the Hockey Hub platform. The standardization provides consistent interfaces, error handling, and developer experience while maintaining backward compatibility.

## Overview

The unified training API standardizes request/response formats across all workout types (Strength, Conditioning, Hybrid, Agility) while providing:

- **Consistent interfaces** across all workout types
- **Standardized error handling** with detailed error codes
- **Unified pagination and filtering** with common parameters
- **Type-safe TypeScript** definitions
- **Backward compatibility** with existing APIs
- **Enhanced developer experience** with comprehensive hooks

## Architecture

### Core Components

1. **API Types** (`api.types.ts`) - Standardized type definitions
2. **Unified Training API** (`unifiedTrainingApi.ts`) - Main API implementation
3. **Migration Utils** (`migrationUtils.ts`) - Backward compatibility utilities
4. **Workout Hooks** (`workoutHooks.ts`) - Enhanced React hooks
5. **Mock Adapters** - Updated mock handlers for development

### File Structure

```
src/
├── features/physical-trainer/types/
│   └── api.types.ts                    # Standardized API types
├── store/api/
│   ├── unifiedTrainingApi.ts          # Main unified API
│   ├── migrationUtils.ts              # Legacy migration utilities
│   ├── workoutHooks.ts                # Enhanced React hooks
│   └── mockAdapters/
│       └── trainingMockAdapter.ts     # Updated mock handlers
└── features/physical-trainer/components/examples/
    └── StandardizedApiExample.tsx     # Usage examples
```

## API Endpoints

### Unified Endpoint Structure

All workout types now use consistent endpoint patterns:

```
GET    /api/training/workouts              # List workouts
POST   /api/training/workouts              # Create workout
GET    /api/training/workouts/:id          # Get single workout
PUT    /api/training/workouts/:id          # Update workout
DELETE /api/training/workouts/:id          # Delete workout
POST   /api/training/workouts/batch        # Batch operations
POST   /api/training/workouts/:id/duplicate # Duplicate workout
POST   /api/training/workouts/validate     # Validate workout
GET    /api/training/workouts/:id/validate # Validate existing workout
GET    /api/training/workouts/statistics   # Get statistics
```

### Request/Response Format

#### Standard Success Response
```typescript
interface ApiSuccessResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
    requestId: string;
    duration: number;
  };
}
```

#### Standard List Response
```typescript
interface ApiListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  meta: ApiMetadata;
}
```

#### Standard Error Response
```typescript
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
```

## Type System

### Unified Workout Types

```typescript
type WorkoutType = 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';

type UnifiedWorkout = StrengthWorkout | ConditioningWorkout | HybridWorkout | AgilityWorkout;

interface BaseWorkout {
  id: string;
  type: WorkoutType;
  name: string;
  description?: string;
  scheduledDate?: Date;
  location?: string;
  estimatedDuration: number;
  assignedPlayerIds: string[];
  assignedTeamIds: string[];
  exercises: Exercise[];
  settings?: WorkoutSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### Type-Specific Extensions

Each workout type extends the base with specific fields:

```typescript
interface StrengthWorkout extends BaseWorkout {
  type: 'STRENGTH';
  // Uses base exercises field
}

interface ConditioningWorkout extends BaseWorkout {
  type: 'CONDITIONING';
  intervalProgram: IntervalProgram;
}

interface HybridWorkout extends BaseWorkout {
  type: 'HYBRID';
  hybridProgram: HybridProgram;
}

interface AgilityWorkout extends BaseWorkout {
  type: 'AGILITY';
  agilityProgram: AgilityProgram;
}
```

## Error Handling

### Standardized Error Codes

```typescript
enum WorkoutErrorCode {
  // Validation errors
  INVALID_WORKOUT_TYPE = 'INVALID_WORKOUT_TYPE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  
  // Business logic errors
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  FACILITY_NOT_AVAILABLE = 'FACILITY_NOT_AVAILABLE',
  SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT',
  MEDICAL_RESTRICTION = 'MEDICAL_RESTRICTION',
  
  // Permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}
```

### Error Handling Utilities

```typescript
// Check error types
const isValidationError = (error: any) => 
  isErrorCode(error, WorkoutErrorCode.INVALID_FIELD_VALUE);

const isMedicalRestriction = (error: any) => 
  isErrorCode(error, WorkoutErrorCode.MEDICAL_RESTRICTION);

// Get user-friendly error messages
const errorMessage = getErrorMessage(error);
```

## React Hooks

### Primary Hooks

#### `useWorkouts(filters?, pagination?)`
List workouts with filtering and pagination:

```typescript
const {
  workouts,
  pagination,
  isLoading,
  error,
  refetch,
} = useWorkouts(
  {
    types: ['STRENGTH', 'CONDITIONING'],
    playerIds: ['player-001'],
    search: 'leg day',
  },
  {
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  }
);
```

#### `useWorkout(id, options?)`
Get single workout with optional includes:

```typescript
const {
  workout,
  isLoading,
  error,
  refetch,
} = useWorkout('workout-123', {
  include: ['assignments', 'analytics']
});
```

#### `useWorkoutActions()`
All workout mutations with validation:

```typescript
const {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
  isLoading,
  createResult,
  updateResult,
} = useWorkoutActions();

// Create with automatic validation
try {
  const workout = await createWorkout({
    type: 'STRENGTH',
    workout: {
      name: 'New Strength Workout',
      estimatedDuration: 60,
      assignedPlayerIds: ['player-001'],
      exercises: [...]
    }
  });
} catch (error) {
  console.error('Validation failed:', getErrorMessage(error));
}
```

### Type-Specific Hooks

```typescript
// Get workouts by type
const { workouts: strengthWorkouts } = useStrengthWorkouts();
const { workouts: conditioningWorkouts } = useConditioningWorkouts();
const { workouts: hybridWorkouts } = useHybridWorkouts();
const { workouts: agilityWorkouts } = useAgilityWorkouts();

// Get assignments
const { workouts: playerWorkouts } = usePlayerAssignedWorkouts('player-001');
const { workouts: teamWorkouts } = useTeamAssignedWorkouts('team-001');
```

### Utility Hooks

```typescript
// Validation
const { validateWorkout, isValidating } = useWorkoutValidator();

// Error handling
const {
  getErrorMessage,
  isValidationError,
  isMedicalRestriction,
} = useWorkoutErrors();

// Filtering
const {
  buildPlayerFilter,
  buildTypeFilter,
  buildDateRangeFilter,
} = useWorkoutFilters();

// Type utilities
const {
  allTypes,
  getTypeLabel,
  getTypeColor,
  getTypeIcon,
} = useWorkoutTypes();
```

## Filtering and Pagination

### Standard Filter Parameters

```typescript
interface FilterParams {
  search?: string;                // Text search
  dateFrom?: string;             // Start date (ISO)
  dateTo?: string;               // End date (ISO)
  types?: WorkoutType[];         // Workout types
  playerIds?: string[];          // Assigned players
  teamIds?: string[];            // Assigned teams
  createdBy?: string;            // Creator ID
  tags?: string[];               // Workout tags
  status?: 'draft' | 'published' | 'archived';
}
```

### Standard Pagination Parameters

```typescript
interface PaginationParams {
  page: number;                  // Page number (1-based)
  limit: number;                 // Items per page
  sortBy?: string;               // Sort field
  sortOrder?: 'asc' | 'desc';    // Sort direction
}
```

### Usage Examples

```typescript
// Filter by multiple criteria
const filters = {
  types: ['STRENGTH', 'CONDITIONING'],
  playerIds: ['player-001', 'player-002'],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  search: 'leg day',
  tags: ['pre-season'],
};

// Paginate results
const pagination = {
  page: 1,
  limit: 20,
  sortBy: 'scheduledDate',
  sortOrder: 'desc' as const,
};

const { workouts } = useWorkouts(filters, pagination);
```

## Validation

### Real-Time Validation

```typescript
const { validateWorkout } = useWorkoutValidator();

const validationResult = await validateWorkout({
  workout: {
    name: 'Test Workout',
    estimatedDuration: 60,
    // ... other fields
  },
  type: 'STRENGTH',
  context: {
    playerIds: ['player-001'],
    teamIds: ['team-001'],
    scheduledDate: '2024-07-15T10:00:00Z',
  }
});

if (!validationResult.valid) {
  // Handle validation errors
  validationResult.errors.forEach(error => {
    console.log(`${error.field}: ${error.message}`);
  });
}

// Handle warnings and suggestions
validationResult.warnings.forEach(warning => {
  console.warn(`${warning.field}: ${warning.message}`);
});

validationResult.suggestions.forEach(suggestion => {
  console.info(`${suggestion.field}: ${suggestion.suggestion}`);
});
```

### Validation Rules

The API performs comprehensive validation:

1. **Required Fields**: Name, duration, type
2. **Field Formats**: Email addresses, dates, IDs
3. **Business Rules**: Medical restrictions, scheduling conflicts
4. **Type-Specific**: Exercise requirements, interval programs
5. **Assignment Rules**: Valid player/team assignments

## Batch Operations

### Supported Operations

```typescript
// Batch create
await batchWorkouts({
  operation: 'create',
  workouts: [
    { type: 'STRENGTH', workout: { ... } },
    { type: 'CONDITIONING', workout: { ... } },
  ]
});

// Batch update
await batchWorkouts({
  operation: 'update',
  workoutIds: ['workout-1', 'workout-2'],
  updates: {
    location: 'New Training Center',
    estimatedDuration: 90,
  }
});

// Batch delete
await batchWorkouts({
  operation: 'delete',
  workoutIds: ['workout-1', 'workout-2']
});
```

### Batch Response Format

```typescript
interface BatchOperationResponse {
  successful: string[];           // IDs of successful operations
  failed: Array<{
    id?: string;
    error: string;
    details?: any;
  }>;
  meta: ApiMetadata;
}
```

## Statistics and Analytics

### Workout Statistics

```typescript
const { data: stats } = useWorkoutStats({
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  playerIds: ['player-001'],
  teamIds: ['team-001'],
});

// Statistics include:
// - Total workout count
// - Count by workout type
// - Count by status
// - Recent activity trends
// - Popular exercises
```

## Migration and Backward Compatibility

### Automatic Migration

The system automatically handles legacy data:

```typescript
// Legacy requests are automatically transformed
const legacyRequest = {
  title: 'Old Format Workout',  // Maps to 'name'
  type: 'strength',             // Maps to 'STRENGTH'
  date: '2024-07-15',          // Maps to 'scheduledDate'
  team: 'team-001',            // Maps to 'assignedTeamIds'
};

// Automatically transformed to new format
const newRequest = transformLegacyCreateRequest(legacyRequest);
```

### Migration Utilities

```typescript
// Check if data can be migrated
const canMigrate = canMigrateWorkout(oldWorkout);

// Get migration warnings
const warnings = getMigrationWarnings(oldWorkout);

// Batch migrate multiple workouts
const { successful, failed } = batchMigrateWorkouts(oldWorkouts);

// Generate migration report
const report = createMigrationReport(successful, failed);
```

### Legacy Compatibility Hooks

```typescript
// Use legacy API with automatic migration
const { data } = useLegacyWorkouts();

// Legacy actions with migration
const { createWorkout } = useLegacyWorkoutActions();

// Supports both old and new formats
await createWorkout(legacyFormatOrNewFormat);
```

## Development and Testing

### Mock Data

The mock adapters provide comprehensive test data:

- **Mock Sessions**: Various workout types with realistic data
- **Mock Players**: Different medical conditions and restrictions  
- **Mock Statistics**: Historical data for analytics
- **Mock Validation**: Realistic validation scenarios

### Example Usage

See `StandardizedApiExample.tsx` for comprehensive usage examples demonstrating:

- CRUD operations for all workout types
- Real-time validation
- Error handling patterns
- Filtering and pagination
- Statistics and analytics
- Type-specific operations

## Benefits

### For Developers

1. **Consistent APIs**: Same patterns across all workout types
2. **Type Safety**: Full TypeScript support with proper types
3. **Error Handling**: Standardized error codes and messages
4. **Developer Experience**: Enhanced hooks with automatic validation
5. **Documentation**: Comprehensive examples and patterns

### For Users

1. **Reliable Experience**: Consistent behavior across all features
2. **Better Error Messages**: Clear, actionable error information
3. **Performance**: Optimized queries and caching
4. **Validation**: Real-time feedback with helpful suggestions

### For Maintenance

1. **Reduced Complexity**: Single API pattern vs. multiple different patterns
2. **Easier Testing**: Standardized mock data and test patterns
3. **Backward Compatibility**: Gradual migration without breaking changes
4. **Future-Proof**: Extensible design for new workout types

## Migration Guide

### For Existing Components

1. **Import new hooks**: Replace old API calls with standardized hooks
2. **Update type definitions**: Use unified workout types
3. **Handle errors consistently**: Use standardized error handling
4. **Add validation**: Use real-time validation hooks
5. **Test thoroughly**: Verify all functionality with new APIs

### Example Migration

```typescript
// Before (legacy)
const { data: sessions } = useGetWorkoutSessionsQuery();
const [createSession] = useCreateWorkoutSessionMutation();

// After (standardized)
const { workouts } = useWorkouts();
const { createWorkout } = useWorkoutActions();

// The new hooks provide more features and better error handling
```

## Conclusion

The standardized API provides a robust, type-safe, and consistent foundation for all workout-related operations in Hockey Hub. It improves developer experience, user experience, and maintainability while preserving backward compatibility with existing code.

The implementation demonstrates enterprise-grade API design with comprehensive error handling, validation, filtering, and real-time features that scale across all workout types.