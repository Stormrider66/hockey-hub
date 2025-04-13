# Hockey App - User Service API Contract (OpenAPI 3.0)

## Overview

This document defines the API contract for the User Service in the Hockey App platform. The User Service is responsible for user authentication, authorization, and user/team/organization management. It serves as the central authority for user identity and relationships within the system.

**Service Base URL**: `/api/v1` (prefixed with gateway URL)  
**Service Port**: 3001

## Authentication

The User Service provides JWT-based authentication with refresh token rotation. All secured endpoints require a valid JWT token in the Authorization header with the Bearer scheme.

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

### Authentication Flow

1. Client authenticates with credentials via `/auth/login`
2. Server issues access token (15 min validity) and refresh token (7 day validity)
3. Client includes access token in all subsequent requests
4. When access token expires, client uses refresh token to obtain a new pair
5. Refresh tokens are rotated on each use for security

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user in the system.

**Request Body Schema**:
```yaml
type: object
required:
  - email
  - password
  - firstName
  - lastName
properties:
  email:
    type: string
    format: email
    description: User's email address
  password:
    type: string
    format: password
    minLength: 8
    description: User's password (min 8 chars, must include uppercase, lowercase, number, special char)
  firstName:
    type: string
    minLength: 1
    maxLength: 100
    description: User's first name
  lastName:
    type: string
    minLength: 1
    maxLength: 100
    description: User's last name
  phone:
    type: string
    pattern: '^\+?[0-9]{8,15}$'
    description: User's phone number (international format)
  preferredLanguage:
    type: string
    default: 'sv'
    enum: ['sv', 'en']
    description: User's preferred language
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
        description: User ID
      email:
        type: string
        format: email
      firstName:
        type: string
      lastName:
        type: string
      status:
        type: string
        enum: ['pending', 'active', 'inactive']
      preferredLanguage:
        type: string
      createdAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error or missing required fields
- `409 Conflict`: Email already exists

#### POST /auth/login

Authenticate a user and issue access and refresh tokens.

**Request Body Schema**:
```yaml
type: object
required:
  - email
  - password
properties:
  email:
    type: string
    format: email
  password:
    type: string
    format: password
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      accessToken:
        type: string
        description: JWT access token (15 min validity)
      refreshToken:
        type: string
        description: JWT refresh token (7 day validity)
      user:
        type: object
        properties:
          id:
            type: string
            format: uuid
          email:
            type: string
            format: email
          firstName:
            type: string
          lastName:
            type: string
          roles:
            type: array
            items:
              type: string
              enum: ['admin', 'club_admin', 'coach', 'fys_coach', 'rehab', 'equipment_manager', 'player', 'parent']
          preferredLanguage:
            type: string
```

**Error Responses**:
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive or suspended

#### POST /auth/refresh-token

Refresh the access token using a valid refresh token.

**Request Body Schema**:
```yaml
type: object
required:
  - refreshToken
properties:
  refreshToken:
    type: string
    description: Valid refresh token
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      accessToken:
        type: string
        description: New JWT access token
      refreshToken:
        type: string
        description: New JWT refresh token (rotated)
```

**Error Responses**:
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired refresh token

#### POST /auth/logout

Revoke the current refresh token, effectively logging the user out.

**Request Body Schema**:
```yaml
type: object
required:
  - refreshToken
properties:
  refreshToken:
    type: string
    description: Current refresh token
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Successfully logged out"
```

**Error Responses**:
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid token

#### POST /auth/forgot-password

Initiate password reset flow by sending a reset token to the user's email.

**Request Body Schema**:
```yaml
type: object
required:
  - email
properties:
  email:
    type: string
    format: email
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "If an account with that email exists, a password reset link has been sent"
```

*Note: Always returns 200 for security reasons, even if email doesn't exist.*

#### POST /auth/reset-password

Complete password reset with the token received via email.

**Request Body Schema**:
```yaml
type: object
required:
  - token
  - newPassword
