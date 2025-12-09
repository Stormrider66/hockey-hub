# Workout Type System Documentation

## Overview

The Workout Type System provides a comprehensive framework for managing different types of workouts in the Hockey Hub training service. It supports 10 distinct workout categories, each with specific configurations for metrics, equipment, progression models, and safety protocols.

## Workout Types

### 1. STRENGTH
- **Focus**: Building muscle strength and power through resistance exercises
- **Primary Metrics**: weight, reps, sets
- **Key Equipment**: barbell, dumbbells, bench
- **Safety Focus**: Proper form, progressive loading, 48-hour recovery

### 2. CARDIO
- **Focus**: Improve cardiovascular endurance and aerobic capacity
- **Primary Metrics**: duration, distance, heartRate
- **Equipment**: Optional (treadmill, bike, rower)
- **Safety Focus**: Gradual progression, heart rate monitoring

### 3. AGILITY
- **Focus**: Enhance speed, coordination, and change of direction
- **Primary Metrics**: time, reps, errors
- **Key Equipment**: cones, markers, agility ladder
- **Safety Focus**: Surface check, proper footwear, landing mechanics

### 4. FLEXIBILITY
- **Focus**: Improve range of motion and muscle elasticity
- **Primary Metrics**: duration, range, holdTime
- **Key Equipment**: mat, foam roller (optional)
- **Safety Focus**: No bouncing, warm muscles, gradual progression

### 5. POWER
- **Focus**: Develop explosive strength and speed
- **Primary Metrics**: weight, reps, velocity
- **Key Equipment**: barbell, platform, medicine ball
- **Safety Focus**: Proper technique, 72-hour recovery

### 6. ENDURANCE
- **Focus**: Build stamina and sustained performance capacity
- **Primary Metrics**: duration, distance, heartRate
- **Equipment**: GPS watch, heart rate monitor (optional)
- **Safety Focus**: Recovery days, nutrition, sleep quality

### 7. RECOVERY
- **Focus**: Active recovery and regeneration sessions
- **Primary Metrics**: duration, intensity, heartRate
- **Equipment**: foam roller, massage gun (optional)
- **Safety Focus**: Listen to body, avoid overexertion

### 8. REHABILITATION
- **Focus**: Injury recovery and corrective exercise programs
- **Primary Metrics**: painLevel, rangeOfMotion, reps
- **Key Equipment**: resistance bands, balance pad
- **Safety Focus**: Medical guidance, pain-free movement

### 9. SPORT_SPECIFIC
- **Focus**: Hockey-specific skills and conditioning
- **Primary Metrics**: shotSpeed, accuracy, time
- **Key Equipment**: stick, pucks, ice/surface
- **Safety Focus**: Equipment check, fatigue management

### 10. MENTAL
- **Focus**: Cognitive and psychological performance enhancement
- **Primary Metrics**: duration, focusScore, stressLevel
- **Equipment**: meditation app, journal (optional)
- **Safety Focus**: Professional guidance if needed

## API Endpoints

### Initialize Default Configurations
```
POST /api/v1/training/workout-types/initialize
```

### Get All Configurations
```
GET /api/v1/training/workout-types
Query params: page, limit, workoutType, isActive
```

### Get Specific Configuration
```
GET /api/v1/training/workout-types/{workoutType}
```

### Create Custom Configuration
```
POST /api/v1/training/workout-types
Body: CreateWorkoutTypeConfigDto
```

### Update Configuration
```
PUT /api/v1/training/workout-types/{workoutType}
Body: UpdateWorkoutTypeConfigDto
```

### Delete Configuration
```
DELETE /api/v1/training/workout-types/{workoutType}
```

### Validate Metrics
```
POST /api/v1/training/workout-types/{workoutType}/validate-metrics
Body: { metrics: {...} }
```

### Get Progression Recommendations
```
GET /api/v1/training/workout-types/{workoutType}/progression/{level}
Levels: beginner, intermediate, advanced, elite
```

### Get Statistics
```
GET /api/v1/training/workout-types/statistics
```

## Configuration Structure

Each workout type configuration includes:

1. **Metrics Configuration**
   - Primary metrics (required)
   - Secondary metrics (optional)
   - Calculated metrics with formulas

2. **Equipment Requirements**
   - Required equipment
   - Alternatives for each required item
   - Optional equipment

3. **Progression Models**
   - Four levels: beginner, intermediate, advanced, elite
   - Duration for each level
   - Focus areas and goals

4. **Safety Protocols**
   - Warmup/cooldown requirements
   - Contraindications
   - Injury prevention strategies
   - Maximum intensity levels
   - Recovery time requirements

## Integration Points

1. **SessionTemplate**: Uses WorkoutType enum for categorizing templates
2. **WorkoutSession**: Assigns a WorkoutType to each session
3. **WorkoutAssignment**: Can specify workoutType for assignments
4. **ExerciseTemplate**: Can be linked to specific workout types

## Usage Examples

### Creating a Workout Session with Type
```typescript
const session = {
  title: "Strength Training Session",
  type: WorkoutType.STRENGTH,
  exercises: [...],
  // other properties
};
```

### Validating Metrics for a Workout
```typescript
const metrics = {
  weight: 100,
  reps: 10,
  sets: 3
};

const validation = await workoutTypeService.validateMetrics(
  organizationId, 
  WorkoutType.STRENGTH, 
  metrics
);
```

### Getting Progression Recommendations
```typescript
const recommendations = await workoutTypeService.getProgressionRecommendations(
  organizationId,
  WorkoutType.CARDIO,
  'intermediate'
);
```

## Best Practices

1. **Initialize Defaults**: Always initialize default configurations for new organizations
2. **Validate Metrics**: Use the validation endpoint before saving workout data
3. **Follow Progressions**: Use the progression models to guide athlete development
4. **Respect Safety**: Always adhere to safety protocols for each workout type
5. **Track Usage**: Monitor usage statistics to understand training patterns

## Migration Notes

When migrating existing data:
1. Map old workout types to new enum values
2. Initialize default configurations for all organizations
3. Update existing sessions and templates with proper workout types
4. Validate all metric data against new configurations