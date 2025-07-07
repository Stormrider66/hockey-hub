# Planning Service Integration

## Overview

The Planning Service Integration enables the Training Service to automatically adjust workout assignments based on seasonal training phases, load management, and periodization strategies. This integration provides automated training plan execution and real-time adaptations based on planning service recommendations.

## Key Features

### 1. Seasonal Phase Management
- **Preseason**: Base building and preparation
- **In-season**: Maintenance and performance optimization
- **Playoffs**: Peak performance and recovery balance
- **Offseason**: Recovery and development
- **Recovery**: Active recovery and regeneration

### 2. Automatic Workout Adjustments
- **Load Progression**: Automatically adjust training loads based on phase multipliers
- **Frequency Modification**: Adapt training frequency per season phase
- **Intensity Control**: Modify workout intensity based on phase requirements
- **Exercise Selection**: Adjust exercise selection based on phase focus areas

### 3. Real-time Event Handling
- Listen for phase changes from planning service
- Automatically apply adjustments to active assignments
- Handle workload threshold breaches
- Process load management recommendations

## Architecture

### Components

#### 1. PlanningIntegrationService
Main service class that handles all planning-related operations:
- Fetches current phases and season plans
- Applies phase-based adjustments
- Manages workload analytics
- Handles template applications

#### 2. PlanningEventListener
Event-driven component that responds to planning service events:
- Phase change events
- Season plan updates
- Workload threshold breaches
- Template application events

#### 3. Enhanced WorkoutAssignmentService
Extended with planning integration methods:
- Creates assignments with phase considerations
- Applies automatic phase adjustments
- Tracks planning metadata

### Data Flow

```
Planning Service → Event Bus → Training Service
                ↓
      PlanningEventListener
                ↓
   PlanningIntegrationService
                ↓
   WorkoutAssignmentService
                ↓
      Database Updates
```

## API Endpoints

### 1. Get Current Phase
```
GET /api/v1/training/planning/current-phase/{teamId}
```
Retrieves the current active training phase for a team.

### 2. Get Season Plan
```
GET /api/v1/training/planning/season-plan/{teamId}
```
Retrieves the complete season plan including all phases.

### 3. Sync Phase Adjustments
```
POST /api/v1/training/planning/sync-phase-adjustments
```
Applies phase-based adjustments to workout assignments.

### 4. Apply Phase Template
```
POST /api/v1/training/planning/apply-phase-template
```
Applies a predefined phase template to create workout assignments.

### 5. Get Workload Analytics
```
GET /api/v1/training/planning/workload-analytics
```
Retrieves workload analytics and player readiness data.

### 6. Notify Training Completion
```
POST /api/v1/training/planning/notify-completion
```
Notifies the planning service of training completion for workload tracking.

### 7. Get Sync Status
```
GET /api/v1/training/planning/sync-status/{teamId}
```
Checks sync status and performs automatic updates.

## Phase Adjustments

### Load Multipliers
- **Recovery**: 0.6x base load
- **Low**: 0.8x base load
- **Medium**: 1.0x base load (no change)
- **High**: 1.2x base load
- **Peak**: 1.4x base load

### Frequency Adjustments
Training frequency is automatically adjusted based on phase requirements:
- Preseason: Higher frequency for base building
- In-season: Balanced frequency with game schedule
- Playoffs: Reduced frequency, higher intensity
- Offseason: Flexible frequency
- Recovery: Minimal frequency

### Intensity Modifications
Heart rate zones and power targets are adjusted based on phase intensity levels.

## Event System

### Listening Events

#### Phase Change Event
```typescript
interface PlanningPhaseChangeEvent {
  teamId: string;
  oldPhaseId?: string;
  newPhaseId: string;
  phaseStartDate: Date;
  phaseEndDate: Date;
  autoApplyAdjustments: boolean;
  triggeredBy: string;
}
```

#### Season Plan Update Event
```typescript
interface SeasonPlanUpdateEvent {
  teamId: string;
  seasonPlanId: string;
  updatedPhases: string[];
  updateType: 'phase_added' | 'phase_modified' | 'phase_removed' | 'schedule_adjusted';
  triggeredBy: string;
}
```

#### Workload Threshold Event
```typescript
interface WorkloadThresholdEvent {
  teamId: string;
  playerId: string;
  thresholdType: 'high_load' | 'recovery_needed' | 'injury_risk';
  currentValue: number;
  thresholdValue: number;
  recommendedAdjustment: {
    type: 'reduce_load' | 'increase_recovery' | 'skip_training';
    magnitude: number;
  };
}
```

### Publishing Events

#### Assignment Phase Adjusted
```typescript
{
  assignmentId: string;
  teamId: string;
  playerId: string;
  phaseId: string;
  adjustmentTimestamp: Date;
}
```

