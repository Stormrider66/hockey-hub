# Player Wellness API Documentation

## Overview

The Player Wellness API provides comprehensive endpoints for tracking and managing player wellness, readiness, and training metrics. This API is designed to support the Physical Trainer dashboard's Player Status tab functionality.

## Base URL

```
http://localhost:3004/api/training
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Required Permissions

- **Physical Trainer**: Full access to all endpoints
- **Coach**: Read access for their team's players
- **Player**: Read access to their own wellness data only

## Endpoints

### 1. Get Team Player Status

**Endpoint**: `GET /api/training/player-status`

**Description**: Retrieves readiness status and wellness overview for all players in a team.

**Query Parameters**:
- `teamId` (required): Team ID to get player status for

**Authorization**: `training.read`, `team.read`, or `player.read` permission required

**Response**:
```json
{
  "success": true,
  "data": {
    "teamId": "team-1",
    "teamName": "Team Alpha",
    "players": [
      {
        "playerId": "player-1",
        "playerName": "Sidney Crosby",
        "avatarUrl": "/avatars/crosby.jpg",
        "readinessScore": 85,
        "status": "limited",
        "lastSessionDate": "2025-01-20T10:00:00Z",
        "nextSessionDate": "2025-01-23T14:00:00Z",
        "trainingLoad": {
          "currentWeek": 450,
          "previousWeek": 520,
          "change": -13.5,
          "status": "deload"
        },
        "wellness": {
          "sleep": 7,
          "stress": 4,
          "energy": 8,
          "soreness": 6,
          "mood": 8,
          "lastUpdated": "2025-01-22T08:00:00Z"
        },
        "medical": {
          "hasActiveInjury": true,
          "injuryType": "Lower back strain",
          "returnDate": "2025-01-28T00:00:00Z",
          "restrictions": ["No heavy lifting", "Modified skating drills"]
        }
      }
    ],
    "teamAverages": {
      "readinessScore": 85,
      "trainingLoad": 480,
      "wellnessScores": {
        "sleep": 7.3,
        "stress": 4.2,
        "energy": 7.8,
        "soreness": 4.5,
        "mood": 7.9
      }
    },
    "alerts": {
      "highRisk": ["player-5"],
      "injured": ["player-1", "player-2"],
      "overloaded": [],
      "wellnessDecline": ["player-5"]
    }
  },
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

### 2. Get Player Wellness Detail

**Endpoint**: `GET /api/training/player-wellness/{playerId}`

**Description**: Retrieves detailed wellness metrics and history for a specific player.

**Path Parameters**:
- `playerId` (required): Player ID to get wellness data for

**Authorization**: `training.read` or `player.read` permission required

**Response**:
```json
{
  "success": true,
  "data": {
    "playerId": "player-1",
    "playerName": "Sidney Crosby",
    "avatarUrl": "/avatars/crosby.jpg",
    "currentWellness": {
      "sleep": 7,
      "stress": 4,
      "energy": 8,
      "soreness": 6,
      "mood": 8,
      "notes": "Back feeling better today, good energy levels",
      "submittedAt": "2025-01-22T08:00:00Z"
    },
    "wellnessHistory": [
      {
        "date": "2025-01-21",
        "sleep": 6.5,
        "stress": 5.0,
        "energy": 7.5,
        "soreness": 7.0,
        "mood": 7.0,
        "average": 6.8
      }
    ],
    "trends": {
      "sleep": "stable",
      "stress": "improving",
      "energy": "improving",
      "soreness": "declining",
      "mood": "stable",
      "overall": "stable"
    },
    "recommendations": [
      "Continue current recovery protocol",
      "Monitor back strain symptoms",
      "Consider additional sleep optimization"
    ],
    "medicalNotes": "Lower back strain - cleared for light training. Avoid heavy lifting."
  },
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

### 3. Get Player Training Metrics

**Endpoint**: `GET /api/training/player-metrics/{playerId}`

**Description**: Retrieves comprehensive training metrics including HRV, power output, and recovery data.

**Path Parameters**:
- `playerId` (required): Player ID to get training metrics for

**Authorization**: `training.read` or `player.read` permission required

**Response**:
```json
{
  "success": true,
  "data": {
    "playerId": "player-1",
    "playerName": "Sidney Crosby",
    "avatarUrl": "/avatars/crosby.jpg",
    "hrVariability": {
      "current": 35,
      "baseline": 42,
      "trend": "declining",
      "readiness": "caution",
      "history": [
        {
          "date": "2025-01-21",
          "value": 37.2
        }
      ]
    },
    "powerOutput": {
      "peak": 1180,
      "average": 820,
      "threshold": 780,
      "trend": "stable",
      "history": [
        {
          "date": "2025-01-21",
          "peak": 1200,
          "average": 830
        }
      ]
    },
    "recovery": {
      "score": 72,
      "sleepHours": 7.2,
      "restingHR": 52,
      "trend": "stable",
      "recommendations": [
        "Increase sleep duration to 8+ hours",
        "Continue current recovery protocols"
      ],
      "history": [
        {
          "date": "2025-01-21",
          "score": 75
        }
      ]
    },
    "trainingLoad": {
      "acute": 450,
      "chronic": 520,
      "ratio": 0.87,
      "status": "deload",
      "recommendations": [
        "Continue reduced training load",
        "Focus on recovery and regeneration"
      ],
      "history": [
        {
          "date": "2025-01-21",
          "load": 460
        }
      ]
    },
    "performance": {
      "vo2Max": 58.2,
      "lactateThreshold": 4.1,
      "maxHR": 185,
      "restingHR": 52,
      "bodyComposition": {
        "weight": 89.5,
        "bodyFat": 8.2,
        "muscleMass": 42.1
      },
      "testResults": [
        {
          "test": "VO2 Max",
          "value": 58.2,
          "date": "2025-01-15",
          "percentile": 85
        }
      ]
    }
  },
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

### 4. Create Wellness Entry

**Endpoint**: `POST /api/training/player-wellness`

**Description**: Creates a new wellness entry for a player.

**Authorization**: `training.create` or `wellness.create` permission required

**Request Body**:
```json
{
  "playerId": "player-1",
  "sleep": 8,
  "stress": 3,
  "energy": 8,
  "soreness": 4,
  "mood": 8,
  "notes": "Feeling great today, ready for training"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Wellness entry created successfully",
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

### 5. Update Training Metrics

**Endpoint**: `PUT /api/training/player-metrics`

**Description**: Updates training metrics for a player (Physical Trainer only).

**Authorization**: Physical Trainer role required

**Request Body**:
```json
{
  "playerId": "player-1",
  "hrVariability": 42,
  "restingHR": 48,
  "sleepHours": 8.5,
  "trainingLoad": 520,
  "notes": "Excellent recovery metrics after rest day"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Training metrics updated successfully",
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

### 6. Get Batch Wellness Summary

**Endpoint**: `POST /api/training/player-wellness/batch`

**Description**: Retrieves wellness summary for multiple players (useful for dashboard views).

**Authorization**: `training.read` or `team.read` permission required

**Request Body**:
```json
{
  "playerIds": ["player-1", "player-2", "player-3"]
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "playerId": "player-1",
      "playerName": "Sidney Crosby",
      "currentWellness": {
        "sleep": 7,
        "stress": 4,
        "energy": 8,
        "soreness": 6,
        "mood": 8
      },
      "overallTrend": "stable",
      "alertLevel": "normal"
    }
  ],
  "timestamp": "2025-01-22T10:30:00Z",
  "mock": true
}
```

## Data Models

### Player Status
- `readinessScore`: 1-100 overall readiness score
- `status`: ready | limited | injured | resting
- `trainingLoad`: Current and previous week training load with percentage change
- `wellness`: Sleep, stress, energy, soreness, mood (1-10 scale)
- `medical`: Active injury information and restrictions

### Training Metrics
- `hrVariability`: Current HRV vs baseline with readiness assessment
- `powerOutput`: Peak, average, and threshold power values
- `recovery`: Recovery score, sleep hours, resting HR
- `trainingLoad`: Acute/chronic load ratio with status assessment
- `performance`: VO2 max, lactate threshold, body composition

### Wellness Trends
- `improving`: Metric trending positively over time
- `stable`: Metric maintaining consistent values
- `declining`: Metric showing negative trend

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional error details (development only)",
  "timestamp": "2025-01-22T10:30:00Z"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Mock Data

Currently, all endpoints return mock data for development purposes. The `mock: true` field in responses indicates this. In production, this would be replaced with real database queries and calculations.

### Mock Player Data Includes:
- Sidney Crosby (injured - lower back strain)
- Nathan MacKinnon (limited - shoulder inflammation)
- Connor McDavid (ready - excellent metrics)
- Alex Ovechkin (ready - good performance)
- Leon Draisaitl (resting - high fatigue)
- David Pastrnak (ready - optimal status)

## Integration Notes

### Frontend Integration
These endpoints are designed to work with the Physical Trainer dashboard's Player Status tab components:

- `PlayerStatusGrid.tsx`: Uses team player status endpoint
- `PlayerWellnessModal.tsx`: Uses player wellness detail endpoint
- `PlayerMetricsModal.tsx`: Uses player training metrics endpoint
- `WellnessEntryForm.tsx`: Uses create wellness entry endpoint

### Database Schema (Future Implementation)
The service is structured to support future database integration with tables for:
- `player_wellness_entries`: Daily wellness submissions
- `player_training_metrics`: Training load and performance data
- `player_readiness_scores`: Calculated readiness assessments
- `player_medical_status`: Injury and restriction tracking

### Calculation Logic (Future Implementation)
Production implementation would include:
- HRV-based readiness algorithms
- Training load periodization calculations
- Wellness trend analysis
- Medical restriction impact assessment
- Performance prediction models

## Testing

Run the test suite:

```bash
cd services/training-service
npm test -- playerWellnessRoutes.test.ts
```

The test suite covers:
- All endpoint functionality
- Authentication and authorization
- Input validation
- Error handling
- Mock data responses