# Hockey App - Role-Based Permissions

## Overview

This document defines the comprehensive role-based permission system for the Hockey App platform. It specifies the various roles, their permissions across different services, inheritance models, and technical implementation details.

## Role Hierarchy and Inheritance

The Hockey App implements a hierarchical permission model where certain roles inherit permissions from others. The hierarchy flows as follows:

```
Admin
  └── Club Admin
       ├── Coach
       │    └── Assistant Coach
       ├── Physical Trainer (fys_coach)
       ├── Medical Staff (rehab)
       └── Equipment Manager
```

**Independent roles** (no inheritance):
- Player
- Parent

## Role Definitions

### Admin
System-wide administrator with access to all organizations and full control over the platform.

### Club Admin (club_admin)
Administrator for a specific organization with full access to all teams and users within that organization.

### Coach (coach)
Team leader responsible for training, games, and overall team management.

### Assistant Coach (assistant_coach)
Supports the head coach with limited administrative capabilities.

### Physical Trainer (fys_coach)
Specializes in physical conditioning and testing.

### Medical Staff (rehab)
Manages injuries, rehabilitation, and player health.

### Equipment Manager (equipment_manager)
Handles team equipment and gear inventory.

### Player (player)
Active participant in team activities.

### Parent (parent)
Observer role linked to one or more player accounts.

## Permission Enforcement

Permissions are enforced at three levels:

1. **API Gateway Level**: Initial authorization checks based on JWT token role claims
2. **Service Level**: Detailed permission validation within each service
3. **Database Level**: Row-level security in PostgreSQL for multi-tenant data separation

### API Gateway Enforcement

The API Gateway validates JWT tokens and performs coarse-grained authorization:

```typescript
// Example gateway authorization middleware
const authorizeEndpoint = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED" 
      });
    }
    
    try {
      const decodedToken = verifyToken(token);
      const userRoles = decodedToken.roles || [];
      
      // Check if user has at least one of the allowed roles
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasPermission) {
        return res.status(403).json({
          error: true,
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }
      
      // Add user info to request for downstream services
      req.user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: "Invalid or expired token",
        code: "INVALID_TOKEN"
      });
    }
  };
};
```

### Service-Level Enforcement

Each service implements fine-grained authorization with contextual checks:

```typescript
// Example service-level authorization in Team Service
const canManageTeam = async (userId: string, teamId: string): Promise<boolean> => {
  // Check if user is admin (can manage any team)
  const user = await userRepository.findById(userId);
  if (user.roles.includes('admin')) {
    return true;
  }
  
  // Check if user is club_admin for this team's organization
  const team = await teamRepository.findById(teamId);
  if (user.roles.includes('club_admin') && user.organizationId === team.organizationId) {
    return true;
  }
  
  // Check if user is coach for this specific team
  const teamMember = await teamMemberRepository.findByUserIdAndTeamId(userId, teamId);
  if (teamMember && ['coach', 'assistant_coach'].includes(teamMember.role)) {
    return true;
  }
  
  return false;
};
```

### Database-Level Enforcement

Row-level security in PostgreSQL ensures data isolation:

```sql
-- Example of RLS policy for team data
CREATE POLICY team_isolation ON teams
    USING (
        -- Admins can see all teams
        (SELECT is_admin FROM user_roles WHERE user_id = current_user_id())
        OR
        -- Club admins can see teams in their organization
        (organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = current_user_id() AND role = 'club_admin'
        ))
        OR
        -- Coaches and others can see teams they're members of
        (id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = current_user_id()
        ))
    );
```

## JWT Token Structure