properties:
  token:
    type: string
    description: Password reset token received via email
  newPassword:
    type: string
    format: password
    minLength: 8
    description: New password
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Password has been reset successfully"
```

**Error Responses**:
- `400 Bad Request`: Invalid or missing token/password
- `401 Unauthorized`: Expired token

### User Management Endpoints

#### GET /users

Get a list of users with filtering, sorting, and pagination.

**Security**: Requires authentication and appropriate role (admin, club_admin, coach)

**Query Parameters**:
```yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
    description: Page number
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
    description: Items per page
  - name: search
    in: query
    schema:
      type: string
    description: Search term (matches name or email)
  - name: role
    in: query
    schema:
      type: string
    description: Filter by role
  - name: teamId
    in: query
    schema:
      type: string
      format: uuid
    description: Filter by team membership
  - name: status
    in: query
    schema:
      type: string
      enum: ['active', 'inactive', 'pending']
    description: Filter by user status
  - name: sort
    in: query
    schema:
      type: string
      enum: ['firstName', 'lastName', 'email', 'createdAt']
      default: 'lastName'
    description: Sort field
  - name: order
    in: query
    schema:
      type: string
      enum: ['asc', 'desc']
      default: 'asc'
    description: Sort order
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        status:
          type: string
          enum: ['active', 'inactive', 'pending']
        roles:
          type: array
          items:
            type: string
        preferredLanguage:
          type: string
        lastLogin:
          type: string
          format: date-time
          nullable: true
        createdAt:
          type: string
          format: date-time
  meta:
    type: object
    properties:
      pagination:
        type: object
        properties:
          page:
            type: integer
          limit:
            type: integer
          total:
            type: integer
          pages:
            type: integer
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

#### GET /users/:id

Get detailed information about a specific user.

**Security**: Requires authentication (user can access own data, admin/club_admin can access any user)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      email:
        type: string
        format: email
      firstName:
        type: string
      lastName:
        type: string
      phone:
        type: string
        nullable: true
      status:
        type: string
        enum: ['active', 'inactive', 'pending']
      roles:
        type: array
        items:
          type: object
          properties:
            id:
              type: string
              format: uuid
            name:
              type: string
      teams:
        type: array
        items:
          type: object
          properties:
            id:
              type: string
              format: uuid
            name:
              type: string
            role:
              type: string
              enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
            position:
              type: string
              nullable: true
            jerseyNumber:
              type: string
              nullable: true
      preferredLanguage:
        type: string
      lastLogin:
        type: string
        format: date-time
        nullable: true
      createdAt:
        type: string
        format: date-time
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### PUT /users/:id

Update a user's information.

**Security**: Requires authentication (user can update own data, admin/club_admin can update any user)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
```

**Request Body Schema**:
```yaml
type: object
properties:
  firstName:
    type: string
    minLength: 1
    maxLength: 100
  lastName:
    type: string
    minLength: 1
    maxLength: 100
  phone:
    type: string
    pattern: '^\+?[0-9]{8,15}$'
  preferredLanguage:
    type: string
    enum: ['sv', 'en']
  status:
    type: string
    enum: ['active', 'inactive', 'pending']
    description: Only admins can change status
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      email:
        type: string
        format: email
      firstName:
        type: string
      lastName:
        type: string
      phone:
        type: string
        nullable: true
      status:
        type: string
      preferredLanguage:
        type: string
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### PATCH /users/:id/password

Update a user's password.

