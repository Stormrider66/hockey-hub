# Medical Integration Documentation

The Medical Integration system enables injury-aware workout management by synchronizing medical restrictions from the medical service and applying them to training sessions.

## Overview

The medical integration provides:
- **Restriction Synchronization**: Automatic sync of player medical restrictions
- **Compliance Checking**: Real-time validation of workout sessions against medical restrictions
- **Exercise Alternatives**: Smart generation of safe exercise alternatives
- **Medical Concerns**: Reporting system for training-related medical issues
- **Approval Workflows**: Medical staff approval for modified workouts

## Architecture

### Components

1. **MedicalIntegrationService**: Core service handling all medical integration logic
2. **Medical Integration Routes**: REST API endpoints for medical operations
3. **Medical DTOs**: Type-safe data transfer objects
4. **Database Entities**: Enhanced WorkoutPlayerOverride with medical fields
5. **Event System**: Real-time event handling for medical updates

### Data Flow

```
Medical Service → Training Service → Workout Modifications → Player Safety
      ↓                ↓                    ↓                    ↓
Restrictions → Compliance Check → Exercise Alternatives → Safe Training
```

## Key Features

### 1. Medical Restriction Synchronization

**Endpoint**: `POST /api/v1/training/medical-sync/restrictions`

Fetches active medical restrictions from the medical service and creates/updates workout overrides automatically.

**Features**:
- Organization-wide or team-specific sync
- Player-specific restriction filtering
- Automatic override creation based on restriction severity
- Cache invalidation for affected players

**Example**:
```json
{
  "organizationId": "org-123",
  "teamId": "team-456",
  "playerIds": ["player-789"],
  "includeExpired": false
}
```

### 2. Compliance Checking

**Endpoint**: `GET /api/v1/training/medical-sync/compliance/{sessionId}`

Validates workout sessions against player medical restrictions to ensure safety.

**Compliance Levels**:
- **Compliant**: No restrictions violated
- **Partial**: Minor restrictions, may proceed with modifications
- **Non-Compliant**: Major violations, requires approval
- **Not Applicable**: No active restrictions

**Violation Types**:
- **Movement**: Restricted movement patterns
- **Intensity**: Exceeds maximum exertion level
- **Duration**: Workout too long for condition
- **Supervision**: Requires medical supervision

### 3. Exercise Alternatives

**Endpoint**: `GET /api/v1/training/medical-sync/alternatives/{playerId}`

Generates safe exercise alternatives based on medical restrictions using intelligent matching algorithms.

**Alternative Generation**:
- **Safety First**: Excludes prohibited exercises
- **Smart Matching**: Finds similar exercises targeting same muscle groups
- **Load Adjustment**: Automatic intensity reduction based on restriction severity
- **Suitability Scoring**: Ranks alternatives by effectiveness (0-100%)

**Modification Types**:
- Load/intensity reduction
- Rest period increases
- Movement pattern changes
- Equipment alternatives
- Supervision requirements

### 4. Medical Concern Reporting

**Endpoint**: `POST /api/v1/training/medical-sync/report-concern`

Enables coaches, trainers, and players to report medical concerns during training.

**Concern Types**:
- **Injury**: New or recurring injuries
- **Discomfort**: Pain or discomfort during exercise
- **Fatigue**: Excessive fatigue or weakness
- **Technique**: Technical issues causing safety concerns
- **Other**: General medical concerns

**Severity Levels**:
- **Low**: Minor discomfort, monitoring recommended
- **Medium**: Moderate concern, may require modification
- **High**: Significant issue, immediate evaluation needed
- **Critical**: Emergency situation, stop activity immediately

### 5. Medical Override Management

**Endpoint**: `POST /api/v1/training/medical-sync/override`

Creates detailed medical overrides for workout assignments with specific modifications.

**Override Features**:
- **Automatic Approval**: Medical staff can auto-approve overrides
- **Detailed Modifications**: Specific exercise substitutions and load adjustments
- **Expiration Tracking**: Time-limited restrictions with automatic expiry
- **Progress Monitoring**: Track player progress through restrictions

## Medical Restriction Severity Mapping