Role and permission data is encoded in JWT tokens as follows:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000", // User ID
  "name": "Mikael Andersson",
  "email": "mikael@example.com",
  "roles": ["coach", "fys_coach"],
  "organizationId": "22cbb1f2-38c1-4bc1-9c7a-29b6fb178930",
  "teamIds": ["44cbb1f2-38c1-4bc1-9c7a-29b6fb178931", "55cbb1f2-38c1-4bc1-9c7a-29b6fb178932"],
  "permissions": [
    "team:read",
    "team:update",
    "training:read",
    "training:create",
    "training:update"
  ],
  "lang": "sv",
  "iat": 1680267304,
  "exp": 1680268204
}
```

Key JWT fields:
- `roles`: Array of role names
- `organizationId`: User's primary organization (for club_admin and organization-scoped roles)
- `teamIds`: Teams the user is associated with (for team-scoped permissions)
- `permissions`: Granular permission strings derived from roles
- `lang`: User's preferred language
- `iat`: Issued-at timestamp
- `exp`: Expiration timestamp

## Detailed Permission Matrix

This matrix maps specific endpoints across all services to the roles authorized to access them.

### User Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `POST /auth/register` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /auth/login` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/refresh-token` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/logout` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/forgot-password` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/reset-password` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /users` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✗ | ✗ |
| `GET /users/:id` | ✓ | ✓¹ | ✓²⁴ | ✓²⁴ | ✓²⁴ | ✓²⁴ | ✓⁵ | ✓⁵ |
| `PUT /users/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✓⁵ | ✓⁵ |
| `PATCH /users/:id/password` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✓⁵ | ✓⁵ |
| `DELETE /users/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /users/import` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /teams` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /teams` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /teams/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `PUT /teams/:id` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /teams/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /teams/:id/members` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /teams/:id/members` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /teams/:id/members/:userId` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /organizations` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /organizations` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /organizations/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `PUT /organizations/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /users/:id/children` | ✓ | ✓¹ | ✓³ | ✓³ | ✓³ | ✓³ | ✗ | ✓⁵ |
| `GET /users/:id/parents` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁵ | ✗ |
| `POST /parent-child` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /parent-child/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /roles` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /users/:id/roles` | ✓ | ✓⁶ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /users/:id/roles/:roleId` | ✓ | ✓⁶ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Calendar Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /events` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /events` | ✓ | ✓¹ | ✓² | ✓⁸ | ✓⁸ | ✓⁸ | ✗ | ✗ |
| `GET /events/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `PUT /events/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ |
| `DELETE /events/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ |
| `PATCH /events/:id/status` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ |
| `GET /events/:id/participants` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /events/:id/participants` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✗ | ✗ |
| `DELETE /events/:id/participants/:userId` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ |
| `GET /resources` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `POST /resources` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /resources/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `PUT /resources/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /resources/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /resources/:id/availability` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `GET /resources/:id/events` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `GET /locations` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `POST /locations` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /locations/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `PUT /locations/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /locations/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /locations/:id/resources` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `GET /resource-types` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `POST /resource-types` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /resource-types/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `PUT /resource-types/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /resource-types/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Training Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /physical-templates` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `POST /physical-templates` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ | ✗ |
| `GET /physical-templates/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `PUT /physical-templates/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /physical-templates/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `POST /physical-templates/:id/copy` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `GET /physical-categories` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✗ |
| `POST /physical-categories` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ | ✗ |
| `GET /exercises` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✗ |
| `POST /exercises` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `GET /exercises/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✗ |
| `PUT /exercises/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ |
| `DELETE /exercises/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /exercises/categories` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✗ |
| `GET /scheduled-sessions` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /scheduled-sessions` | ✓ | ✓¹ | ✓² | ✓² | ✗ | ✗ | ✗ | ✗ |
| `GET /scheduled-sessions/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `PUT /scheduled-sessions/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `PATCH /scheduled-sessions/:id/status` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /scheduled-sessions/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `POST /scheduled-sessions/:id/start` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `POST /scheduled-sessions/:id/complete` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `GET /tests` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✓⁷ |
| `POST /tests` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ | ✗ |
| `GET /tests/:id` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✓⁶ | ✓⁷ |
| `PUT /tests/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /tests/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `GET /test-results` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /test-results` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✗ | ✗ |
| `GET /test-results/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `PUT /test-results/:id` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /sessions/:id/attendance` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /sessions/:id/attendance` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `PUT /sessions/:id/attendance/:userId` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ | ✗ |
| `POST /ai/generate-program` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `GET /ai/templates` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✗ | ✗ | ✗ |
| `POST /ai/templates/:id/customize` | ✓ | ✓¹ | ✓⁹ | ✓⁹ | ✓⁹ | ✗ | ✗ | ✗ |

