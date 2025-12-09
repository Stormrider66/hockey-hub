# Medical Analytics API Specification

**Version**: 1.0  
**Created**: January 22, 2025  
**Purpose**: Backend API specification for Physical Trainer Medical Analytics

## Overview

The Medical Analytics API provides comprehensive medical data aggregation and analytics for physical trainers to monitor player health, injury patterns, and recovery progress. This API extends the existing medical service with analytics capabilities.

## Base URL

```
http://localhost:3005/api/medical-analytics
```

## Authentication

All endpoints require JWT authentication with `physical_trainer` role (already implemented in medical service authorization).

## Endpoints

### 1. Team Medical Overview

**Endpoint**: `GET /team/{teamId}/overview`

**Purpose**: Get comprehensive medical statistics for a team

**Parameters**:
- `teamId` (path): Team identifier
- `dateRange` (query, optional): "7d", "30d", "90d", "1y" (default: "30d")

**Response**:
```json
{
  "teamId": "team-001",
  "period": "30d",
  "totalPlayers": 23,
  "healthyPlayers": 18,
  "limitedPlayers": 3,
  "injuredPlayers": 2,
  "averageRiskScore": 34.5,
  "monthlyTrend": "+8.5%",
  "criticalAlertsCount": 2,
  "recentInjuries": [
    {
      "playerId": "player-5",
      "playerName": "Sidney Crosby",
      "injuryType": "Concussion",
      "date": "2025-01-15",
      "severity": "high",
      "expectedReturn": "2025-02-15"
    }
  ],
  "riskDistribution": {
    "low": 15,
    "moderate": 6,
    "high": 2,
    "critical": 0
  }
}
```

**Business Logic**:
- Aggregate injury data from last 30 days
- Calculate risk scores based on injury history, load, and recovery
- Determine trend by comparing with previous period
- Count critical alerts (high-risk players, overdue recoveries)

### 2. Injury Trend Analysis

**Endpoint**: `GET /injury-trends`

**Purpose**: Analyze injury patterns and trends

**Parameters**:
- `teamId` (query): Team identifier
- `period` (query): "season", "6months", "1year" (default: "season")
- `groupBy` (query): "bodyPart", "injuryType", "month" (default: "bodyPart")

**Response**:
```json
{
  "period": "season",
  "totalInjuries": 45,
  "trendsData": [
    {
      "category": "Groin",
      "count": 8,
      "percentage": 17.8,
      "trend": "+12%",
      "severity": "moderate",
      "averageRecoveryDays": 21
    },
    {
      "category": "Knee",
      "count": 6,
      "percentage": 13.3,
      "trend": "-5%",
      "severity": "high",
      "averageRecoveryDays": 42
    }
  ],
  "monthlyDistribution": [
    {
      "month": "2024-09",
      "count": 8,
      "severity": "moderate"
    }
  ],
  "preventionRecommendations": [
    "Increase groin strengthening exercises",
    "Implement knee injury prevention protocol"
  ]
}
```

### 3. Recovery Analytics

**Endpoint**: `GET /recovery`

**Purpose**: Track recovery progress and outcomes

**Parameters**:
- `teamId` (query): Team identifier
- `status` (query): "active", "completed", "overdue" (optional)
- `playerId` (query, optional): Specific player

**Response**:
```json
{
  "activeRecoveries": 5,
  "completedRecoveries": 12,
  "overdueRecoveries": 1,
  "averageRecoveryTime": 28.5,
  "recoveryPlans": [
    {
      "playerId": "player-3",
      "playerName": "Nathan MacKinnon",
      "injuryType": "Muscle Strain",
      "phase": "Phase 2 - Strengthening",
      "progress": 65,
      "expectedReturn": "2025-02-01",
      "daysRemaining": 10,
      "status": "on_track",
      "nextMilestone": "Return to skating"
    }
  ],
  "recoveryStats": {
    "onTrack": 3,
    "ahead": 1,
    "behind": 1,
    "completed": 12
  }
}
```

### 4. Medical Alerts

**Endpoint**: `GET /alerts`

**Purpose**: Get active medical alerts and warnings