#### Phase Adjustments Applied
```typescript
{
  teamId: string;
  phaseId: string;
  adjustmentsCount: number;
  triggeredBy: string;
  timestamp: Date;
}
```

## Database Schema Changes

### WorkoutAssignment Metadata
Extended the `metadata` JSONB field to include planning integration data:

```typescript
metadata: {
  // Existing fields...
  
  // Planning integration metadata
  planningPhaseId?: string;
  seasonPlanId?: string;
  lastPhaseAdjustment?: Date;
  phaseAdjustments?: Array<{
    adjustmentType: 'load' | 'frequency' | 'intensity' | 'exercise_selection';
    originalValue: any;
    adjustedValue: any;
    reason: string;
    appliedAt: Date;
    appliedBy: string;
  }>;
  originalPlanningData?: {
    baseLoad?: number;
    originalFrequency?: number;
    originalIntensity?: any;
  };
}
```

### Performance Indexes
Added specialized indexes for planning-related queries:
- GIN index on `planningPhaseId`
- GIN index on `seasonPlanId`
- BTREE index on `lastPhaseAdjustment`
- Partial index for assignments with planning data
- Composite index for team-phase-status queries

## Configuration

### Environment Variables
```
PLANNING_SERVICE_URL=http://localhost:3006
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=4
```

### Cache TTL Settings
- Current phase: 1 hour
- Season plan: 2 hours
- Workload analytics: 15 minutes

## Error Handling

### Graceful Degradation
The system continues to function even if the planning service is unavailable:
- Cached phase data is used when possible
- Assignments are created without phase adjustments
- Errors are logged but don't block operations

### Error Events
Failed operations emit error events for monitoring:
- `training.phase_change.error`
- `training.season_plan.sync_error`
- `training.workload_adjustment.error`

## Usage Examples

### Creating Assignment with Phase Integration
```typescript
const service = new WorkoutAssignmentService();
const assignment = await service.createAssignmentWithPlanningPhase(
  assignmentDto,
  userId,
  organizationId,
  teamId,
  playerId
);
```

### Bulk Assignment with Phase Adjustments
```typescript
const result = await service.bulkAssignWithPhaseAdjustments(
  bulkDto,
  userId,
  organizationId
);
console.log(`Created ${result.created} assignments with ${result.phaseAdjustments} adjustments`);
```

### Applying Phase Template
```typescript
const planningService = new PlanningIntegrationService(dataSource);
const result = await planningService.applyPhaseTemplate(
  teamId,
  templateId,
  {
    startDate: new Date(),
    customizations: {
      loadMultiplier: 1.2,
      trainingFrequency: 4
    }
  }
);
```

## Monitoring and Analytics

### Key Metrics
- Phase adjustment frequency
- Load modification percentages
- Player workload trends
- Assignment compliance rates
- Error rates and types

### Logging
All planning integration operations are logged with correlation IDs for traceability.

## Security Considerations

### Authentication
- All planning service communications use service-to-service authentication
- User context is preserved through the integration layer

### Data Validation
- All planning data is validated before application
- Malformed phase data is rejected with appropriate error messages

### Rate Limiting
- Planning service calls are rate-limited to prevent abuse
- Cache-first approach reduces external API calls

## Testing

### Unit Tests
- Service method testing with mocked planning service
- Event handler testing with mock events
- Database integration testing

### Integration Tests
- End-to-end phase adjustment workflows
- Event bus integration testing
- Planning service API integration

### Performance Tests
- Load testing with high-volume assignments
- Cache performance testing
- Database query optimization validation

## Deployment

### Database Migration
Run the planning integration migration:
```bash
npm run migration:run -- --migration=1736300000000-AddPlanningIntegrationMetadata
```

### Service Dependencies
Ensure the following services are running:
- Planning Service (port 3006)
- Redis Cache
- PostgreSQL Database

### Health Checks
The service includes health checks for:
- Planning service connectivity
- Cache availability
- Database connection
- Event bus status

## Future Enhancements

### Planned Features
1. **AI-Powered Adjustments**: Machine learning-based load recommendations
2. **Advanced Analytics**: Predictive workload modeling
3. **Multi-Sport Support**: Adaptation for different sports
4. **Recovery Optimization**: Advanced recovery planning integration
5. **Performance Prediction**: Outcome forecasting based on phase adherence

### API Versioning
The integration is designed to support future API versions while maintaining backward compatibility.

## Troubleshooting

### Common Issues

#### Planning Service Unavailable
- Check network connectivity
- Verify service health endpoints
- Review authentication credentials

#### Phase Adjustments Not Applied
- Check event bus connectivity
- Verify team has active season plan
- Review planning phase configuration

#### Performance Issues
- Monitor cache hit rates
- Check database query performance
- Review load balancing configuration

### Debug Mode
Enable debug logging:
```bash
export LOG_LEVEL=debug
```

This provides detailed information about planning integration operations and can help identify issues.