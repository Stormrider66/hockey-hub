# Physical Trainer Workout Validation Utilities

This directory contains shared validation and assignment utilities for all workout builders in the Physical Trainer dashboard.

## Overview

The utilities ensure consistency across different workout types (Strength, Conditioning, Hybrid, Agility) by providing:

1. **Validation utilities** - Ensure workout data integrity and user safety
2. **Assignment helpers** - Manage player/team assignments and calculate affected participants
3. **TypeScript types** - Full type safety for all validation operations

## Files

### `workoutValidation.ts`
Core validation functions that work across all workout types:

- `validatePlayerAssignments()` - Check that at least one player or team is selected
- `validateWorkoutContent()` - Type-specific content validation with custom rules
- `validateMedicalCompliance()` - Check for medical restrictions and conflicts
- `formatValidationErrors()` - Create user-friendly error messages
- `validateWorkoutSession()` - Complete session validation with all checks

### `assignmentHelpers.ts`
Player and team assignment utilities:

- `calculateAffectedPlayers()` - Get total players including team members
- `formatPlayerSummary()` - Create readable assignment summaries
- `checkScheduleConflicts()` - Detect scheduling conflicts with existing events
- `generateWorkoutDefaults()` - Smart default values based on workout type, team level, and season
- `generateSessionName()` - Create descriptive session names
- `groupPlayersByPosition()` / `groupPlayersByTeam()` - Player organization utilities
- `validatePlayerEligibility()` - Check age and medical restrictions

### `index.ts`
Barrel export for easy importing of all utilities and types.

## Usage Examples

### Basic Validation

```typescript
import { validateWorkoutSession, ValidationResult } from '@/features/physical-trainer/utils';

// Validate a complete workout session
const result: ValidationResult = await validateWorkoutSession(
  sessionData,
  selectedPlayers,
  selectedTeams,
  getMedicalReports // optional medical check function
);

if (!result.isValid) {
  const errorMessages = formatValidationErrors(result.errors);
  showErrors(errorMessages);
} else if (result.warnings.length > 0) {
  showWarnings(result.warnings);
}
```

### Player Assignment Management

```typescript
import { 
  calculateAffectedPlayers,
  formatPlayerSummary,
  generateWorkoutDefaults 
} from '@/features/physical-trainer/utils';

// Calculate total affected players
const allAffectedPlayers = calculateAffectedPlayers(
  selectedPlayers,
  selectedTeams,
  allPlayers
);

// Create assignment summary
const summary = formatPlayerSummary(
  selectedPlayers,
  selectedTeams,
  allPlayers
);

// Generate smart defaults
const defaults = generateWorkoutDefaults(
  WorkoutType.STRENGTH,
  'senior', // team level
  'preseason' // season
);
```

### Medical Compliance Check

```typescript
import { validateMedicalCompliance } from '@/features/physical-trainer/utils';

// Check for medical restrictions
const warnings = await validateMedicalCompliance(
  selectedPlayers,
  sessionData,
  async (playerIds) => {
    return await api.getMedicalReports(playerIds);
  }
);

if (warnings.length > 0) {
  // Show medical warnings to coach
  warnings.forEach(warning => {
    console.warn(warning.message);
  });
}
```

### Schedule Conflict Detection

```typescript
import { checkScheduleConflicts } from '@/features/physical-trainer/utils';

// Check for scheduling conflicts
const conflicts = await checkScheduleConflicts(
  selectedPlayers,
  sessionDate,
  sessionDuration,
  async (playerId, date) => {
    return await api.getPlayerSchedule(playerId, date);
  }
);

if (conflicts.length > 0) {
  const highPriorityConflicts = conflicts.filter(c => c.severity === 'high');
  if (highPriorityConflicts.length > 0) {
    showConflictWarning(highPriorityConflicts);
  }
}
```

## Validation Rules by Workout Type

### Strength Workouts
- Must have at least one exercise
- All exercises must have valid sets/reps/duration
- Load calculations must reference valid test data

### Conditioning Workouts
- Must have at least one interval
- Interval durations must be ≥ 10 seconds
- Total duration must be 5-180 minutes
- Heart rate targets must be within safe ranges

### Hybrid Workouts
- Must have at least one block
- Exercise blocks must contain exercises
- Interval blocks must have interval configuration
- Block ordering must be logical

### Agility Workouts
- Must have at least one drill
- Each drill must have ≥ 1 repetition
- Pattern data must be valid for visualizer
- Equipment requirements must be available

## Error Codes

Common validation error codes:

- `NO_ASSIGNMENTS` - No players or teams selected
- `EMPTY_WORKOUT` - No exercises/intervals/drills added
- `MISSING_CONTENT` - Required workout content missing
- `INVALID_DURATION` - Duration outside acceptable range
- `MEDICAL_RESTRICTION` - Player has conflicting medical restrictions
- `MEDICAL_CHECK_FAILED` - Unable to verify medical compliance

## Type Safety

All utilities are fully typed with TypeScript interfaces:

- `ValidationResult` - Complete validation response
- `ValidationError` / `ValidationWarning` - Individual validation issues
- `AssignmentSummary` - Player assignment summary data
- `ScheduleConflict` - Scheduling conflict information
- `WorkoutDefaults` - Default workout configuration

## Integration with Existing Components

These utilities are designed to integrate seamlessly with existing workout builders:

1. **SessionBuilder** - Use for form validation and player assignment
2. **ConditioningWorkoutBuilder** - Validate interval programs and equipment
3. **HybridWorkoutBuilder** - Validate block structure and transitions
4. **AgilityWorkoutBuilder** - Validate drill configurations and patterns
5. **TrainingSessionViewer** - Pre-launch validation and safety checks

## Error Handling

All utilities include proper error handling:

- Network failures are caught and handled gracefully
- Invalid input data returns appropriate error messages
- Medical API failures are logged but don't block validation
- Schedule conflicts are warnings, not blocking errors

## Performance Considerations

- Validation is optimized for real-time use in form builders
- Medical checks are cached to avoid repeated API calls
- Schedule conflict checking is debounced for UX smoothness
- Large team assignments are processed efficiently

## Future Enhancements

Planned improvements:

1. **Smart Recommendations** - AI-powered workout suggestions
2. **Advanced Conflict Resolution** - Automatic alternative scheduling
3. **Performance Prediction** - Estimate workout difficulty and outcomes
4. **Custom Validation Rules** - Organization-specific validation logic
5. **Batch Validation** - Validate multiple sessions simultaneously