**Security**: Requires authentication (user can update own password, admin can update any user's password)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
```

**Request Body Schema**:
```yaml
type: object
required:
  - newPassword
properties:
  currentPassword:
    type: string
    description: Required when changing own password, not required for admins
  newPassword:
    type: string
    format: password
    minLength: 8
    description: New password
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Password updated successfully"
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token, incorrect current password
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### DELETE /users/:id

Delete a user (soft delete).

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "User deleted successfully"
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### POST /users/import

Bulk import users from CSV file.

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Request Body Schema**:
```yaml
type: object
required:
  - file
  - organizationId
properties:
  file:
    type: string
    format: binary
    description: CSV file with user data
  organizationId:
    type: string
    format: uuid
    description: Organization to import users to
  sendInvites:
    type: boolean
    default: true
    description: Whether to send invitation emails
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      totalProcessed:
        type: integer
        example: 50
      imported:
        type: integer
        example: 45
      errors:
        type: array
        items:
          type: object
          properties:
            rowNumber:
              type: integer
            email:
              type: string
            error:
              type: string
```

**Error Responses**:
- `400 Bad Request`: Invalid file format or missing required data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

### Team Management Endpoints

#### GET /teams

Get a list of teams with filtering, sorting, and pagination.

**Security**: Requires authentication

**Query Parameters**:
```yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
    description: Page number
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
    description: Items per page
  - name: search
    in: query
    schema:
      type: string
    description: Search term (matches team name)
  - name: organizationId
    in: query
    schema:
      type: string
      format: uuid
    description: Filter by organization ID
  - name: status
    in: query
    schema:
      type: string
      enum: ['active', 'inactive', 'archived']
    description: Filter by team status
  - name: category
    in: query
    schema:
      type: string
    description: Filter by team category
  - name: sort
    in: query
    schema:
      type: string
      enum: ['name', 'category', 'createdAt']
      default: 'name'
    description: Sort field
  - name: order
    in: query
    schema:
      type: string
      enum: ['asc', 'desc']
      default: 'asc'
    description: Sort order
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        organizationId:
          type: string
          format: uuid
        organizationName:
          type: string
        category:
          type: string
        season:
          type: string
        status:
          type: string
          enum: ['active', 'inactive', 'archived']
        memberCount:
          type: integer
        logoUrl:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
  meta:
    type: object
    properties:
      pagination:
        type: object
        properties:
          page:
            type: integer
          limit:
            type: integer
          total:
            type: integer
          pages:
            type: integer
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

#### POST /teams

Create a new team.

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Request Body Schema**:
```yaml
type: object
required:
  - name
  - organizationId
properties:
  name:
    type: string
    minLength: 1
    maxLength: 100
    description: Team name
  organizationId:
    type: string
    format: uuid
    description: Parent organization ID
  category:
    type: string
    maxLength: 100
    description: Team category (age group, skill level)
  season:
    type: string
    maxLength: 20
    description: Season identifier
  logoUrl:
    type: string
    format: uri
    description: Team-specific logo URL
  primaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})$'
    description: Team primary color (hex code)
  description:
    type: string
    description: Team description
  status:
    type: string
    enum: ['active', 'inactive', 'archived']
    default: 'active'
    description: Team status
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      organizationId:
        type: string
        format: uuid
      category:
        type: string
      season:
        type: string
      logoUrl:
        type: string
        nullable: true
      primaryColor:
        type: string
        nullable: true
      description:
        type: string
        nullable: true
      status:
        type: string
      createdAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found

#### GET /teams/:id

Get detailed information about a specific team.

**Security**: Requires authentication (user must be a member of the team or have admin rights)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      organizationId:
        type: string
        format: uuid
      organizationName:
        type: string
      category:
        type: string
      season:
        type: string
      logoUrl:
        type: string
        nullable: true
      primaryColor:
        type: string
        nullable: true
      description:
        type: string
        nullable: true
      status:
        type: string
        enum: ['active', 'inactive', 'archived']
      members:
        type: array
        items:
          type: object
          properties:
            userId:
              type: string
              format: uuid
            firstName:
              type: string
            lastName:
              type: string
            email:
              type: string
              format: email
            role:
              type: string
              enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
            position:
              type: string
              nullable: true
            jerseyNumber:
              type: string
              nullable: true
            startDate:
              type: string
              format: date
      createdAt:
        type: string
        format: date-time
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team not found

#### PUT /teams/:id

Update a team's information.