### Medical Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /injuries` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✗ |
| `POST /injuries` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✗ | ✗ |
| `GET /injuries/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✗ |
| `PUT /injuries/:id` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `DELETE /injuries/:id` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /injuries/:id/updates` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✗ |
| `POST /injuries/:id/updates` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /injuries/:id/treatments` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✗ |
| `POST /injuries/:id/treatments` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /treatment-plans` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✗ |
| `POST /treatment-plans` | ✓ | ✓¹ | ✗ | ✗ | ✓² | ✗ | ✗ | ✗ |
| `PUT /treatment-plans/:id` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /player-status` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /player-status` | ✓ | ✓¹ | ✗ | ✗ | ✓² | ✗ | ✗ | ✗ |
| `PUT /player-status/:id` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /player-medical` | ✓ | ✓¹ | ✗ | ✗ | ✓² | ✗ | ✓⁶ | ✗ |
| `POST /player-medical` | ✓ | ✓¹ | ✗ | ✗ | ✓² | ✗ | ✗ | ✗ |
| `PUT /player-medical/:id` | ✓ | ✓¹ | ✗ | ✗ | ✓⁹ | ✗ | ✗ | ✗ |
| `GET /reports/injuries` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✗ | ✗ |

### Communication Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /chats` | ✓ | ✓¹ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ |
| `POST /chats` | ✓ | ✓¹ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓¹⁰ | ✓¹¹ |
| `GET /chats/:id` | ✓ | ✓¹ | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² |
| `PUT /chats/:id` | ✓ | ✓¹ | ✓¹³ | ✓¹³ | ✓¹³ | ✓¹³ | ✗ | ✗ |
| `DELETE /chats/:id` | ✓ | ✓¹ | ✓¹³ | ✓¹³ | ✓¹³ | ✓¹³ | ✗ | ✗ |
| `GET /chats/:id/messages` | ✓ | ✓¹ | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² |
| `POST /chats/:id/messages` | ✓ | ✓¹ | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² |
| `PUT /messages/:id` | ✓ | ✓¹ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ |
| `DELETE /messages/:id` | ✓ | ✓¹ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ |
| `POST /messages/:id/read` | ✓ | ✓¹ | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² |
| `POST /chat/upload` | ✓ | ✓¹ | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² | ✓¹² |
| `GET /notifications` | ✓ | ✓¹ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ |
| `PATCH /notifications/:id/read` | ✓ | ✓¹ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ |
| `PATCH /notifications/read-all` | ✓ | ✓¹ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ | ✓⁶ |
| `DELETE /notifications/:id` | ✓ | ✓¹ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ | ✓¹⁴ |

### Statistics Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /player-stats` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /player-stats` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /team-stats` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /team-stats` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /games` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /games` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /analytics/player/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `GET /analytics/team/:id` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `GET /reports` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✓⁷ |
| `POST /reports` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✗ | ✗ |
| `GET /metrics/definitions` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |

### Planning Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /seasons` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `POST /seasons` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /seasons/:id/phases` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `POST /seasons/:id/phases` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /team-goals` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓⁶ | ✗ |
| `POST /team-goals` | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /player-goals` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /player-goals` | ✓ | ✓¹ | ✓² | ✓² | ✗ | ✗ | ✓⁶ | ✗ |
| `GET /development-plans` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |
| `POST /development-plans` | ✓ | ✓¹ | ✓² | ✓² | ✗ | ✗ | ✗ | ✗ |
| `GET /seasons/:id/overview` | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| `GET /progress-reports` | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✗ | ✓⁶ | ✓⁷ |

