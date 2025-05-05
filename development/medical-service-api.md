# Hockey App - Medical Service API Contract (OpenAPI 3.0)

## Overview
The Medical Service handles injury registration, treatment tracking, rehabilitation plans, player availability status, and secure medical documents.  This initial stub provides the endpoint skeleton for integration; detailed schemas and error codes will be added iteratively.

**Service Base URL** : `/api/v1`
**Service Port**     : `3005`

> All endpoints require `bearerAuth` with a JWT containing the user's role & language unless noted *public*.

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

### Injuries
| Method & Path | Description | Required Role(s) |
|---------------|-------------|------------------|
| **POST** `/medical/injuries` | Register a new injury for a player | rehab, coach, admin |
| **GET** `/medical/injuries` | List injuries (filter by team, player, status) | authorized staff & player/parent (own) |
| **GET** `/medical/injuries/{injuryId}` | Injury details (timeline view) | as above |
| **PUT** `/medical/injuries/{injuryId}` | Update injury info | rehab, admin |
| **DELETE** `/medical/injuries/{injuryId}` | Archive injury record | admin |

### Treatments
| Method & Path | Description | Role |
|---------------|-------------|------|
| **POST** `/medical/injuries/{injuryId}/treatments` | Add treatment entry | rehab |
| **PUT** `/medical/treatments/{treatmentId}` | Update treatment | rehab |
| **DELETE** `/medical/treatments/{treatmentId}` | Remove/void treatment | rehab, admin |

### Treatment Plans
| Method & Path | Description |
|---------------|-------------|
| **POST** `/medical/injuries/{injuryId}/plans` | Create rehab plan (phased) |
| **GET** `/medical/injuries/{injuryId}/plans` | List treatment plans for injury |
| **PUT** `/medical/plans/{planId}` | Update plan |
| **DELETE** `/medical/plans/{planId}` | Archive plan |

### Player Availability
| Method & Path | Description |
|---------------|-------------|
| **GET** `/medical/players/{playerId}/availability` | Current availability status |
| **POST** `/medical/players/{playerId}/availability` | Set/update status |

### Medical Documents
| Method & Path | Description |
|---------------|-------------|
| **POST** `/medical/documents` | Upload medical document (X-ray, report) |
| **GET** `/medical/documents/{documentId}` | Secure download (signed URL) |
| **DELETE** `/medical/documents/{documentId}` | Delete document |

## Data Models (Schemas)
```yaml
components:
  schemas:
    Injury:
      type: object
      properties:
        id: { type: string, format: uuid }
        playerId: { type: string, format: uuid }
        bodyPart: { type: string }
        injuryType: { type: string }
        severity: { type: string, enum: [minor, moderate, major, severe] }
        status: { type: string, enum: [active, rehab, healed, archived] }
        dateOccurred: { type: string, format: date }
        estimatedRecoveryTime: { type: integer, nullable: true }
        description: { type: string, nullable: true }
        teamId: { type: string, format: uuid }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Treatment:
      type: object
      properties:
        id: { type: string, format: uuid }
        injuryId: { type: string, format: uuid }
        date: { type: string, format: date }
        treatmentType: { type: string }
        duration: { type: integer, nullable: true }
        notes: { type: string, nullable: true }
        performedBy: { type: string, format: uuid }
    AvailabilityStatus:
      type: object
      properties:
        id: { type: string, format: uuid }
        playerId: { type: string, format: uuid }
        currentStatus: { type: string, enum: [full, limited, individual, rehab_only, unavailable] }
        effectiveFrom: { type: string, format: date }
        expectedEndDate: { type: string, format: date, nullable: true }
        notes: { type: string, nullable: true }
```

---
*Status — DRAFT v0.1* 