**Security**: Requires authentication and appropriate role (admin, club_admin, or coach with team management rights)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
```

**Request Body Schema**:
```yaml
type: object
properties:
  name:
    type: string
    minLength: 1
    maxLength: 100
  category:
    type: string
    maxLength: 100
  season:
    type: string
    maxLength: 20
  logoUrl:
    type: string
    format: uri
  primaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})$'
  description:
    type: string
  status:
    type: string
    enum: ['active', 'inactive', 'archived']
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      organizationId:
        type: string
        format: uuid
      category:
        type: string
      season:
        type: string
      logoUrl:
        type: string
        nullable: true
      primaryColor:
        type: string
        nullable: true
      description:
        type: string
        nullable: true
      status:
        type: string
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team not found

#### DELETE /teams/:id

Delete a team (soft delete).

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Team deleted successfully"
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team not found

#### GET /teams/:id/members

Get a list of team members.

**Security**: Requires authentication (user must be a member of the team or have admin rights)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
```

**Query Parameters**:
```yaml
parameters:
  - name: role
    in: query
    schema:
      type: string
      enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
    description: Filter by role
  - name: search
    in: query
    schema:
      type: string
    description: Search term (matches name or email)
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        userId:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
        position:
          type: string
          nullable: true
        jerseyNumber:
          type: string
          nullable: true
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team not found

#### POST /teams/:id/members

Add a member to a team.

**Security**: Requires authentication and appropriate role (admin, club_admin, or coach with team management rights)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
```

**Request Body Schema**:
```yaml
type: object
required:
  - userId
  - role
properties:
  userId:
    type: string
    format: uuid
    description: User ID to add to team
  role:
    type: string
    enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
    description: Role in the team
  position:
    type: string
    description: Player position (if role is player)
  jerseyNumber:
    type: string
    description: Player's jersey number (if role is player)
  startDate:
    type: string
    format: date
    description: Date when user joined the team
    default: current date
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      teamId:
        type: string
        format: uuid
      userId:
        type: string
        format: uuid
      role:
        type: string
      position:
        type: string
        nullable: true
      jerseyNumber:
        type: string
        nullable: true
      startDate:
        type: string
        format: date
      createdAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error or user already in team
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team or user not found
- `409 Conflict`: User already has this role in the team

#### DELETE /teams/:teamId/members/:userId

Remove a member from a team.

**Security**: Requires authentication and appropriate role (admin, club_admin, or coach with team management rights)

**Path Parameters**:
```yaml
parameters:
  - name: teamId
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Team ID
  - name: userId
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID to remove from team
```

**Query Parameters**:
```yaml
parameters:
  - name: role
    in: query
    schema:
      type: string
      enum: ['player', 'coach', 'assistant_coach', 'manager', 'staff']
    description: Specific role to remove (if user has multiple roles)
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Team member removed successfully"
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Team, user, or membership not found

### Organization Management Endpoints

#### GET /organizations

Get a list of organizations with filtering, sorting, and pagination.

**Security**: Requires authentication and admin role

**Query Parameters**:
```yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
    description: Page number
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
    description: Items per page
  - name: search
    in: query
    schema:
      type: string
    description: Search term (matches name or contact email)
  - name: status
    in: query
    schema:
      type: string
      enum: ['active', 'inactive', 'trial']
    description: Filter by organization status
  - name: sort
    in: query
    schema:
      type: string
      enum: ['name', 'createdAt']
      default: 'name'
    description: Sort field
  - name: order
    in: query
    schema:
      type: string
      enum: ['asc', 'desc']
      default: 'asc'
    description: Sort order
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        contactEmail:
          type: string
          format: email
        contactPhone:
          type: string
          nullable: true
        logoUrl:
          type: string
          nullable: true
        status:
          type: string
          enum: ['active', 'inactive', 'trial']
        teamCount:
          type: integer
        userCount:
          type: integer
        defaultLanguage:
          type: string
        createdAt:
          type: string
          format: date-time
  meta:
    type: object
    properties:
      pagination:
        type: object
        properties:
          page:
            type: integer
          limit:
            type: integer
          total:
            type: integer
          pages:
            type: integer
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

#### POST /organizations

Create a new organization.

**Security**: Requires authentication and admin role