**Parameters**:
- `teamId` (query): Team identifier
- `severity` (query): "low", "medium", "high", "critical" (optional)
- `limit` (query): Number of alerts (default: 20)

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "playerId": "player-7",
      "playerName": "Connor McDavid",
      "type": "high_load_warning",
      "severity": "medium",
      "title": "High Training Load Detected",
      "description": "Player has exceeded recommended training load for 3 consecutive days",
      "createdAt": "2025-01-22T10:30:00Z",
      "recommendations": [
        "Reduce training intensity by 20%",
        "Schedule recovery session"
      ],
      "isActive": true,
      "requiresAction": true
    }
  ],
  "summary": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 8
  }
}
```

### 5. Player Risk Prediction

**Endpoint**: `GET /prediction/{playerId}`

**Purpose**: AI-powered injury risk prediction for individual players

**Parameters**:
- `playerId` (path): Player identifier
- `horizon` (query): "7d", "30d", "season" (default: "30d")

**Response**:
```json
{
  "playerId": "player-10",
  "playerName": "Erik Karlsson",
  "riskScore": 72,
  "riskLevel": "moderate",
  "predictions": {
    "injuryProbability": 0.23,
    "fatigueRisk": 0.68,
    "performanceDecline": 0.31
  },
  "riskFactors": [
    {
      "factor": "High training load",
      "impact": 0.35,
      "trend": "increasing"
    },
    {
      "factor": "Previous injury history",
      "impact": 0.28,
      "trend": "stable"
    }
  ],
  "recommendations": [
    "Implement load management protocol",
    "Schedule preventive physiotherapy session"
  ],
  "modelConfidence": 0.84
}
```

### 6. Recovery Tracking

**Endpoint**: `GET /recovery-tracking`

**Purpose**: Detailed recovery milestone tracking

**Parameters**:
- `teamId` (query): Team identifier
- `status` (query): "active", "completed" (optional)

**Response**:
```json
{
  "recoveryPrograms": [
    {
      "id": "recovery-001",
      "playerId": "player-3",
      "injuryId": "injury-123",
      "phases": [
        {
          "phase": 1,
          "name": "Rest and Protection",
          "status": "completed",
          "completedDate": "2025-01-10",
          "milestones": [
            "Pain reduction achieved",
            "Swelling controlled"
          ]
        },
        {
          "phase": 2,
          "name": "Strengthening",
          "status": "active",
          "progress": 65,
          "expectedCompletion": "2025-01-30",
          "milestones": [
            "Range of motion restored (completed)",
            "Strength at 80% (in progress)"
          ]
        }
      ],
      "overallProgress": 65,
      "estimatedReturn": "2025-02-15"
    }
  ]
}
```

### 7. Return-to-Play Protocols

**Endpoint**: `GET /return-to-play`

**Purpose**: Manage return-to-play protocols and clearances

**Parameters**:
- `teamId` (query): Team identifier
- `status` (query): "pending", "cleared", "restricted" (optional)

**Response**:
```json
{
  "protocols": [
    {
      "playerId": "player-5",
      "playerName": "Sidney Crosby",
      "injuryType": "Concussion",
      "protocol": "NHL Concussion Protocol",
      "currentStage": 4,
      "totalStages": 6,
      "stages": [
        {
          "stage": 1,
          "name": "Symptom-free at rest",
          "status": "completed",
          "completedDate": "2025-01-18"
        },
        {
          "stage": 4,
          "name": "Non-contact training drills",
          "status": "active",
          "requirements": [
            "Complete light skating without symptoms",
            "Pass cognitive assessment"
          ]
        }
      ],
      "restrictions": [
        "No contact activities",
        "Monitor for symptoms"
      ],
      "medicalClearance": "pending",
      "estimatedClearance": "2025-02-01"
    }
  ]
}
```

### 8. Generate Reports

**Endpoint**: `POST /reports/generate`

**Purpose**: Generate comprehensive medical reports

**Request Body**:
```json
{
  "type": "team_summary",
  "teamId": "team-001",
  "period": "30d",
  "format": "pdf",
  "includeGraphs": true,
  "sections": [
    "overview",
    "injury_trends",
    "recovery_progress",
    "recommendations"
  ]
}
```

**Response**:
```json
{
  "reportId": "report-001",
  "status": "generating",
  "estimatedCompletion": "2025-01-22T11:00:00Z",
  "downloadUrl": null
}
```

### 9. Resolve Alert

**Endpoint**: `POST /alerts/{alertId}/resolve`

**Purpose**: Mark medical alert as resolved

**Request Body**:
```json
{
  "resolution": "Load reduced, recovery session scheduled",
  "actionTaken": "modified_training_plan",
  "resolvedBy": "trainer-001"
}
```

**Response**:
```json
{
  "alertId": "alert-001",
  "status": "resolved",
  "resolvedAt": "2025-01-22T10:45:00Z",
  "resolution": "Load reduced, recovery session scheduled"
}
```

### 10. Update Recovery Tracking

**Endpoint**: `PUT /recovery-tracking/{trackingId}`

**Purpose**: Update recovery milestone progress

**Request Body**:
```json
{
  "phase": 2,
  "progress": 75,
  "completedMilestones": [
    "Range of motion restored",
    "Strength at 80%"
  ],
  "notes": "Player responding well to strengthening protocol",
  "estimatedCompletion": "2025-01-25"
}
```

## Data Aggregation Requirements

### Injury Risk Calculation
```sql
-- Risk score calculation based on:
-- 1. Recent injury history (weight: 40%)
-- 2. Current training load (weight: 30%)
-- 3. Recovery status (weight: 20%)
-- 4. Performance metrics (weight: 10%)

SELECT 
  p.id as player_id,
  (
    (COALESCE(recent_injuries.score, 0) * 0.4) +
    (COALESCE(training_load.score, 0) * 0.3) +
    (COALESCE(recovery.score, 0) * 0.2) +
    (COALESCE(performance.score, 0) * 0.1)
  ) as risk_score
FROM players p
LEFT JOIN (...) as recent_injuries ON p.id = recent_injuries.player_id
LEFT JOIN (...) as training_load ON p.id = training_load.player_id
-- ... additional joins
```

### Trend Analysis
```sql
-- Monthly injury trend calculation
SELECT 
  DATE_TRUNC('month', created_at) as month,
  body_part,
  COUNT(*) as injury_count,
  AVG(recovery_days) as avg_recovery,
  LAG(COUNT(*)) OVER (PARTITION BY body_part ORDER BY DATE_TRUNC('month', created_at)) as prev_count
FROM injuries 
WHERE team_id = $1 
  AND created_at >= $2
GROUP BY month, body_part
ORDER BY month DESC;
```

## Implementation Priority

1. **High Priority**: Team overview, alerts, recovery tracking
2. **Medium Priority**: Injury trends, predictions, return-to-play
3. **Low Priority**: Report generation, advanced analytics

## Dependencies

- Existing medical service endpoints
- Statistics service for trend calculations
- Notification service for alerts
- Report generation service (future)

## Security Considerations

- Ensure HIPAA compliance for medical data
- Implement audit logging for data access
- Encrypt sensitive medical information
- Role-based access control (physical trainers read-only)

---

This specification provides the foundation for implementing comprehensive medical analytics capabilities that will enable physical trainers to make data-driven decisions about player health and injury prevention.