| Severity | Load Reduction | Rest Increase | Typical Use Case |
|----------|----------------|---------------|------------------|
| **Mild** | 20% (0.8x) | 20% (1.2x) | Minor injuries, prevention |
| **Moderate** | 40% (0.6x) | 50% (1.5x) | Recovering injuries |
| **Severe** | 70% (0.3x) | 100% (2.0x) | Significant limitations |
| **Complete** | 100% (0x) | N/A | Complete rest required |

## Event System

The system listens to and emits various events for real-time updates:

### Incoming Events
- `medical.restriction.created`
- `medical.restriction.updated`
- `medical.restriction.cleared`
- `medical.injury.reported`

### Outgoing Events
- `training.medical.sync.completed`
- `training.medical.override.created`
- `training.medical.concern.reported`
- `training.medical.compliance.violation`

## API Usage Examples

### Sync Restrictions for Team
```bash
curl -X POST /api/v1/training/medical-sync/restrictions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123",
    "teamId": "team-456"
  }'
```

### Check Session Compliance
```bash
curl /api/v1/training/medical-sync/compliance/session-123?detailed=true \
  -H "Authorization: Bearer <token>"
```

### Get Exercise Alternatives
```bash
curl /api/v1/training/medical-sync/alternatives/player-123?workoutId=workout-456 \
  -H "Authorization: Bearer <token>"
```

### Report Medical Concern
```bash
curl -X POST /api/v1/training/medical-sync/report-concern \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player-123",
    "sessionId": "session-456",
    "concernType": "injury",
    "severity": "high",
    "description": "Player reported sharp knee pain during squats",
    "affectedBodyParts": ["knee"],
    "occurredAt": "2024-01-15T10:30:00Z"
  }'
```

## Database Schema

### Enhanced WorkoutPlayerOverride
The `WorkoutPlayerOverride` entity has been enhanced with medical-specific fields:

```typescript
{
  medicalRecordId: string;           // Link to medical service record
  medicalRestrictions: {            // Medical restriction details
    restrictionType: string;
    affectedBodyParts: string[];
    restrictedMovements: string[];
    maxExertionLevel: number;
    requiresSupervision: boolean;
    clearanceRequired: boolean;
    medicalNotes: string;
  };
  // ... existing fields
}
```

### New Tables
- **medical_sync_events**: Tracks medical event processing
- **medical_compliance_audits**: Audit trail for compliance checks
- **exercise_alternatives**: Pre-computed alternative exercise mappings

## Security & Permissions

### Required Permissions
- `medical:read` - View medical restrictions
- `medical:write` - Create/update medical overrides
- `training:read` - View training data
- `training:write` - Modify training assignments

### Role-Based Access
- **Medical Staff**: Full access to all medical integration features
- **Physical Trainers**: Create overrides (pending approval), check compliance
- **Coaches**: View compliance, report concerns
- **Players**: Report concerns only

## Performance & Caching

### Caching Strategy
- **Compliance Checks**: 5 minutes TTL
- **Exercise Alternatives**: 5 minutes TTL
- **Medical Restrictions**: Real-time (event-driven invalidation)

### Performance Optimizations
- Database indexes for medical queries
- Batch processing for bulk operations
- Asynchronous event processing
- Smart cache invalidation

## Monitoring & Alerts

### Health Checks
- Medical service connectivity
- Database performance
- Cache hit rates
- Event processing delays

### Alerts
- Compliance violations
- High-severity medical concerns
- Service synchronization failures
- Performance degradation

## Integration Testing

Run the medical integration tests:

```bash
cd services/training-service
npm test -- MedicalIntegrationService.test.ts
```

## Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check medical service connectivity
   - Verify authentication tokens
   - Review error logs for details

2. **Compliance False Positives**
   - Verify restriction dates and status
   - Check exercise template data
   - Review override configurations

3. **Performance Issues**
   - Monitor cache hit rates
   - Check database query performance
   - Review bulk operation sizes

### Debugging Tools

- **Health Endpoint**: `/api/v1/training/medical-sync/health`
- **Bulk Compliance**: Test multiple scenarios at once
- **Event Logs**: Review medical event processing
- **Cache Inspection**: Monitor cache performance

## Future Enhancements

- **ML-Powered Alternatives**: Machine learning for better exercise matching
- **Predictive Analytics**: Injury risk prediction based on training load
- **Mobile Integration**: Real-time alerts on mobile devices
- **Advanced Workflows**: Multi-step approval processes
- **Rehabilitation Tracking**: Progress monitoring for injury recovery