### Payment Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /subscription-plans` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /subscription-plans` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /subscriptions/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /subscriptions` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `PUT /subscriptions/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /subscriptions/:id/cancel` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /invoices` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /invoices/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /invoices/:id/pdf` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /payments` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /payments/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /payments/:id/refund` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /payment-methods` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /payment-methods` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `PUT /payment-methods/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `DELETE /payment-methods/:id` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /organizations/:id/billing` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Admin Service Permissions

| Endpoint | Admin | Club Admin | Coach | Fys Coach | Rehab | Equipment Manager | Player | Parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| `GET /metrics/system` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /metrics/usage` | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /system/health` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /system/logs` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /languages` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /languages` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `PUT /languages/:code` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /translations` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /translations` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `GET /translations/export/:language` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `POST /translations/import/:language` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Permission Footnotes

The following footnotes explain the context-specific restrictions that apply to certain roles:

¹ Limited to their own organization  
² Limited to their assigned teams  
³ Limited to team players with parent-child links  
⁴ Limited to members of their assigned teams  
⁵ Limited to own user data only  
⁶ Limited to own data or teams they belong to  
⁷ Limited to their children's data  
⁸ Limited to creating events of their specific domain (fys_coach for physical training, rehab for medical appointments)  
⁹ Limited to resources they created or resources for teams they manage  
¹⁰ Players can create private chats but not group chats  
¹¹ Parents can only create private chats with their children's coaches  
¹² Limited to chats they are participants in  
¹³ Limited to chats they created or are admins of  
¹⁴ Limited to messages they authored  

## Permission Decision Flow

When a request is received, permissions are evaluated in the following order:

1. **Authentication Check**: Is the user authenticated with a valid token?
2. **Role Check**: Does the user have a role that is generally allowed to access this endpoint?
3. **Organization Check**: If organization-scoped, does the user belong to the relevant organization?
4. **Team Check**: If team-scoped, does the user have a relationship with the relevant team?
5. **Ownership Check**: If resource-specific, did the user create it or have explicit access to it?
6. **Special Case Checks**: Apply any special rules like child relationships, team membership, etc.

This progressive filtering ensures that users only access data they have explicit permission to see.

## Permission Implementation in the Frontend

The frontend application enforces permissions by:

1. **Route Guards**: Preventing access to unauthorized routes
2. **Component Visibility**: Conditionally rendering UI elements based on permissions
3. **Action Enablement**: Disabling actions that the user cannot perform

Example of permission-based conditional rendering:

```tsx
// Permission-based rendering in React
const TeamActionsMenu = ({ team }) => {
  const { user } = useAuth();
  const canEditTeam = usePermission('team:update', team.id);
  const canDeleteTeam = usePermission('team:delete', team.id);
  
  return (
    <MenuDropdown>
      <MenuItem>View Team</MenuItem>
      
      {canEditTeam && (
        <MenuItem>Edit Team</MenuItem>
      )}
      
      {canDeleteTeam && (
        <MenuItem>Delete Team</MenuItem>
      )}
    </MenuDropdown>
  );
};
```

## Permission Integration with the API Gateway

The API Gateway utilizes the permission data from JWT tokens to make initial authorization decisions:

```typescript
// API Gateway route configuration
const routes = [
  {
    path: '/api/v1/teams',
    service: 'team-service',
    methods: {
      GET: {
        allowedRoles: ['admin', 'club_admin', 'coach', 'fys_coach', 'rehab', 'equipment_manager', 'player', 'parent'],
        requiredPermissions: ['team:read']
      },
      POST: {
        allowedRoles: ['admin', 'club_admin'],
        requiredPermissions: ['team:create']
      }
    }
  },
  // Additional routes...
];
```

## Multi-tenancy and Permission Isolation

The Hockey App implements strict tenant isolation to ensure organizations cannot access each other's data:

1. **Database-Level Isolation**: Row-level security in PostgreSQL
2. **Service-Level Isolation**: Organization ID checks in service logic
3. **API Gateway Isolation**: Organization scoping in request routing

Example of organization isolation in service code:

```typescript
// Team service repository with organization isolation
class TeamRepository {
  async findAll(organizationId: string, options: FindOptions = {}): Promise<Team[]> {
    // Always filter by organization to ensure tenant isolation
    return this.teamModel.findAll({
      where: {
        ...options.where,
        organizationId
      },
      ...options
    });
  }
  
