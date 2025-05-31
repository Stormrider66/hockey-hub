# Hockey App - Calendar Service API Contract (OpenAPI 3.0)

## Overview
The Calendar Service manages all time‑based events (training, games, meetings, travel, medical, etc.), bookable resources, and conflict detection.  This stub captures the initial endpoint set so other teams can begin integration and generate typed clients.  It will be expanded as implementation progresses.

**Service Base URL** : `/api/v1` (prefixed by the API Gateway)
**Service Port**     : `3003`

> Security: all endpoints below require `bearerAuth` (JWT) unless explicitly marked *public*.

### Security Schemes
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## API Endpoints

### Events

| Method & Path | Description | Required Role(s) |
|---------------|-------------|------------------|
| **POST** `/calendar/events` | Create a new calendar event (single or recurring) | coach, admin, club_admin |
| **GET** `/calendar/events` | List events (filter by team, date range, type, status) | authenticated user |
| **GET** `/calendar/events/{eventId}` | Retrieve event details | participant / staff |
| **PUT** `/calendar/events/{eventId}` | Update an existing event | creator or admin |
| **DELETE** `/calendar/events/{eventId}` | Cancel an event | creator or admin |
| **POST** `/calendar/events/{eventId}/duplicate` | Duplicate an event or series with new dates | coach, admin |

### Event Types
| Method & Path | Description | Role |
|---------------|-------------|------|
| **GET** `/calendar/event-types` | List system & org‑specific event types | any |
| **POST** `/calendar/event-types` | Create org‑specific event type | admin |
| **PUT** `/calendar/event-types/{typeId}` | Update event type | admin |
| **DELETE** `/calendar/event-types/{typeId}` | Remove custom event type | admin |

### Locations
| Method & Path | Description |
|---------------|-------------|
| **GET** `/calendar/locations` | List locations (filter by org) |
| **POST** `/calendar/locations` | Add new location |
| **GET** `/calendar/locations/{locationId}` | Location details |
| **PUT** `/calendar/locations/{locationId}` | Update location |
| **DELETE** `/calendar/locations/{locationId}` | Archive/delete location |

### Resources
| Method & Path | Description |
|---------------|-------------|
| **GET** `/calendar/resources` | List bookable resources (with availability) |
| **POST** `/calendar/resources` | Add new resource |
| **PUT** `/calendar/resources/{resourceId}` | Update resource |
| **DELETE** `/calendar/resources/{resourceId}` | Archive resource |

### Conflict Detection
| Method & Path | Description |
|---------------|-------------|
| **POST** `/calendar/conflicts/check` | Check prospective event for resource/time conflicts (returns 409 on conflict) |

## Realtime Updates
WebSocket endpoint (subject to gateway upgrades):
`WS /calendar/events/live`  — server pushes `event.created|updated|deleted` messages to authorized clients.

## Data Models (Schemas)
```yaml
components:
  schemas:
    CalendarEvent:
      type: object
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        description: { type: string }
        startTime: { type: string, format: date-time }
        endTime:   { type: string, format: date-time }
        eventTypeId: { type: string, format: uuid }
        locationId:  { type: string, format: uuid, nullable: true }
        teamId:      { type: string, format: uuid, nullable: true }
        createdBy:   { type: string, format: uuid }
        status: { type: string, enum: [scheduled, canceled, completed] }
        recurrenceRule: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    EventType:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        color: { type: string, pattern: '^#[A-Fa-f0-9]{6}$' }
        icon: { type: string }
        description: { type: string }
        defaultDuration: { type: integer, nullable: true }
        organizationId: { type: string, format: uuid, nullable: true }

    Location:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        address: { type: string }
        city: { type: string }
        country: { type: string }
        coordinates:
          type: object
          properties:
            latitude: { type: number }
            longitude: { type: number }
        organizationId: { type: string, format: uuid }

    Resource:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        resourceTypeId: { type: string, format: uuid }
        locationId: { type: string, format: uuid }
        capacity: { type: integer }
        description: { type: string }
        availableFrom: { type: string, pattern: '^(?:[01]?[0-9]|2[0-3]):[0-5][0-9]$' }
        availableTo:   { type: string, pattern: '^(?:[01]?[0-9]|2[0-3]):[0-5][0-9]$' }
        organizationId: { type: string, format: uuid }
```

---
*Status — DRAFT v0.1*  (Will be converted to full OpenAPI YAML once endpoint implementations stabilize.) 