**Request Body Schema**:
```yaml
type: object
required:
  - name
  - contactEmail
properties:
  name:
    type: string
    minLength: 1
    maxLength: 100
    description: Organization name
  contactEmail:
    type: string
    format: email
    description: Primary contact email
  contactPhone:
    type: string
    pattern: '^\+?[0-9]{8,15}
    description: Primary contact phone
  logoUrl:
    type: string
    format: uri
    description: Organization logo URL
  address:
    type: string
    description: Physical address
  city:
    type: string
    maxLength: 100
    description: City location
  country:
    type: string
    maxLength: 100
    default: 'Sweden'
    description: Country
  primaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})
    description: Primary brand color (hex)
  secondaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})
    description: Secondary brand color (hex)
  defaultLanguage:
    type: string
    enum: ['sv', 'en']
    default: 'sv'
    description: Default language
  status:
    type: string
    enum: ['active', 'inactive', 'trial']
    default: 'trial'
    description: Organization status
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      contactEmail:
        type: string
        format: email
      contactPhone:
        type: string
        nullable: true
      logoUrl:
        type: string
        nullable: true
      address:
        type: string
        nullable: true
      city:
        type: string
        nullable: true
      country:
        type: string
      primaryColor:
        type: string
        nullable: true
      secondaryColor:
        type: string
        nullable: true
      defaultLanguage:
        type: string
      status:
        type: string
      createdAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Organization with the same name already exists

#### GET /organizations/:id

Get detailed information about a specific organization.

**Security**: Requires authentication (admin can access any organization, club_admin can access their own organization)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Organization ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      contactEmail:
        type: string
        format: email
      contactPhone:
        type: string
        nullable: true
      logoUrl:
        type: string
        nullable: true
      address:
        type: string
        nullable: true
      city:
        type: string
        nullable: true
      country:
        type: string
      primaryColor:
        type: string
        nullable: true
      secondaryColor:
        type: string
        nullable: true
      defaultLanguage:
        type: string
      status:
        type: string
        enum: ['active', 'inactive', 'trial']
      teams:
        type: array
        items:
          type: object
          properties:
            id:
              type: string
              format: uuid
            name:
              type: string
            category:
              type: string
            status:
              type: string
      admins:
        type: array
        items:
          type: object
          properties:
            id:
              type: string
              format: uuid
            firstName:
              type: string
            lastName:
              type: string
            email:
              type: string
              format: email
      createdAt:
        type: string
        format: date-time
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found

#### PUT /organizations/:id

Update an organization's information.

**Security**: Requires authentication (admin can update any organization, club_admin can update their own organization)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Organization ID
```

**Request Body Schema**:
```yaml
type: object
properties:
  name:
    type: string
    minLength: 1
    maxLength: 100
  contactEmail:
    type: string
    format: email
  contactPhone:
    type: string
    pattern: '^\+?[0-9]{8,15}
  logoUrl:
    type: string
    format: uri
  address:
    type: string
  city:
    type: string
    maxLength: 100
  country:
    type: string
    maxLength: 100
  primaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})
  secondaryColor:
    type: string
    pattern: '^#([A-Fa-f0-9]{6})
  defaultLanguage:
    type: string
    enum: ['sv', 'en']
  status:
    type: string
    enum: ['active', 'inactive', 'trial']
    description: Only admin can change status
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      name:
        type: string
      contactEmail:
        type: string
        format: email
      contactPhone:
        type: string
        nullable: true
      logoUrl:
        type: string
        nullable: true
      address:
        type: string
        nullable: true
      city:
        type: string
        nullable: true
      country:
        type: string
      primaryColor:
        type: string
        nullable: true
      secondaryColor:
        type: string
        nullable: true
      defaultLanguage:
        type: string
      status:
        type: string
      updatedAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found

### Parent-Child Relationship Endpoints

#### GET /users/:id/children

Get a list of children linked to a parent user.

**Security**: Requires authentication (parent can view own children, admin/club_admin can view any parent's children)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Parent user ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        linkId:
          type: string
          format: uuid
          description: Parent-child link ID
        childId:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        relationship:
          type: string
          enum: ['parent', 'guardian', 'other']
        isPrimary:
          type: boolean
        teams:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
                format: uuid
              name:
                type: string
              role:
                type: string
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### GET /users/:id/parents

Get a list of parents linked to a child user.

**Security**: Requires authentication (player can view own parents, coach can view team players' parents, admin/club_admin can view any player's parents)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Child/player user ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        linkId:
          type: string
          format: uuid
          description: Parent-child link ID
        parentId:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string
          nullable: true
        relationship:
          type: string
          enum: ['parent', 'guardian', 'other']
        isPrimary:
          type: boolean
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### POST /parent-child

Create a parent-child relationship.

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Request Body Schema**:
```yaml
type: object
required:
  - parentId
  - childId
  - relationship