  async findById(id: string, organizationId: string): Promise<Team> {
    return this.teamModel.findOne({
      where: {
        id,
        organizationId
      }
    });
  }
}
```

## Permission Audit Logging

Actions related to permission changes are logged for audit purposes:

```typescript
// Audit logging for permission changes
async function assignRoleToUser(userId: string, roleId: string, adminId: string): Promise<void> {
  try {
    // Assign role logic
    await userRoleRepository.create({ userId, roleId });
    
    // Log the action for audit
    await auditLogRepository.create({
      action: 'ROLE_ASSIGNED',
      performedBy: adminId,
      targetEntityType: 'USER',
      targetEntityId: userId,
      details: {
        roleId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to assign role', { userId, roleId, error });
    throw error;
  }
}
```

## Permission Testing Strategy

The permission system is tested at multiple levels:

1. **Unit Tests**: Verify permission logic in isolation
2. **Integration Tests**: Test permission enforcement across service boundaries
3. **End-to-End Tests**: Validate complete user flows with different roles
4. **Penetration Testing**: Regular security testing to identify permission bypasses

Example of a permission unit test:

```typescript
// Jest test for permission logic
describe('Team permissions', () => {
  test('club_admin can only manage teams in their organization', async () => {
    // Setup: Create club admin user and teams in different organizations
    const clubAdmin = await createClubAdmin(organization1);
    const team1 = await createTeam(organization1);
    const team2 = await createTeam(organization2);
    
    // Test
    const canManageTeam1 = await permissionService.canManageTeam(clubAdmin.id, team1.id);
    const canManageTeam2 = await permissionService.canManageTeam(clubAdmin.id, team2.id);
    
    // Assert
    expect(canManageTeam1).toBe(true);
    expect(canManageTeam2).toBe(false);
  });
});
```

## JWT Token Validation Flow

The process of validating permissions via JWT tokens follows a specific flow:

1. **Token Issuance**: When a user logs in, the authentication service generates a JWT token containing their roles and derived permissions
2. **Token Transmission**: The token is sent with every API request in the Authorization header
3. **Gateway Validation**: The API Gateway validates the token's signature, expiration, and basic claims
4. **Permission Extraction**: The Gateway extracts roles and permissions from the validated token
5. **Initial Authorization**: The Gateway performs a preliminary authorization check before routing
6. **Service-Level Validation**: The target service performs detailed authorization with contextual information

### JWT Token Validation Code Example

```typescript
// API Gateway JWT validation middleware
const validateJwtToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token signature and expiration
    const decodedToken = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    });
    
    // Extract user information
    req.user = {
      id: decodedToken.sub,
      email: decodedToken.email,
      roles: decodedToken.roles || [],
      permissions: decodedToken.permissions || [],
      organizationId: decodedToken.organizationId,
      teamIds: decodedToken.teamIds || [],
      lang: decodedToken.lang || 'sv'
    };
    
    // Add token expiration check
    const tokenExp = decodedToken.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiration = tokenExp - currentTime;
    
    // Add expiration info for monitoring/debugging
    req.tokenExpiration = {
      expiresAt: new Date(tokenExp).toISOString(),
      expiresIn: Math.floor(timeUntilExpiration / 1000) // seconds remaining
    };
    
    // If token is close to expiry, add refresh header
    if (timeUntilExpiration < 5 * 60 * 1000) { // Less than 5 minutes
      res.setHeader('X-Token-Expiring-Soon', 'true');
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      error: true,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};
```

## Permission Derivation from Roles

The system derives fine-grained permissions from roles to enable more precise access control:

### Permission Naming Convention

Permissions follow a resource:action pattern:

- `team:read` - View team information
- `team:create` - Create teams
- `team:update` - Modify team information
- `team:delete` - Delete teams
- `user:read` - View user information
- `user:create` - Create users
- `user:update` - Modify user information
- etc.

### Role to Permission Mapping

Each role is mapped to a set of default permissions:

```typescript
// Role to permission mapping
const rolePermissionMap = {
  admin: [
    '*:*'  // Wildcard permission - all access
  ],
  
  club_admin: [
    'organization:read',
    'organization:update',
    'team:*',
    'user:*',
    'event:*',
    'resource:*',
    'chat:*',
    'subscription:*',
    'invoice:*',
    'payment-method:*'
  ],
  
  coach: [
    'team:read',
    'team:update',
    'user:read',
    'event:*',
    'training:*',
    'game:*',
    'statistics:read',
    'player-goal:*',
    'team-goal:*',
    'chat:*',
    'notification:*'
  ],
  
  fys_coach: [
    'team:read',
    'user:read',
    'event:read',
    'event:create',
    'event:update',
    'training:*',
    'test:*',
    'test-result:*',
    'exercise:*',
    'chat:*',
    'notification:*'
  ],
  
  rehab: [
    'team:read',
    'user:read',
    'event:read',
    'event:create', 
    'event:update',
    'injury:*',
    'treatment:*',
    'player-status:*',
    'medical-record:*',
    'chat:*',
    'notification:*'
  ],
  
  equipment_manager: [
    'team:read',
    'user:read',
    'event:read',
    'chat:*',
    'notification:*'
  ],
  
  player: [
    'team:read',
    'user:read',
    'user:update',
    'event:read',
    'training:read',
    'test-result:read',
    'injury:read',
    'player-status:read',
    'medical-record:read',
    'chat:*',
    'notification:*',
    'player-goal:read',
    'player-goal:create',
    'player-goal:update',
    'statistics:read'
  ],
  
  parent: [
    'user:read',
    'user:update',
    'team:read',
    'event:read',
    'training:read',
    'test-result:read',
    'player-status:read',
    'chat:*',
    'notification:*',
    'statistics:read'
  ]
};
```

### Context-Specific Permission Enhancement

Permissions are enhanced with contextual information from the JWT token:

```typescript
// Add context to permissions during token generation
function enhancePermissionsWithContext(user, permissions) {
  const enhancedPermissions = [...permissions];
  
  // Add organization context for organization-scoped roles
  if (user.roles.includes('club_admin')) {
    enhancedPermissions.push(`organization:${user.organizationId}:*`);
  }
  
  // Add team context for team-scoped roles
  if (['coach', 'fys_coach', 'rehab', 'equipment_manager'].some(role => user.roles.includes(role))) {
    user.teamIds.forEach(teamId => {
      enhancedPermissions.push(`team:${teamId}:*`);
    });
  }
  
  // Add player-specific context
  if (user.roles.includes('player')) {
    enhancedPermissions.push(`user:${user.id}:*`);
    
    // Players can only update their own profile
    const updateIndex = enhancedPermissions.indexOf('user:update');
    if (updateIndex !== -1) {
      enhancedPermissions[updateIndex] = `user:${user.id}:update`;
    }
  }
  
  // Add parent-child context
  if (user.roles.includes('parent') && user.childIds?.length > 0) {
    user.childIds.forEach(childId => {
      enhancedPermissions.push(`user:${childId}:read`);
    });
  }
  
  return enhancedPermissions;
}
```

## Permission Checking Utility

Services use a permission checking utility to verify access:

```typescript
// Permission checking utility
class PermissionChecker {
  // Check if user has a specific permission
  static hasPermission(userPermissions, requiredPermission) {
    // Direct match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }
    
    // Wildcard match (e.g., 'team:*' matches 'team:read')
    const resourceAction = requiredPermission.split(':');
    if (resourceAction.length === 2) {
      const [resource, action] = resourceAction;
      if (userPermissions.includes(`${resource}:*`) || userPermissions.includes('*:*')) {
        return true;
      }
    }
    
    // Resource-instance specific permission (e.g., 'team:123:update')
    if (resourceAction.length === 3) {
      const [resource, id, action] = resourceAction;
      if (
        userPermissions.includes(`${resource}:*`) || 
        userPermissions.includes(`${resource}:${id}:*`) || 
        userPermissions.includes(`${resource}:*:${action}`) ||
        userPermissions.includes('*:*')
      ) {
        return true;
      }
    }
    
    return false;
  }
  
  // Check if user can access a specific resource
  static canAccessResource(userPermissions, resource, id = null, action = 'read') {
    const permissionToCheck = id 
      ? `${resource}:${id}:${action}` 
      : `${resource}:${action}`;
    
    return this.hasPermission(userPermissions, permissionToCheck);
  }
  
  // Check if user owns a resource
  static isResourceOwner(userId, resourceOwnerId) {
    return userId === resourceOwnerId;
  }
  
  // Combined check for resource access
  static canPerformAction(user, resource, resourceId, action, ownerId = null) {
    // Admin always has access
    if (user.roles.includes('admin')) {
      return true;
    }
    
    // Check direct permission
    if (this.canAccessResource(user.permissions, resource, resourceId, action)) {
      return true;
    }
    
    // Check ownership
    if (ownerId && this.isResourceOwner(user.id, ownerId)) {
      return true;
    }
    
    return false;
  }
}
```

## Organization-Level Permission Constraints

Club administrators and organization-specific roles have constraints based on organization membership:

```typescript
// Example middleware to verify organization access
const verifyOrganizationAccess = async (req, res, next) => {
  const { user } = req;
  const { organizationId } = req.params;
  
  // Admin has access to all organizations
  if (user.roles.includes('admin')) {
    return next();
  }
  
  // Check if user belongs to the organization
  if (user.organizationId !== organizationId) {
    return res.status(403).json({
      error: true,
      message: 'Access denied to this organization',
      code: 'ORGANIZATION_ACCESS_DENIED'
    });
  }
  
  next();
};
```

## Team-Level Permission Constraints

Coaches and team-specific roles are constrained by team membership:

```typescript
// Example middleware to verify team access
const verifyTeamAccess = async (req, res, next) => {
  const { user } = req;
  const { teamId } = req.params;
  
  // Admin and club_admin have access to all teams in their organization
  if (user.roles.includes('admin')) {
    return next();
  }
  
  // For club_admin, check if team belongs to their organization
  if (user.roles.includes('club_admin')) {
    const team = await teamService.getTeamById(teamId);
    if (team && team.organizationId === user.organizationId) {
      return next();
    }
  }
  
  // For coaches and others, check team membership
  if (user.teamIds && user.teamIds.includes(teamId)) {
    return next();
  }
  
  // For players, check if they belong to the team
  if (user.roles.includes('player')) {
    const isMember = await teamService.isPlayerInTeam(user.id, teamId);
    if (isMember) {
      return next();
    }
  }
  
  // For parents, check if their children belong to the team
  if (user.roles.includes('parent') && user.childIds) {
    const childrenInTeam = await teamService.arePlayersInTeam(user.childIds, teamId);
    if (childrenInTeam) {
      return next();
    }
  }
  
  return res.status(403).json({
    error: true,
    message: 'Access denied to this team',
    code: 'TEAM_ACCESS_DENIED'
  });
};
```

## Parent-Child Permission Constraints

Parent access to child data follows specific rules:

```typescript
// Utility to verify parent-child relationship
async function verifyParentChildAccess(parentId, childId) {
  // Query the parent-child relationship
  const relationship = await parentChildRepository.findOne({
    where: {
      parentId,
      childId
    }
  });
  
  return !!relationship;
}

// Middleware to verify access to child data
const verifyChildAccess = async (req, res, next) => {
  const { user } = req;
  const { userId } = req.params; // The child/player ID
  
  // Admin has access to all users
  if (user.roles.includes('admin')) {
    return next();
  }
  
  // Club admin has access to users in their organization
  if (user.roles.includes('club_admin')) {
    const targetUser = await userService.getUserById(userId);
    if (targetUser && targetUser.organizationId === user.organizationId) {
      return next();
    }
  }
  
  // Users can access their own data
  if (user.id === userId) {
    return next();
  }
  
  // Parents can access their children's data
  if (user.roles.includes('parent')) {
    const hasAccess = await verifyParentChildAccess(user.id, userId);
    if (hasAccess) {
      return next();
    }
  }
  
  // Coaches can access players in their teams
  if (['coach', 'fys_coach', 'rehab'].some(role => user.roles.includes(role))) {
    // Get teams managed by the coach
    const coachTeams = user.teamIds || [];
    
    // Check if player is in any of these teams
    const isPlayerInCoachTeam = await teamService.isPlayerInAnyTeam(userId, coachTeams);
    if (isPlayerInCoachTeam) {
      return next();
    }
  }
  
  return res.status(403).json({
    error: true,
    message: 'Access denied to this user data',
    code: 'USER_ACCESS_DENIED'
  });
};
```

## Best Practices for Role-Based Access Control

The Hockey App follows these best practices for implementing RBAC:

1. **Principle of Least Privilege**: Users are granted the minimum permissions necessary to perform their function
2. **Separation of Duties**: Critical operations require multiple roles to complete
3. **Permission Auditing**: All permission changes are logged for accountability
4. **Regular Review**: Role permissions are reviewed periodically to ensure they remain appropriate
5. **Consistent Enforcement**: Permissions are enforced consistently across all service boundaries
6. **Fail Closed**: When permission checks are inconclusive, access is denied by default
7. **Emergency Access**: Break-glass procedures exist for emergency access to critical functions

## Security Considerations

### Token Security

- JWT tokens use asymmetric encryption (RS256)
- Tokens are short-lived (15 minutes for access tokens)
- Refresh tokens use rotation to prevent reuse
- Tokens are stored in HttpOnly cookies with appropriate security flags

### Protecting Sensitive Endpoints

Particularly sensitive endpoints (like medical data or payment information) implement additional security measures:

1. **Enhanced Logging**: More detailed audit logs for sensitive operations
2. **Rate Limiting**: Stricter rate limits to prevent brute force attempts
3. **IP Restrictions**: Optional IP whitelisting for administrative functions
4. **Elevated Privileges**: Temporary privilege escalation for sensitive operations

### Handling Token Compromise

In case of suspected token compromise:

1. The user's refresh tokens are immediately revoked
2. All active sessions for the user are terminated
3. The user is required to re-authenticate with additional verification
4. Security logs are analyzed to assess the extent of potential data exposure

## Conclusion

The Hockey App's role-based permission system provides fine-grained access control while maintaining flexibility for complex organizational structures. By implementing permissions at multiple levels (gateway, service, database) and using a hierarchical role model, the system ensures that users have access only to the functionality and data they legitimately need.

The permission matrix serves as the definitive reference for what each role can access, while the technical implementation details ensure consistent enforcement across the platform. This comprehensive approach to permissions is essential for a multi-tenant application handling sensitive data like medical records and team information.

By following established security best practices and implementing context-specific permission enhancements, the Hockey App achieves both security and usability in its permission model. The combination of role-based access control with resource-specific permissions provides the granularity needed to handle the complex relationships between users, teams, and organizations in the hockey ecosystem.