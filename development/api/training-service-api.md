# Hockey App - Training Service API Contract (OpenAPI 3.0)

## Overview

This document defines the API contract for the Training Service in the Hockey App platform. The Training Service is responsible for managing training programs, individual training sessions, exercises, physical tests, and real-time session execution.

**Service Base URL**: `/api/v1` (prefixed with gateway URL)
**Service Port**: 3003 (Example Port)

## Authentication

Secured endpoints require a valid JWT token obtained from the User Service, included in the Authorization header (Bearer scheme). WebSocket connections will also require authentication, potentially via an initial upgrade request or a token passed during connection setup.

### Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from the /auth/login endpoint
```

## API Endpoints

Endpoints require `bearerAuth` security unless otherwise specified.

### Training Programs

#### POST /training/programs
Create a new training program.
*Requires Role: Coach, Physio, Admin*
**Request Body:** (Details of program structure, exercises, etc.)
**Response (201 Created):** Program object.

#### GET /training/programs
List available training programs (accessible by user). Supports filtering.
**Parameters:** `category`, `targetGroup`, `search`
**Response (200 OK):** Array of Program objects.

#### GET /training/programs/{programId}
Get details of a specific training program.
**Response (200 OK):** Program object.

#### PUT /training/programs/{programId}
Update an existing training program.
*Requires Role: Coach, Physio, Admin (if owner)*
**Request Body:** Updated program details.
**Response (200 OK):** Updated Program object.

#### DELETE /training/programs/{programId}
Delete a training program.
*Requires Role: Coach, Physio, Admin (if owner)*
**Response (204 No Content):**

### Training Sessions

#### POST /training/sessions
Schedule a new training session (can link to a program or be ad-hoc).
*Requires Role: Coach, Physio, Admin*
**Request Body:** (Details: type, teamId, programId, exercises, time, locationId, notes)
**Response (201 Created):** Session object.

#### GET /training/sessions
List training sessions (filtered by user access, team, date range).
**Parameters:** `teamId`, `userId`, `startDate`, `endDate`, `status`
**Response (200 OK):** Array of Session objects.

#### GET /training/sessions/{sessionId}
Get details of a specific training session.
**Response (200 OK):** Session object including exercises and participant status.

#### PUT /training/sessions/{sessionId}
Update an existing training session.
*Requires Role: Coach, Physio, Admin (if owner)*
**Request Body:** Updated session details.
**Response (200 OK):** Updated Session object.

#### DELETE /training/sessions/{sessionId}
Cancel/delete a training session.
*Requires Role: Coach, Physio, Admin (if owner)*
**Response (204 No Content):**

#### POST /training/sessions/{sessionId}/complete
Mark a training session as completed. Can include results/notes.
*Requires Role: Coach, Physio, Admin*
**Request Body:** (Optional: results, notes)
**Response (200 OK):** Updated Session object.

### Exercises

#### GET /training/exercises
List available exercises (global or organization-specific). Supports filtering.
**Parameters:** `category`, `muscleGroup`, `equipment`, `search`
**Response (200 OK):** Array of Exercise objects.

#### POST /training/exercises
Create a new exercise (for organization).
*Requires Role: Physio, Admin*
**Request Body:** (Details: name, description, category, videoUrl, instructions)
**Response (201 Created):** Exercise object.

#### GET /training/exercises/{exerciseId}
Get details of a specific exercise.
**Response (200 OK):** Exercise object.

### Physical Tests

#### GET /training/tests
List available physical test types.
**Response (200 OK):** Array of TestType objects.

#### POST /training/tests/results
Submit results for a physical test for one or more players.
*Requires Role: Coach, Physio, Admin*
**Request Body:** (Details: testTypeId, date, results: [{playerId, value, notes}])
**Response (201 Created):** Confirmation or submitted Result objects.

#### GET /training/tests/results
Get test results (filtered by player, test type, date range).
**Parameters:** `playerId`, `testTypeId`, `startDate`, `endDate`
**Response (200 OK):** Array of TestResult objects.

### Live Training Session View (Group View)

#### GET /training/sessions/{sessionId}/live/state
Get the initial state for the live training session view (team, players, program/intervals).
*Requires Role: Coach, Physio*
**Response (200 OK):** LiveSessionState object (players, current interval, status).

#### POST /training/sessions/{sessionId}/live/start
Start the live training session. Initiates WebSocket updates.
*Requires Role: Coach, Physio*
**Response (200 OK):** { status: 'started' }

#### POST /training/sessions/{sessionId}/live/pause
Pause the live training session.
*Requires Role: Coach, Physio*
**Response (200 OK):** { status: 'paused' }

#### POST /training/sessions/{sessionId}/live/resume
Resume a paused live training session.
*Requires Role: Coach, Physio*
**Response (200 OK):** { status: 'resumed' }

#### POST /training/sessions/{sessionId}/live/stop
Stop the live training session.
*Requires Role: Coach, Physio*
**Response (200 OK):** { status: 'stopped' }

#### POST /training/sessions/{sessionId}/live/next-interval
Manually advance to the next interval (if applicable).
*Requires Role: Coach, Physio*
**Response (200 OK):** { currentIntervalIndex: number }

#### WS /training/sessions/{sessionId}/live
WebSocket endpoint for real-time updates during a live session.
*Requires Role: Coach, Physio, Player (viewing own data)*
**Authentication:** Via initial HTTP upgrade request or token.
**Messages (Server -> Client):**
  - `session.status.update`: { status: 'started' | 'paused' | 'stopped' }
  - `interval.change`: { intervalIndex: number, type: 'work' | 'rest', duration: number, elapsed: number }
  - `interval.tick`: { intervalIndex: number, elapsed: number, remaining: number }
  - `player.data.update`: { playerId: string, heartRate?: number, watts?: number, zone?: string }
  - `player.joined`: { playerId: string, name: string }
  - `player.left`: { playerId: string }
**Messages (Client -> Server):**
  - (Potentially player actions like acknowledging readiness, though less common in group view)

## Data Models (Schemas)

```yaml
components:
  schemas:
    Program:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        category:
          type: string
          enum: ['Strength', 'Conditioning', 'Skill', 'Flexibility']
        targetGroup:
          type: string
          enum: ['Individual', 'Team', 'Position']
        exercises:
          type: array
          items:
            $ref: '#/components/schemas/ProgramExercise'
        # ... other fields: durationEstimate, createdBy, etc.

    ProgramExercise:
      type: object
      properties:
        exerciseId:
          type: string
          format: uuid
        sets:
          type: integer
        reps:
          type: string # e.g., "8-12" or "AMRAP"
        rest:
          type: integer # seconds
        notes:
          type: string
        # ... other fields: tempo, intensity, variations

    Session:
      type: object
      properties:
        id:
          type: string
          format: uuid
        type:
          type: string
          enum: ['Ice Training', 'Physical Training', 'Game Warmup', 'Recovery']
        teamId:
          type: string
          format: uuid
        programId:
          type: string
          format: uuid
          nullable: true
        date:
          type: string
          format: date-time
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        locationId:
          type: string
          format: uuid
          nullable: true
        status:
          type: string
          enum: ['Scheduled', 'InProgress', 'Completed', 'Canceled']
        participants:
          type: array
          items:
            $ref: '#/components/schemas/SessionParticipant'
        exercises: # Ad-hoc exercises if no program linked
          type: array
          items:
            $ref: '#/components/schemas/ProgramExercise'
        notes:
          type: string

    SessionParticipant:
      type: object
      properties:
        userId:
          type: string
          format: uuid
        status:
          type: string
          enum: ['Attended', 'Absent', 'Excused']
        notes:
          type: string

    Exercise:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        category:
          type: string
        muscleGroup:
          type: string
        equipment:
          type: string
        videoUrl:
          type: string
          format: url
        instructions:
          type: string

    TestType:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        unit:
          type: string # e.g., 'cm', 'kg', 'sec', 'reps'

    TestResult:
      type: object
      properties:
        id:
          type: string
          format: uuid
        testTypeId:
          type: string
          format: uuid
        playerId:
          type: string
          format: uuid
        date:
          type: string
          format: date
        value:
          type: number
        notes:
          type: string

    LiveSessionState:
      type: object
      properties:
        sessionId:
          type: string
          format: uuid
        status:
          type: string
          enum: ['idle', 'running', 'paused', 'stopped']
        currentIntervalIndex:
          type: integer
          nullable: true
        currentIntervalType:
          type: string
          enum: ['work', 'rest']
          nullable: true
        currentIntervalElapsed:
          type: number # seconds
          nullable: true
        currentIntervalDuration:
          type: number # seconds
          nullable: true
        players:
          type: array
          items:
            $ref: '#/components/schemas/LivePlayerData'

    LivePlayerData:
      type: object
      properties:
        playerId:
          type: string
          format: uuid
        name:
          type: string
        heartRate:
          type: integer
          nullable: true
        watts:
          type: integer
          nullable: true
        zone: # Calculated intensity zone
          type: string
          nullable: true
        programStep: # Current exercise/step for player if individual program view
          type: string
          nullable: true
``` 