properties:
  parentId:
    type: string
    format: uuid
    description: Parent user ID
  childId:
    type: string
    format: uuid
    description: Child user ID
  relationship:
    type: string
    enum: ['parent', 'guardian', 'other']
    default: 'parent'
    description: Relationship type
  isPrimary:
    type: boolean
    default: false
    description: Whether this is the primary parent/guardian
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: string
        format: uuid
      parentId:
        type: string
        format: uuid
      childId:
        type: string
        format: uuid
      relationship:
        type: string
      isPrimary:
        type: boolean
      createdAt:
        type: string
        format: date-time
```

**Error Responses**:
- `400 Bad Request`: Validation error or relationship already exists
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Parent or child user not found
- `409 Conflict`: Relationship already exists

#### DELETE /parent-child/:id

Remove a parent-child relationship.

**Security**: Requires authentication and appropriate role (admin, club_admin)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Parent-child link ID
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Parent-child relationship removed successfully"
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Relationship not found

### Role Endpoints

#### GET /roles

Get a list of available roles.

**Security**: Requires authentication

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          enum: ['admin', 'club_admin', 'coach', 'fys_coach', 'rehab', 'equipment_manager', 'player', 'parent']
        description:
          type: string
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

#### POST /users/:id/roles

Assign a role to a user.

**Security**: Requires authentication and appropriate role (admin can assign any role, club_admin can assign only non-admin roles within their organization)

**Path Parameters**:
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
```

**Request Body Schema**:
```yaml
type: object
required:
  - roleId
properties:
  roleId:
    type: string
    format: uuid
    description: Role ID to assign
```

**Response (201 Created)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Role assigned successfully"
```

**Error Responses**:
- `400 Bad Request`: Validation error or role already assigned
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User or role not found
- `409 Conflict`: User already has this role

#### DELETE /users/:userId/roles/:roleId

Remove a role from a user.

**Security**: Requires authentication and appropriate role (admin can remove any role, club_admin can remove only non-admin roles within their organization)

**Path Parameters**:
```yaml
parameters:
  - name: userId
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: User ID
  - name: roleId
    in: path
    required: true
    schema:
      type: string
      format: uuid
    description: Role ID to remove
```

**Response (200 OK)**:
```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: "Role removed successfully"
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User, role, or assignment not found

## Error Handling

### Standard Error Response

All API endpoints follow a consistent error response format:

```yaml
type: object
properties:
  error:
    type: boolean
    example: true
  message:
    type: string
    description: Human-readable error message
  code:
    type: string
    description: Error code for client-side handling
  category:
    type: string
    enum: ['AUTHENTICATION', 'AUTHORIZATION', 'VALIDATION', 'RESOURCE_CONFLICT', 'EXTERNAL_SERVICE', 'INTERNAL_ERROR']
    description: Category of error
  details:
    type: object
    description: Additional error details (e.g., validation errors)
  timestamp:
    type: string
    format: date-time
    description: When the error occurred
  path:
    type: string
    description: API endpoint where error occurred
  transactionId:
    type: string
    description: Unique ID for tracking error in logs
```

