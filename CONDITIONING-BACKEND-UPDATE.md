# Conditioning Workout Builder - Backend Implementation Update

## Summary
This document summarizes the backend implementation work completed for the conditioning workout builder feature in Hockey Hub's training service.

## ✅ Completed Tasks

### 1. **Entity Model Extension**
- **File**: `services/training-service/src/entities/WorkoutSession.ts`
- **Added**: `intervalProgram` JSONB column to store interval workout configurations
- **Structure**:
  ```typescript
  intervalProgram?: {
    name: string;
    equipment: string;
    totalDuration: number;
    estimatedCalories: number;
    intervals: Array<{
      id: string;
      type: 'warmup' | 'work' | 'rest' | 'active_recovery' | 'cooldown';
      duration: number;
      equipment: string;
      targetMetrics: {
        heartRate?: { type: string; value: number; reference?: string; };
        watts?: { type: string; value: number; reference?: string; };
        pace?: { type: string; value: number; };
        rpm?: number;
        calories?: number;
      };
      notes?: string;
    }>;
  }
  ```

### 2. **Database Migration**
- **File**: `services/training-service/src/migrations/1736400000000-AddIntervalProgramToWorkoutSession.ts`
- **Action**: Creates migration to add `intervalProgram` column to `workout_sessions` table

### 3. **Data Transfer Objects (DTOs)**
- **New File**: `packages/shared-lib/src/dto/interval-program.dto.ts`
- **Created DTOs**:
  - `IntervalProgramDto` - Main interval program structure
  - `IntervalSetDto` - Individual interval definition
  - `IntervalTargetMetricsDto` - Target metrics for intervals
  - `TargetMetricDto` - Generic target metric structure
- **Updated**: `packages/shared-lib/src/dto/training.dto.ts`
  - Added `intervalProgram?: IntervalProgramDto` to `CreateWorkoutSessionDto`
- **Updated**: `packages/shared-lib/src/dto/index.ts`
  - Added export for interval-program DTOs

### 4. **Service Updates**
- **File**: `services/training-service/src/services/CachedWorkoutSessionService.ts`
- **Updates**:
  - Added `intervalProgram` field to `UpdateWorkoutSessionDto` interface
  - Modified `createWorkoutSession` to save intervalProgram data
  - Modified `updateWorkoutSession` to update intervalProgram data

### 5. **API Routes**
- **File**: `services/training-service/src/routes/workoutRoutes.ts`
- **Updated Endpoints**:
  - `POST /sessions` - Now accepts `intervalProgram` in request body
  - `PUT /sessions/:id` - Now accepts `intervalProgram` in update data
- **New Endpoints**:
  - `GET /sessions/conditioning` - Fetches only conditioning workouts with interval programs
  - `POST /sessions/conditioning/convert` - Converts interval program to exercises format
  - `GET /sessions/conditioning/templates` - Returns pre-built conditioning templates

## 🔧 Technical Details

### Interval Program Structure
The interval program is stored as JSONB to allow flexible schema evolution while maintaining query performance. Each interval includes:
- Type classification (warmup, work, rest, active_recovery, cooldown)
- Duration in seconds
- Equipment specification
- Target metrics with absolute/percentage/zone-based values
- Optional notes for trainer instructions

### API Integration
All endpoints maintain backward compatibility while adding interval program support:
- Existing workout creation/update flows work unchanged
- Interval programs are optional additions
- Conversion endpoint allows migration from interval format to exercise format

### Validation
DTOs use class-validator decorators for:
- Type safety
- Range validation (durations, heart rates, etc.)
- Required field enforcement
- Nested object validation

## 📝 Next Steps

### Calendar Integration (In Progress)
- Add intervalProgram field to calendar event metadata
- Display interval workout preview in calendar
- Show equipment requirements and personalized targets

### Statistics Integration (Pending)
- Create `CardioWorkoutExecution` entity
- Track interval completion and performance
- Generate progress reports
- Integrate with existing analytics

### Frontend Integration
- Connect ConditioningWorkoutBuilder to new API endpoints
- Implement real-time interval display in TrainingSessionViewer
- Add interval program support to calendar views

## 🚀 Usage Example

### Creating a Conditioning Workout
```bash
POST /api/training/sessions
{
  "title": "Morning HIIT Session",
  "type": "CARDIO",
  "scheduledDate": "2025-01-15T09:00:00Z",
  "location": "Gym",
  "teamId": "team-123",
  "playerIds": ["player-1", "player-2"],
  "estimatedDuration": 30,
  "intervalProgram": {
    "name": "20-Min HIIT",
    "equipment": "rowing",
    "totalDuration": 1200,
    "estimatedCalories": 250,
    "intervals": [
      {
        "id": "1",
        "type": "warmup",
        "duration": 300,
        "equipment": "rowing",
        "targetMetrics": {
          "heartRate": {
            "type": "percentage",
            "value": 60,
            "reference": "max"
          }
        }
      },
      // ... more intervals
    ]
  }
}
```

### Converting Interval Program
```bash
POST /api/training/sessions/conditioning/convert
{
  "intervalProgram": { /* interval program object */ }
}
```

Returns exercises array compatible with legacy workout format.

## 🎯 Benefits
- **Scalability**: JSONB storage allows complex interval structures without schema changes
- **Flexibility**: Supports various equipment types and metric targets
- **Compatibility**: Maintains backward compatibility with existing workout system
- **Performance**: Leverages existing caching infrastructure

This backend implementation provides a solid foundation for the conditioning workout builder feature, enabling trainers to create sophisticated interval-based training programs at scale.