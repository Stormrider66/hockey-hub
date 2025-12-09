# Workout Assignment Hierarchy System

## Overview

The Workout Assignment Hierarchy System is an enterprise-scale solution for distributing workouts across organizations, teams, and players. It provides cascade assignment capabilities, conflict detection, medical restriction checking, and player-specific overrides.

## Key Features

### 1. Bulk Assignment
- Assign workouts to entire organizations, teams, lines, positions, or age groups
- Support for custom player groups
- Automatic player resolution based on assignment type

### 2. Cascade Assignment
- Hierarchical distribution from organization → teams → players
- Configurable cascade behavior (sub-teams, players)
- Exclusion lists for teams and players
- Conflict resolution strategies (skip, replace, merge)

### 3. Conflict Detection
- **Scheduling conflicts**: Check for overlapping workouts
- **Medical restrictions**: Validate against player medical records
- **Load limits**: Ensure daily/weekly load thresholds aren't exceeded
- **Duplicate detection**: Prevent redundant assignments

### 4. Player Overrides
- Medical overrides for injured/recovering players
- Performance-based modifications
- Scheduling adjustments
- Custom load multipliers and exercise substitutions

### 5. Calendar Integration
- Automatic synchronization with calendar service
- Event notifications and reminders
- Conflict visualization in calendar views

## API Endpoints

### Bulk Assignment
```http
POST /api/v1/training/workouts/bulk-assign
```

**Request Body:**
```json
{
  "workoutSessionId": "uuid",
  "assignmentType": "team",
  "assignmentTarget": {
    "teamId": "uuid",
    "playerIds": ["uuid1", "uuid2"]
  },
  "effectiveDate": "2024-01-01",
  "scheduledDate": "2024-01-01T10:00:00Z",
  "recurrenceType": "weekly",
  "recurrencePattern": {
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "endDate": "2024-03-01"
  },
  "allowPlayerOverrides": true,
  "notifications": {
    "enabled": true,
    "reminderMinutesBefore": [60, 15]
  }
}
```

### Cascade Assignment
```http
POST /api/v1/training/workouts/cascade
```

**Request Body:**
```json
{
  "workoutSessionId": "uuid",
  "assignmentType": "organization",
  "assignmentTarget": {
    "teamId": "root-team-id"
  },
  "cascadeToSubTeams": true,
  "cascadeToPlayers": true,
  "excludeTeamIds": ["team-uuid-1"],
  "excludePlayerIds": ["player-uuid-1"],
  "respectExistingAssignments": true,
  "conflictResolution": "skip"
}
```

### Conflict Detection
```http
GET /api/v1/training/workouts/conflicts
```

**Query Parameters:**
- `playerIds`: Array of player UUIDs
- `startDate`: Start date for conflict check
- `endDate`: End date for conflict check
- `workoutTypes`: Filter by workout types
- `checkMedicalRestrictions`: Include medical checks
- `checkLoadLimits`: Include load limit checks
- `maxDailyLoad`: Maximum daily load threshold
- `maxWeeklyLoad`: Maximum weekly load threshold

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conflict-123",
      "playerId": "player-uuid",
      "conflictType": "scheduling",
      "existingAssignment": { ... },
      "proposedAssignment": { ... },
      "details": {
        "message": "Player already has workout scheduled",
        "severity": "medium",
        "resolutionOptions": ["skip", "replace", "merge"]
      }
    }
  ]
}
```

### Resolve Conflicts
```http
POST /api/v1/training/workouts/resolve-conflicts
```

**Request Body:**
```json
{
  "conflictId": "conflict-123",
  "resolution": "reschedule",
  "newScheduledDate": "2024-01-02T10:00:00Z",
  "reason": "Avoid overlap with team practice",
  "affectedPlayerIds": ["player-uuid"]
}
```

### Get Player Assignments
```http
GET /api/v1/training/workouts/assignments/{playerId}
```

**Query Parameters:**
- `status`: Filter by assignment status
- `assignmentType`: Filter by assignment type
- `startDate`: Start date filter
- `endDate`: End date filter
- `includeExpired`: Include expired assignments
- `includeOverrides`: Include override details

### Create Player Override
```http
PUT /api/v1/training/workouts/assignments/{assignmentId}/override
```

**Request Body:**
```json
{
  "playerId": "player-uuid",
  "overrideType": "medical",
  "effectiveDate": "2024-01-01",
  "expiryDate": "2024-02-01",
  "modifications": {
    "loadMultiplier": 0.7,
    "excludeExercises": ["exercise-id-1"],
    "substituteExercises": [
      {
        "originalExerciseId": "exercise-id-2",
        "substituteExerciseId": "exercise-id-3",
        "reason": "Knee injury - avoid impact"
      }
    ],
    "restMultiplier": 1.5
  },
  "medicalRestrictions": {
    "restrictionType": "injury",
    "affectedBodyParts": ["knee"],
    "restrictedMovements": ["jumping", "running"],
    "maxExertionLevel": 70,
    "requiresSupervision": true
  }
}
```

## Database Schema

### workout_assignments
- Stores all workout assignments
- Supports hierarchical relationships (parent/child)
- Tracks assignment lifecycle (draft → active → completed)
- Includes recurrence patterns and notifications

### workout_player_overrides
- Player-specific modifications to assignments
- Medical, performance, and scheduling overrides
- Approval workflow support
- Version tracking for audit trail

## Event Integration

The system publishes events for:
- Workout assigned
- Assignment completed
- Assignment cancelled
- Override created
- Override approved/rejected

## Load Management

### Progressive Load Planning
```json
{
  "loadProgression": {
    "baseLoad": 100,
    "progressionType": "linear",
    "progressionRate": 10,
    "progressionInterval": "weekly",
    "maxLoad": 150
  }
}
```

### Performance Thresholds
```json
{
  "performanceThresholds": {
    "minCompletionRate": 80,
    "targetHeartRateZone": {
      "min": 120,
      "max": 160
    },
    "targetPowerOutput": 250
  }
}
```

## Best Practices

1. **Always check conflicts** before bulk assignments
2. **Use cascade assignment** for organization-wide programs
3. **Set appropriate notification windows** (e.g., 24h, 1h before)
4. **Review medical overrides** regularly
5. **Monitor load progression** to prevent overtraining

## Security Considerations

- Role-based access control (RBAC)
- Players can only view their own assignments
- Medical staff can create medical overrides
- Coaches can create performance overrides
- Audit trail for all modifications

## Performance Optimization

- Redis caching for player assignments
- Batch processing for bulk operations
- Asynchronous event publishing
- Database indexes on key query fields