### Common Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `INVALID_CREDENTIALS` | AUTHENTICATION | Email or password is incorrect |
| `TOKEN_EXPIRED` | AUTHENTICATION | JWT token has expired |
| `INVALID_TOKEN` | AUTHENTICATION | JWT token is invalid or malformed |
| `INSUFFICIENT_PERMISSIONS` | AUTHORIZATION | User doesn't have permission for the operation |
| `VALIDATION_ERROR` | VALIDATION | Request validation failed |
| `RESOURCE_NOT_FOUND` | VALIDATION | Requested resource doesn't exist |
| `RESOURCE_ALREADY_EXISTS` | RESOURCE_CONFLICT | Resource with the same unique identifiers already exists |
| `DATA_INTEGRITY_VIOLATION` | RESOURCE_CONFLICT | Operation would violate data integrity constraints |
| `EXTERNAL_SERVICE_ERROR` | EXTERNAL_SERVICE | Error in communication with external service |
| `INTERNAL_SERVER_ERROR` | INTERNAL_ERROR | Unexpected server error |

## Data Types

### User Object

```yaml
type: object
properties:
  id:
    type: string
    format: uuid
  email:
    type: string
    format: email
  firstName:
    type: string
  lastName:
    type: string
  phone:
    type: string
    nullable: true
  preferredLanguage:
    type: string
    enum: ['sv', 'en']
  status:
    type: string
    enum: ['active', 'inactive', 'pending']
  lastLogin:
    type: string
    format: date-time
    nullable: true
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
```

### Team Object

```yaml
type: object
properties:
  id:
    type: string
    format: uuid
  name:
    type: string
  organizationId:
    type: string
    format: uuid
  category:
    type: string
    nullable: true
  season:
    type: string
    nullable: true
  logoUrl:
    type: string
    nullable: true
  primaryColor:
    type: string
    nullable: true
  description:
    type: string
    nullable: true
  status:
    type: string
    enum: ['active', 'inactive', 'archived']
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
```

### Organization Object

```yaml
type: object
properties:
  id:
    type: string
    format: uuid
  name:
    type: string
  contactEmail:
    type: string
    format: email
  contactPhone:
    type: string
    nullable: true
  logoUrl:
    type: string
    nullable: true
  address:
    type: string
    nullable: true
  city:
    type: string
    nullable: true
  country:
    type: string
  primaryColor:
    type: string
    nullable: true
  secondaryColor:
    type: string
    nullable: true
  defaultLanguage:
    type: string
    enum: ['sv', 'en']
  status:
    type: string
    enum: ['active', 'inactive', 'trial']
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
```

### Role Object

```yaml
type: object
properties:
  id:
    type: string
    format: uuid
  name:
    type: string
    enum: ['admin', 'club_admin', 'coach', 'fys_coach', 'rehab', 'equipment_manager', 'player', 'parent']
  description:
    type: string
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
```

## Pagination Response Format

For list endpoints that support pagination:

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      # Resource-specific properties
  meta:
    type: object
    properties:
      pagination:
        type: object
        properties:
          page:
            type: integer
            description: Current page number
          limit:
            type: integer
            description: Items per page
          total:
            type: integer
            description: Total items available
          pages:
            type: integer
            description: Total pages available
```

## Feature Mapping to User Roles

| Feature | admin | club_admin | coach | fys_coach | rehab | equipment_manager | player | parent |
|---------|-------|------------|-------|-----------|-------|-------------------|--------|--------|
| View all organizations | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create organizations | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View organization details | ✓ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ | ✓¹ |
| Update organization | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View all teams | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create teams | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View team details | ✓ | ✓¹ | ✓² | ✓² | ✓² | ✓² | ✓² | ✓³ |
| Update team | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete team | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Add team members | ✓ | ✓¹ | ✓² | ✗ | ✗ | ✗ | ✗ | ✗ |
| View all users | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create users | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View user details | ✓ | ✓¹ | ✓⁴ | ✓⁴ | ✓⁴ | ✓⁴ | ✓⁵ | ✓⁵ |
| Update user | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✓⁵ | ✓⁵ |
| Delete user | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Assign roles | ✓ | ✓⁶ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage parent-child links | ✓ | ✓¹ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

¹ Limited to their own organization  
² Limited to their assigned teams  
³ Limited to their child's teams  
⁴ Limited to members of their assigned teams  
⁵ Limited to own user data  
⁶ Cannot assign admin role
