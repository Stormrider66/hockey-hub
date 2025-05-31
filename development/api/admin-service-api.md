# Hockey App – Admin Service API Contract (OpenAPI 3.0)

## Purpose
The Admin Service provides tenant-management and system-wide administration capabilities such as usage metrics, feature toggles, user impersonation, and audit logs.  It is internal-only and sits behind the API-Gateway with strict RBAC rules.

**Base URL** : `/api/v1`  
**Port**     : `3009`

### Security
All endpoints require a JWT with `admin` role **and** `super_admin` permission for system-level operations.

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Endpoints

### Organizations / Tenants
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/admin/organizations` | List all organizations (paging) | super_admin |
| GET | `/admin/organizations/{orgId}` | Tenant details, plan, usage | admin (own org) / super_admin |
| POST | `/admin/organizations` | Provision new organization | super_admin |
| PUT  | `/admin/organizations/{orgId}` | Update org name, plan, status | super_admin |
| DELETE | `/admin/organizations/{orgId}` | Deactivate tenant (soft-delete) | super_admin |

### System Metrics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/metrics/health` | Aggregate health of all services (internal ping) |
| GET | `/admin/metrics/usage` | Daily active users, DB size, request counts |
| GET | `/admin/metrics/errors` | Error rates (last 24h) |

### Feature Flags
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/feature-flags` | List feature flags |
| POST | `/admin/feature-flags` | Create flag |
| PUT | `/admin/feature-flags/{flagKey}` | Update flag (on/off, rollout %) |
| DELETE | `/admin/feature-flags/{flagKey}` | Remove flag |

### Audit Logs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/audit-logs` | Query audit logs (filter by user/tenant/date) |
| GET | `/admin/audit-logs/{logId}` | Single log entry detail |

### User Impersonation
| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/impersonate/{userId}` | Returns short-lived token to act as user (super_admin only) |

## Data Schemas (excerpt)
```yaml
components:
  schemas:
    Organization:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        status: { type: string, enum: [active, suspended, deleted] }
        plan:  { type: string, enum: [free, pro, enterprise] }
        createdAt: { type: string, format: date-time }
    FeatureFlag:
      type: object
      properties:
        key: { type: string }
        enabled: { type: boolean }
        rollout: { type: integer, minimum: 0, maximum: 100 }
```

— *Draft v0.1* – metrics endpoints will stabilise once Prometheus/Grafana integration lands. 