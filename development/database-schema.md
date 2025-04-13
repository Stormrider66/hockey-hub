# Hockey App - Comprehensive Database Schema

## Overview

This document defines the complete database schema for the Hockey App platform, organized by microservice. For each service, we provide detailed table definitions including columns, data types, constraints, relationships, and indexing strategies. This schema serves as the foundation for data persistence across the entire system.

## Database Technology

- **Database System**: PostgreSQL 17
- **Connection Management**: Connection pooling via TypeORM
- **Migration Strategy**: TypeORM migrations
- **Schema Organization**: Service-specific schemas with some shared tables

## Common Data Types and Conventions

- **Primary Keys**: UUID v4
- **Timestamps**: All tables include `created_at` and `updated_at` timestamps
- **Soft Delete**: Where applicable, tables use `deleted_at` for soft deletion
- **JSON Storage**: Complex structures use JSONB for efficient storage and querying
- **Text Handling**: VARCHAR for fixed-length text, TEXT for variable length
- **Date/Time**: TIMESTAMP WITH TIME ZONE for all date/time fields

## Schema: User Service (user-service)

### Table: users
Stores core user information for all users of the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| phone | VARCHAR(20) | NULL | User's phone number |
| preferred_language | VARCHAR(10) | NOT NULL DEFAULT 'sv' | User's preferred language (e.g., 'sv', 'en') |
| status | ENUM | NOT NULL DEFAULT 'active' | User status: 'active', 'inactive', 'pending' |
| last_login | TIMESTAMP WITH TIME ZONE | NULL | Timestamp of last login |
| avatar_url | VARCHAR(255) | NULL | URL to user's profile picture |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `email`
- Index: `status`
- Index: `preferred_language`

### Table: roles
Defines available roles in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (e.g., 'admin', 'coach', 'player') |
| description | TEXT | NULL | Description of the role |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `name`

### Table: user_roles
Junction table for many-to-many relationship between users and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | FK, NOT NULL | Reference to users.id |
| role_id | UUID | FK, NOT NULL | Reference to roles.id |

**Indexes:**
- Primary Key: `(user_id, role_id)` (Composite)
- Index: `user_id`
- Index: `role_id`

**Foreign Keys:**
- `user_id` REFERENCES users(id) ON DELETE CASCADE
- `role_id` REFERENCES roles(id) ON DELETE CASCADE

### Table: organizations
Defines hockey organizations/clubs in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Organization name |
| contact_email | VARCHAR(255) | NOT NULL | Primary contact email |
| contact_phone | VARCHAR(20) | NULL | Primary contact phone |
| logo_url | VARCHAR(255) | NULL | Organization logo URL |
| address | VARCHAR(255) | NULL | Physical address |
| city | VARCHAR(100) | NULL | City location |
| country | VARCHAR(100) | NULL DEFAULT 'Sweden' | Country |
| primary_color | VARCHAR(7) | NULL | Primary brand color (hex) |
| secondary_color | VARCHAR(7) | NULL | Secondary brand color (hex) |
| default_language | VARCHAR(10) | NOT NULL DEFAULT 'sv' | Default language |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'active', 'inactive', 'trial' |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `name` 
- Index: `status`

### Table: teams
Defines teams within organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id |
| name | VARCHAR(100) | NOT NULL | Team name |
| category | VARCHAR(100) | NULL | Team category (age group, skill level) |
| season | VARCHAR(20) | NULL | Season identifier |
| logo_url | VARCHAR(255) | NULL | Team-specific logo URL |
| primary_color | VARCHAR(7) | NULL | Team primary color (hex) |
| description | TEXT | NULL | Team description |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'active', 'inactive', 'archived' |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Index: `status`
- Index: `(organization_id, status)`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE

### Table: team_members
Defines relationships between users and teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| team_id | UUID | FK, NOT NULL | Reference to teams.id |
| user_id | UUID | FK, NOT NULL | Reference to users.id |
| role | ENUM | NOT NULL | Role in team: 'player', 'coach', 'assistant_coach', 'manager', 'staff' |
| position | VARCHAR(50) | NULL | Player position ('forward', 'defense', 'goalkeeper') |
| jersey_number | VARCHAR(10) | NULL | Player's jersey number |
| start_date | DATE | NOT NULL | Date when user joined the team |
| end_date | DATE | NULL | Date when user left the team (if applicable) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(team_id, user_id, role)` (A user can have only one specific role in a team)
- Index: `team_id`
- Index: `user_id`
- Index: `role`

**Foreign Keys:**
- `team_id` REFERENCES teams(id) ON DELETE CASCADE
- `user_id` REFERENCES users(id) ON DELETE CASCADE

### Table: player_parent_links
Links parent accounts to player accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| parent_id | UUID | FK, NOT NULL | Reference to parent user.id |
| child_id | UUID | FK, NOT NULL | Reference to child/player user.id |
| relationship | ENUM | NOT NULL DEFAULT 'parent' | Relationship type: 'parent', 'guardian', 'other' |
| is_primary | BOOLEAN | NOT NULL DEFAULT false | Whether this is the primary parent/guardian |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(parent_id, child_id)` (Can't link the same parent-child twice)
- Index: `parent_id`
- Index: `child_id`
- Index: `is_primary`

**Foreign Keys:**
- `parent_id` REFERENCES users(id) ON DELETE CASCADE
- `child_id` REFERENCES users(id) ON DELETE CASCADE

### Table: refresh_tokens
Stores refresh tokens for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| user_id | UUID | FK, NOT NULL | Reference to users.id |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Refresh token value |
| expires_at | TIMESTAMP WITH TIME ZONE | NOT NULL | Expiration timestamp |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| revoked | BOOLEAN | NOT NULL DEFAULT false | Whether token has been revoked |
| revoked_reason | VARCHAR(100) | NULL | Reason for revocation if applicable |

**Indexes:**
- Primary Key: `id`
- Unique Index: `token`
- Index: `user_id`
- Index: `expires_at`
- Index: `(user_id, revoked)`

**Foreign Keys:**
- `user_id` REFERENCES users(id) ON DELETE CASCADE

## Schema: Calendar Service (calendar-service)

### Table: events
Stores all calendar events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| title | VARCHAR(255) | NOT NULL | Event title |
| description | TEXT | NULL | Event description |
| start_time | TIMESTAMP WITH TIME ZONE | NOT NULL | Event start time |
| end_time | TIMESTAMP WITH TIME ZONE | NOT NULL | Event end time |
| event_type_id | UUID | FK, NOT NULL | Reference to event_types.id |
| location_id | UUID | FK, NULL | Reference to locations.id |
| team_id | UUID | FK, NULL | Reference to teams.id from user-service |
| created_by | UUID | FK, NOT NULL | Reference to users.id from user-service |
| recurrence_rule | TEXT | NULL | iCalendar format recurrence rule |
| parent_event_id | UUID | FK, NULL | For recurring event instances, reference to parent event |
| status | ENUM | NOT NULL DEFAULT 'scheduled' | Status: 'scheduled', 'canceled', 'completed' |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `event_type_id`
- Index: `location_id`
- Index: `team_id`
- Index: `created_by`
- Index: `parent_event_id`
- Index: `status`
- Index: `start_time`
- Index: `end_time`
- Index: `(team_id, start_time)` (For efficient team calendar lookup)
- Index: `(location_id, start_time, end_time)` (For efficient resource conflict detection)

**Foreign Keys:**
- `event_type_id` REFERENCES event_types(id)
- `location_id` REFERENCES locations(id) ON DELETE SET NULL
- `parent_event_id` REFERENCES events(id) ON DELETE CASCADE

### Table: event_types
Defines types of calendar events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Event type name |
| color | VARCHAR(7) | NOT NULL | Color for displaying events (hex) |
| icon | VARCHAR(100) | NULL | Icon identifier for the event type |
| description | TEXT | NULL | Description of the event type |
| default_duration | INTEGER | NULL | Default duration in minutes |
| organization_id | UUID | FK, NULL | If org-specific, reference to organizations.id. NULL for system types |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Unique Index: `(name, organization_id)` (Unique event type names per organization)

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: locations
Defines places where events can occur.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Location name |
| address | VARCHAR(255) | NULL | Physical address |
| city | VARCHAR(100) | NULL | City |
| postal_code | VARCHAR(20) | NULL | Postal code |
| country | VARCHAR(100) | NULL DEFAULT 'Sweden' | Country |
| coordinates | JSONB | NULL | Geo coordinates: {latitude: X, longitude: Y} |
| parent_location_id | UUID | FK, NULL | Reference to parent location for complex venues |
| description | TEXT | NULL | Location description |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `parent_location_id`
- Index: `organization_id`
- Index: `city`
- Index: `(organization_id, name)` (Fast lookup for location selection)

**Foreign Keys:**
- `parent_location_id` REFERENCES locations(id) ON DELETE CASCADE
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: resource_types
Categorizes different types of bookable resources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Resource type name (e.g., 'Ice Rink', 'Gym') |
| color | VARCHAR(7) | NOT NULL | Color for display (hex) |
| icon | VARCHAR(100) | NULL | Icon identifier |
| description | TEXT | NULL | Resource type description |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Unique Index: `(name, organization_id)` (Unique resource type names per organization)

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: resources
Defines specific bookable resources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Resource name |
| resource_type_id | UUID | FK, NOT NULL | Reference to resource_types.id |
| location_id | UUID | FK, NOT NULL | Reference to locations.id |
| capacity | INTEGER | NULL | Resource capacity (people) |
| description | TEXT | NULL | Resource description |
| available_from | TIME | NULL | Time of day when resource becomes available |
| available_to | TIME | NULL | Time of day when resource becomes unavailable |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `resource_type_id`
- Index: `location_id`
- Index: `organization_id`
- Unique Index: `(name, location_id)` (Unique resource names within a location)

**Foreign Keys:**
- `resource_type_id` REFERENCES resource_types(id)
- `location_id` REFERENCES locations(id) ON DELETE CASCADE
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: event_resources
Junction table linking events to resources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | UUID | FK, NOT NULL | Reference to events.id |
| resource_id | UUID | FK, NOT NULL | Reference to resources.id |
| booking_note | TEXT | NULL | Note related to this specific resource booking |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary Key: `(event_id, resource_id)` (Composite)
- Index: `event_id`
- Index: `resource_id`

**Foreign Keys:**
- `event_id` REFERENCES events(id) ON DELETE CASCADE
- `resource_id` REFERENCES resources(id) ON DELETE CASCADE

### Table: event_participants
Defines attendees for events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | UUID | FK, NOT NULL | Reference to events.id |
| user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| status | ENUM | NOT NULL DEFAULT 'invited' | Status: 'invited', 'confirmed', 'declined', 'tentative' |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `(event_id, user_id)` (Composite)
- Index: `event_id`
- Index: `user_id`
- Index: `status`

**Foreign Keys:**
- `event_id` REFERENCES events(id) ON DELETE CASCADE

## Schema: Training Service (training-service)

### Table: physical_session_templates
Defines templates for physical training sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Template name |
| category_id | UUID | FK, NOT NULL | Reference to physical_session_categories.id |
| description | TEXT | NULL | Template description |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| structure | JSONB | NOT NULL | Session structure including sections and exercises |
| is_public | BOOLEAN | NOT NULL DEFAULT false | Whether template is shared with other coaches |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `category_id`
- Index: `created_by_user_id`
- Index: `organization_id`
- Index: `is_public`
- Index: `((structure->>'target_group'))` (JSONB path index for searching by target group)

**Foreign Keys:**
- `category_id` REFERENCES physical_session_categories(id)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: physical_session_categories
Categorizes training session templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Category name (e.g., 'Strength', 'Conditioning') |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `created_by_user_id`
- Index: `organization_id`
- Unique Index: `(name, organization_id)` (Unique category names per organization)

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: exercises
Library of physical exercises.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Exercise name |
| category | VARCHAR(100) | NOT NULL | Category (e.g., 'Upper Body', 'Core') |
| difficulty | ENUM | NOT NULL | Difficulty: 'beginner', 'intermediate', 'advanced' |
| equipment | VARCHAR[] | NULL | Array of required equipment |
| muscle_groups | VARCHAR[] | NULL | Array of targeted muscle groups |
| description | TEXT | NOT NULL | Exercise description |
| instructions | TEXT | NOT NULL | Execution instructions |
| video_url | VARCHAR(255) | NULL | URL to instructional video |
| image_url | VARCHAR(255) | NULL | URL to image |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| organization_id | UUID | FK, NULL | Reference to organizations.id (NULL for system-wide exercises) |
| is_public | BOOLEAN | NOT NULL DEFAULT false | Whether exercise is shared with all organizations |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `category`
- Index: `difficulty`
- Index: `created_by_user_id`
- Index: `organization_id`
- Index: `is_public`
- Index: using GIN on `equipment` (Array index for equipment search)
- Index: using GIN on `muscle_groups` (Array index for muscle group search)

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: scheduled_physical_sessions
Scheduled instances of training sessions for players/teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| template_id | UUID | FK, NOT NULL | Reference to physical_session_templates.id |
| title | VARCHAR(255) | NOT NULL | Session title |
| calendar_event_id | UUID | NULL | Reference to events.id in calendar-service |
| assigned_to_user_id | UUID | FK, NULL | For individual session, reference to users.id |
| assigned_to_team_id | UUID | FK, NULL | For team session, reference to teams.id |
| status | ENUM | NOT NULL DEFAULT 'scheduled' | Status: 'scheduled', 'in_progress', 'completed', 'canceled' |
| scheduled_date | DATE | NOT NULL | Date of session |
| start_time | TIME | NULL | Start time |
| end_time | TIME | NULL | End time |
| notes | TEXT | NULL | Additional notes |
| resolved_structure | JSONB | NOT NULL | Session structure with calculated individual values |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `template_id`
- Index: `calendar_event_id`
- Index: `assigned_to_user_id`
- Index: `assigned_to_team_id`
- Index: `status`
- Index: `scheduled_date`
- Index: `created_by_user_id`
- Index: `organization_id`

**Foreign Keys:**
- `template_id` REFERENCES physical_session_templates(id)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: test_definitions
Definitions of physical tests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Test name |
| category | VARCHAR(100) | NOT NULL | Category (e.g., 'Strength', 'Speed') |
| description | TEXT | NOT NULL | Test description |
| unit | VARCHAR(50) | NOT NULL | Measurement unit (e.g., 'kg', 'seconds') |
| protocol | TEXT | NOT NULL | Detailed test protocol |
| is_higher_better | BOOLEAN | NOT NULL DEFAULT true | Whether higher values are better |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| organization_id | UUID | FK, NULL | Reference to organizations.id (NULL for system-wide tests) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `category`
- Index: `created_by_user_id`
- Index: `organization_id`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: test_norm_values
Reference values for test result interpretation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| test_id | UUID | FK, NOT NULL | Reference to test_definitions.id |
| age_min | INTEGER | NOT NULL | Minimum age for this norm |
| age_max | INTEGER | NOT NULL | Maximum age for this norm |
| gender | ENUM | NOT NULL | Gender: 'male', 'female', 'any' |
| position | VARCHAR(50) | NULL | Player position if position-specific |
| min_value | DECIMAL(10,2) | NOT NULL | Minimum expected value |
| average_value | DECIMAL(10,2) | NOT NULL | Average expected value |
| max_value | DECIMAL(10,2) | NOT NULL | Maximum expected value |
| organization_id | UUID | FK, NULL | Reference to organizations.id if organization-specific |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `test_id`
- Index: `(age_min, age_max)`
- Index: `gender`
- Index: `position`
- Index: `organization_id`

**Foreign Keys:**
- `test_id` REFERENCES test_definitions(id) ON DELETE CASCADE
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: test_results
Individual test results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| test_id | UUID | FK, NOT NULL | Reference to test_definitions.id |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| date | DATE | NOT NULL | Test date |
| value | DECIMAL(10,2) | NOT NULL | Result value |
| notes | TEXT | NULL | Additional notes |
| administrator_id | UUID | FK, NOT NULL | User who administered the test |
| team_id | UUID | FK, NULL | Team context if applicable |
| batch_id | UUID | FK, NULL | If part of a test batch, reference to test_batches.id |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `test_id`
- Index: `player_id`
- Index: `date`
- Index: `administrator_id`
- Index: `team_id`
- Index: `batch_id`
- Index: `(player_id, test_id, date)` (For efficient player history lookup)

**Foreign Keys:**
- `test_id` REFERENCES test_definitions(id)
- `team_id` REFERENCES teams(id) (FK to user-service)
- `batch_id` REFERENCES test_batches(id) ON DELETE SET NULL

### Table: test_batches
Groups of tests administered together.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Batch name |
| description | TEXT | NULL | Batch description |
| scheduled_date | DATE | NOT NULL | Date scheduled |
| team_id | UUID | FK, NULL | Team if team-wide |
| created_by_user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| calendar_event_id | UUID | NULL | Reference to events.id in calendar-service |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `team_id`
- Index: `scheduled_date`
- Index: `created_by_user_id`
- Index: `calendar_event_id`
- Index: `organization_id`

**Foreign Keys:**
- `team_id` REFERENCES teams(id) (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: session_attendance
Attendance for training sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | UUID | FK, NOT NULL | Reference to scheduled_physical_sessions.id |
| user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| status | ENUM | NOT NULL | Status: 'present', 'absent', 'excused', 'late' |
| arrival_time | TIMESTAMP WITH TIME ZONE | NULL | Time of arrival |
| departure_time | TIMESTAMP WITH TIME ZONE | NULL | Time of departure |
| reason | TEXT | NULL | Reason for absence/lateness |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `(session_id, user_id)` (Composite)
- Index: `session_id`
- Index: `user_id`
- Index: `status`

**Foreign Keys:**
- `session_id` REFERENCES scheduled_physical_sessions(id) ON DELETE CASCADE

## Schema: Medical Service (medical-service)

### Table: injuries
Records injuries and their details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| date_occurred | DATE | NOT NULL | Date injury occurred |
| date_reported | DATE | NOT NULL | Date injury was reported |
| body_part | VARCHAR(100) | NOT NULL | Affected body part |
| injury_type | VARCHAR(100) | NOT NULL | Type of injury |
| mechanism | TEXT | NULL | How injury occurred |
| severity | ENUM | NOT NULL | Severity: 'minor', 'moderate', 'major', 'severe' |
| description | TEXT | NULL | Detailed description |
| diagnosis | TEXT | NULL | Medical diagnosis |
| initial_treatment | TEXT | NULL | Initial treatment provided |
| estimated_recovery_time | INTEGER | NULL | Estimated days to recovery |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| reported_by_user_id | UUID | FK, NOT NULL | User who reported the injury |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `date_occurred`
- Index: `body_part`
- Index: `injury_type`
- Index: `severity`
- Index: `team_id`
- Index: `reported_by_user_id`
- Index: `organization_id`
- Index: `(player_id, date_occurred)` (For player history lookup)

**Foreign Keys:**
- `team_id` REFERENCES teams(id) (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: injury_updates
Progress notes for injury recovery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| injury_id | UUID | FK, NOT NULL | Reference to injuries.id |
| date | DATE | NOT NULL | Update date |
| note | TEXT | NOT NULL | Progress note content |
| created_by_user_id | UUID | FK, NOT NULL | User who created the note |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `injury_id`
- Index: `date`
- Index: `created_by_user_id`

**Foreign Keys:**
- `injury_id` REFERENCES injuries(id) ON DELETE CASCADE

### Table: treatments
Records treatments performed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| injury_id | UUID | FK, NOT NULL | Reference to injuries.id |
| date | DATE | NOT NULL | Treatment date |
| treatment_type | VARCHAR(100) | NOT NULL | Type of treatment |
| notes | TEXT | NULL | Treatment notes |
| duration | INTEGER | NULL | Duration in minutes |
| response | TEXT | NULL | Player's response to treatment |
| performed_by_user_id | UUID | FK, NOT NULL | User who performed treatment |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `injury_id`
- Index: `date`
- Index: `treatment_type`
- Index: `performed_by_user_id`
- Index: `(injury_id, date)` (For chronological treatment history)

**Foreign Keys:**
- `injury_id` REFERENCES injuries(id) ON DELETE CASCADE

### Table: treatment_plans
Structured rehabilitation plans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| injury_id | UUID | FK, NOT NULL | Reference to injuries.id |
| phase | VARCHAR(100) | NOT NULL | Rehabilitation phase (e.g., 'acute', 'progressive') |
| description | TEXT | NOT NULL | Phase description |
| expected_duration | INTEGER | NOT NULL | Expected days in this phase |
| goals | TEXT | NOT NULL | Goals for this phase |
| precautions | TEXT | NULL | Precautions and contraindications |
| created_by_user_id | UUID | FK, NOT NULL | User who created plan |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `injury_id`
- Index: `phase`
- Index: `created_by_user_id`

**Foreign Keys:**
- `injury_id` REFERENCES injuries(id) ON DELETE CASCADE

### Table: treatment_plan_items
Specific activities in a treatment plan.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| treatment_plan_id | UUID | FK, NOT NULL | Reference to treatment_plans.id |
| description | TEXT | NOT NULL | Activity description |
| frequency | VARCHAR(100) | NOT NULL | How often to perform (e.g., '3x daily') |
| duration | VARCHAR(100) | NOT NULL | Duration specification |
| sets | INTEGER | NULL | Number of sets if applicable |
| reps | INTEGER | NULL | Repetitions per set if applicable |
| progression_criteria | TEXT | NULL | Criteria to progress this exercise |
| exercise_id | UUID | FK, NULL | Reference to exercises.id in training-service |
| sequence | INTEGER | NOT NULL | Order within the plan |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `treatment_plan_id`
- Index: `exercise_id`
- Index: `sequence`

**Foreign Keys:**
- `treatment_plan_id` REFERENCES treatment_plans(id) ON DELETE CASCADE

### Table: player_availability_status
Current participation status of players.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| current_status | ENUM | NOT NULL | Status: 'full', 'limited', 'individual', 'rehab_only', 'unavailable' |
| notes | TEXT | NULL | Additional notes on restrictions |
| effective_from | DATE | NOT NULL | Start date of this status |
| expected_end_date | DATE | NULL | Expected end date if applicable |
| injury_id | UUID | FK, NULL | Related injury if applicable |
| updated_by_user_id | UUID | FK, NOT NULL | User who updated status |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `current_status`
- Index: `effective_from`
- Index: `expected_end_date`
- Index: `injury_id`
- Index: `updated_by_user_id`
- Index: `team_id`
- Index: `(player_id, effective_from)` (For history of status changes)
- Index: `(team_id, current_status)` (For team availability overview)

**Foreign Keys:**
- `injury_id` REFERENCES injuries(id) ON DELETE SET NULL
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: player_medical_info
Permanent medical information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| allergies | TEXT | NULL | Known allergies |
| medical_conditions | TEXT | NULL | Chronic conditions |
| medications | TEXT | NULL | Regular medications |
| surgical_history | TEXT | NULL | Past surgical procedures |
| family_history | TEXT | NULL | Relevant family medical history |
| blood_type | VARCHAR(10) | NULL | Blood type if known |
| emergency_contact_name | VARCHAR(255) | NULL | Emergency contact person |
| emergency_contact_phone | VARCHAR(20) | NULL | Emergency contact number |
| emergency_contact_relation | VARCHAR(100) | NULL | Relationship to player |
| updated_by_user_id | UUID | FK, NOT NULL | Medical staff who updated |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `player_id` (One medical record per player)
- Index: `updated_by_user_id`
- Index: `team_id`

**Foreign Keys:**
- `player_id` REFERENCES users(id) ON DELETE CASCADE (FK to user-service)
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: medical_documents
Medical-related document storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| title | VARCHAR(255) | NOT NULL | Document title |
| document_type | VARCHAR(100) | NOT NULL | Type (e.g., 'X-ray', 'MRI', 'Report') |
| file_path | VARCHAR(255) | NOT NULL | Path to stored file |
| file_size | INTEGER | NOT NULL | Size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| injury_id | UUID | FK, NULL | Related injury if applicable |
| uploaded_by_user_id | UUID | FK, NOT NULL | User who uploaded the document |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `document_type`
- Index: `injury_id`
- Index: `uploaded_by_user_id`
- Index: `team_id`

**Foreign Keys:**
- `player_id` REFERENCES users(id) ON DELETE CASCADE (FK to user-service)
- `injury_id` REFERENCES injuries(id) ON DELETE SET NULL
- `team_id` REFERENCES teams(id) (FK to user-service)

## Schema: Communication Service (communication-service)

### Table: chats
Defines conversation channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| chat_type | ENUM | NOT NULL | Type: 'private', 'group', 'announcement' |
| name | VARCHAR(255) | NULL | Chat name (for groups) |
| description | TEXT | NULL | Description |
| team_id | UUID | FK, NULL | Team associated with chat if applicable |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_by_user_id | UUID | FK, NOT NULL | User who created the chat |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `chat_type`
- Index: `team_id`
- Index: `organization_id`
- Index: `created_by_user_id`

**Foreign Keys:**
- `team_id` REFERENCES teams(id) (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: chat_participants
Links users to chats.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| chat_id | UUID | FK, NOT NULL | Reference to chats.id |
| user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| role | ENUM | NOT NULL DEFAULT 'member' | Role: 'admin', 'member' |
| joined_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | When user joined |
| last_read_at | TIMESTAMP WITH TIME ZONE | NULL | Timestamp of last read |
| mute_notifications | BOOLEAN | NOT NULL DEFAULT false | Whether notifications are muted |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `(chat_id, user_id)` (Composite)
- Index: `chat_id`
- Index: `user_id`
- Index: `role`
- Index: `last_read_at`

**Foreign Keys:**
- `chat_id` REFERENCES chats(id) ON DELETE CASCADE

### Table: messages
Stores chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| chat_id | UUID | FK, NOT NULL | Reference to chats.id |
| sender_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| message_type | ENUM | NOT NULL DEFAULT 'text' | Type: 'text', 'image', 'file', 'system' |
| content | TEXT | NOT NULL | Message content |
| metadata | JSONB | NULL | Additional message metadata |
| reply_to_id | UUID | FK, NULL | If reply, reference to parent message |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Soft delete timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `chat_id`
- Index: `sender_id`
- Index: `message_type`
- Index: `reply_to_id`
- Index: `created_at`
- Index: `(chat_id, created_at)` (For message history retrieval)

**Foreign Keys:**
- `chat_id` REFERENCES chats(id) ON DELETE CASCADE
- `reply_to_id` REFERENCES messages(id) ON DELETE SET NULL

### Table: message_reads
Tracks read status of messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| message_id | UUID | FK, NOT NULL | Reference to messages.id |
| user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| read_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | When message was read |

**Indexes:**
- Primary Key: `(message_id, user_id)` (Composite)
- Index: `message_id`
- Index: `user_id`
- Index: `read_at`

**Foreign Keys:**
- `message_id` REFERENCES messages(id) ON DELETE CASCADE

### Table: attachments
Stores file attachments for messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| message_id | UUID | FK, NOT NULL | Reference to messages.id |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_size | INTEGER | NOT NULL | Size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| file_path | VARCHAR(255) | NOT NULL | Path to stored file |
| thumbnail_path | VARCHAR(255) | NULL | Path to thumbnail if applicable |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `message_id`
- Index: `mime_type`

**Foreign Keys:**
- `message_id` REFERENCES messages(id) ON DELETE CASCADE

### Table: notifications
System notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| user_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| type | ENUM | NOT NULL | Type: 'message', 'event', 'system', 'approval' |
| title | VARCHAR(255) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification content |
| link_type | VARCHAR(100) | NULL | Type of resource being linked to |
| link_id | UUID | NULL | ID of linked resource |
| is_read | BOOLEAN | NOT NULL DEFAULT false | Whether notification has been read |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| expires_at | TIMESTAMP WITH TIME ZONE | NULL | When notification expires |

**Indexes:**
- Primary Key: `id`
- Index: `user_id`
- Index: `type`
- Index: `is_read`
- Index: `created_at`
- Index: `organization_id`
- Index: `(user_id, is_read)` (For unread notifications)
- Index: `(user_id, created_at)` (For chronological listing)

**Foreign Keys:**
- `user_id` REFERENCES users(id) ON DELETE CASCADE (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

## Schema: Statistics Service (statistics-service)

### Table: player_game_stats
Individual player statistics from games.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| game_id | UUID | FK, NOT NULL | Reference to games.id |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| stat_type | VARCHAR(100) | NOT NULL | Statistic type |
| value | DECIMAL(10,2) | NOT NULL | Statistic value |
| period | INTEGER | NULL | Game period if applicable |
| created_by_user_id | UUID | FK, NOT NULL | User who recorded stat |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `game_id`
- Index: `team_id`
- Index: `stat_type`
- Index: `created_by_user_id`
- Index: `(player_id, game_id, stat_type)` (For efficient lookup)
- Index: `(game_id, stat_type)` (For game statistics summary)

**Foreign Keys:**
- `game_id` REFERENCES games(id) ON DELETE CASCADE
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: team_game_stats
Team-level statistics from games.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| game_id | UUID | FK, NOT NULL | Reference to games.id |
| stat_type | VARCHAR(100) | NOT NULL | Statistic type |
| value | DECIMAL(10,2) | NOT NULL | Statistic value |
| period | INTEGER | NULL | Game period if applicable |
| created_by_user_id | UUID | FK, NOT NULL | User who recorded stat |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `team_id`
- Index: `game_id`
- Index: `stat_type`
- Index: `created_by_user_id`
- Index: `(team_id, game_id, stat_type)` (For efficient lookup)

**Foreign Keys:**
- `game_id` REFERENCES games(id) ON DELETE CASCADE
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: games
Game information and results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| opponent_id | UUID | FK, NULL | Reference to opponent teams.id if in system |
| opponent_name | VARCHAR(255) | NULL | Opponent name if not in system |
| date | DATE | NOT NULL | Game date |
| time | TIME | NULL | Game start time |
| location_id | UUID | FK, NULL | Reference to locations.id in calendar-service |
| location_name | VARCHAR(255) | NULL | Location name if not in system |
| is_home_game | BOOLEAN | NOT NULL | Whether this is a home game |
| competition_type | VARCHAR(100) | NULL | Type of competition |
| result | ENUM | NULL | Result: 'win', 'loss', 'tie', 'not_played' |
| team_score | INTEGER | NULL | Team's score |
| opponent_score | INTEGER | NULL | Opponent's score |
| notes | TEXT | NULL | Game notes |
| calendar_event_id | UUID | NULL | Reference to events.id in calendar-service |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_by_user_id | UUID | FK, NOT NULL | User who created game record |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `team_id`
- Index: `opponent_id`
- Index: `date`
- Index: `location_id`
- Index: `competition_type`
- Index: `result`
- Index: `calendar_event_id`
- Index: `organization_id`
- Index: `created_by_user_id`
- Index: `(team_id, date)` (For team schedule)

**Foreign Keys:**
- `team_id` REFERENCES teams(id) (FK to user-service)
- `opponent_id` REFERENCES teams(id) (FK to user-service)
- `location_id` REFERENCES locations(id) (FK to calendar-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: stat_definitions
Defines statistics that can be tracked.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Statistic name |
| code | VARCHAR(50) | NOT NULL | Short code for statistic |
| type | ENUM | NOT NULL | Type: 'player', 'team', 'both' |
| unit | VARCHAR(50) | NULL | Unit of measurement |
| category | VARCHAR(100) | NOT NULL | Category (e.g., 'offense', 'defense') |
| description | TEXT | NULL | Description of statistic |
| calculation_method | VARCHAR(100) | NULL | If derived, how it's calculated |
| is_core | BOOLEAN | NOT NULL DEFAULT false | Whether this is a core statistic |
| organization_id | UUID | FK, NULL | Org-specific or NULL for system |
| sport_type | VARCHAR(50) | NOT NULL DEFAULT 'hockey' | Sport this applies to |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(code, organization_id)` (Unique codes per organization)
- Index: `type`
- Index: `category`
- Index: `is_core`
- Index: `organization_id`
- Index: `sport_type`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: custom_metrics
User-defined calculated metrics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Metric name |
| formula | TEXT | NOT NULL | Calculation formula |
| description | TEXT | NULL | Metric description |
| category | VARCHAR(100) | NULL | Metric category |
| created_by_user_id | UUID | FK, NOT NULL | User who created metric |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| is_public | BOOLEAN | NOT NULL DEFAULT false | Whether visible to all team members |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `created_by_user_id`
- Index: `organization_id`
- Index: `category`
- Index: `is_public`
- Unique Index: `(name, organization_id)` (Unique names per organization)

**Foreign Keys:**
- `created_by_user_id` REFERENCES users(id) (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: reports
Saved report configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Report name |
| type | VARCHAR(100) | NOT NULL | Report type |
| parameters | JSONB | NOT NULL | Report configuration parameters |
| user_id | UUID | FK, NOT NULL | User who created report |
| team_id | UUID | FK, NULL | Team context if applicable |
| is_favorite | BOOLEAN | NOT NULL DEFAULT false | Whether marked as favorite |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `user_id`
- Index: `team_id`
- Index: `type`
- Index: `is_favorite`
- Index: `organization_id`

**Foreign Keys:**
- `user_id` REFERENCES users(id) ON DELETE CASCADE (FK to user-service)
- `team_id` REFERENCES teams(id) (FK to user-service)
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

## Schema: Planning Service (planning-service)

### Table: seasons
Season definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| name | VARCHAR(100) | NOT NULL | Season name |
| start_date | DATE | NOT NULL | Season start date |
| end_date | DATE | NOT NULL | Season end date |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'planning', 'active', 'completed', 'archived' |
| description | TEXT | NULL | Season description |
| created_by_user_id | UUID | FK, NOT NULL | User who created season |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Index: `status`
- Index: `start_date`
- Index: `end_date`
- Index: `created_by_user_id`
- Unique Index: `(name, organization_id)` (Unique season names per organization)

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

### Table: season_phases
Phases within a season.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| season_id | UUID | FK, NOT NULL | Reference to seasons.id |
| name | VARCHAR(100) | NOT NULL | Phase name |
| start_date | DATE | NOT NULL | Phase start date |
| end_date | DATE | NOT NULL | Phase end date |
| focus_primary | VARCHAR(100) | NOT NULL | Primary training focus |
| focus_secondary | VARCHAR(100) | NULL | Secondary training focus |
| description | TEXT | NULL | Phase description |
| sequence | INTEGER | NOT NULL | Order within season |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `season_id`
- Index: `start_date`
- Index: `end_date`
- Index: `sequence`

**Foreign Keys:**
- `season_id` REFERENCES seasons(id) ON DELETE CASCADE

### Table: team_goals
Team-level objectives.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| season_id | UUID | FK, NOT NULL | Reference to seasons.id |
| description | TEXT | NOT NULL | Goal description |
| category | VARCHAR(100) | NOT NULL | Goal category |
| measure | VARCHAR(100) | NULL | How goal will be measured |
| target_value | VARCHAR(100) | NULL | Target value if applicable |
| priority | INTEGER | NOT NULL DEFAULT 3 | Priority (1=highest, 5=lowest) |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'active', 'completed', 'canceled' |
| created_by_user_id | UUID | FK, NOT NULL | User who created goal |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `team_id`
- Index: `season_id`
- Index: `category`
- Index: `priority`
- Index: `status`
- Index: `created_by_user_id`
- Index: `(team_id, season_id)` (For team's seasonal goals)

**Foreign Keys:**
- `team_id` REFERENCES teams(id) (FK to user-service)
- `season_id` REFERENCES seasons(id) ON DELETE CASCADE

### Table: player_goals
Individual player objectives.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| season_id | UUID | FK, NOT NULL | Reference to seasons.id |
| description | TEXT | NOT NULL | Goal description |
| category | VARCHAR(100) | NOT NULL | Goal category |
| measure | VARCHAR(100) | NULL | How goal will be measured |
| target_value | VARCHAR(100) | NULL | Target value if applicable |
| priority | INTEGER | NOT NULL DEFAULT 3 | Priority (1=highest, 5=lowest) |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'active', 'completed', 'canceled' |
| is_private | BOOLEAN | NOT NULL DEFAULT false | Whether visible only to player and coaches |
| created_by_user_id | UUID | FK, NOT NULL | User who created goal |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `season_id`
- Index: `category`
- Index: `priority`
- Index: `status`
- Index: `is_private`
- Index: `created_by_user_id`
- Index: `team_id`
- Index: `(player_id, season_id)` (For player's seasonal goals)

**Foreign Keys:**
- `player_id` REFERENCES users(id) (FK to user-service)
- `season_id` REFERENCES seasons(id) ON DELETE CASCADE
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: development_plans
Structured player development frameworks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| player_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| season_id | UUID | FK, NOT NULL | Reference to seasons.id |
| title | VARCHAR(255) | NOT NULL | Plan title |
| description | TEXT | NULL | Plan description |
| status | ENUM | NOT NULL DEFAULT 'active' | Status: 'draft', 'active', 'completed', 'archived' |
| review_schedule | VARCHAR(100) | NULL | When to review progress |
| created_by_user_id | UUID | FK, NOT NULL | User who created plan |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `player_id`
- Index: `season_id`
- Index: `status`
- Index: `created_by_user_id`
- Index: `team_id`
- Index: `(player_id, season_id, status)` (For active plans by player/season)

**Foreign Keys:**
- `player_id` REFERENCES users(id) (FK to user-service)
- `season_id` REFERENCES seasons(id) ON DELETE CASCADE
- `team_id` REFERENCES teams(id) (FK to user-service)

### Table: development_plan_items
Specific elements in a development plan.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| plan_id | UUID | FK, NOT NULL | Reference to development_plans.id |
| skill_area | VARCHAR(100) | NOT NULL | Area of focus (e.g., 'Skating', 'Shooting') |
| current_level | INTEGER | NOT NULL | Current skill level (1-10) |
| target_level | INTEGER | NOT NULL | Target skill level (1-10) |
| actions | TEXT | NOT NULL | Activities to reach target |
| resources | TEXT | NULL | Resources needed or available |
| sequence | INTEGER | NOT NULL | Order within plan |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `plan_id`
- Index: `skill_area`
- Index: `sequence`

**Foreign Keys:**
- `plan_id` REFERENCES development_plans(id) ON DELETE CASCADE

### Table: periodization_cycles
Training cycles for periodization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Cycle name |
| season_phase_id | UUID | FK, NOT NULL | Reference to season_phases.id |
| start_date | DATE | NOT NULL | Cycle start date |
| end_date | DATE | NOT NULL | Cycle end date |
| cycle_type | VARCHAR(100) | NOT NULL | Type (e.g., 'microcycle', 'mesocycle') |
| focus_area | VARCHAR(100) | NOT NULL | Primary training focus |
| intensity | INTEGER | NOT NULL | Intensity level (1-10) |
| volume | INTEGER | NOT NULL | Volume level (1-10) |
| notes | TEXT | NULL | Additional notes |
| team_id | UUID | FK, NOT NULL | Reference to teams.id from user-service |
| created_by_user_id | UUID | FK, NOT NULL | User who created cycle |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `season_phase_id`
- Index: `start_date`
- Index: `end_date`
- Index: `cycle_type`
- Index: `team_id`
- Index: `created_by_user_id`

**Foreign Keys:**
- `season_phase_id` REFERENCES season_phases(id) ON DELETE CASCADE
- `team_id` REFERENCES teams(id) (FK to user-service)

## Schema: Payment Service (payment-service)

### Table: subscription_plans
Definition of available subscription levels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| name | VARCHAR(100) | NOT NULL | Plan name |
| description | TEXT | NOT NULL | Plan description |
| features | JSONB | NOT NULL | Array of included features |
| monthly_price | DECIMAL(10,2) | NOT NULL | Monthly price |
| yearly_price | DECIMAL(10,2) | NOT NULL | Yearly price (usually discounted) |
| trial_period_days | INTEGER | NOT NULL DEFAULT 0 | Free trial length in days |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Whether plan is available |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `name`
- Index: `is_active`

### Table: subscriptions
Organization subscriptions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| plan_id | UUID | FK, NOT NULL | Reference to subscription_plans.id |
| status | ENUM | NOT NULL | Status: 'active', 'canceled', 'paused', 'trial', 'past_due' |
| current_period_start | DATE | NOT NULL | Current billing period start |
| current_period_end | DATE | NOT NULL | Current billing period end |
| cancel_at_period_end | BOOLEAN | NOT NULL DEFAULT false | Whether to cancel at period end |
| trial_start | DATE | NULL | Trial start date if applicable |
| trial_end | DATE | NULL | Trial end date if applicable |
| quantity | INTEGER | NOT NULL DEFAULT 1 | Number of units subscribed |
| payment_method_id | UUID | FK, NULL | Reference to payment_methods.id |
| provider_subscription_id | VARCHAR(255) | NULL | ID in payment provider system |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `organization_id` (One active subscription per organization)
- Index: `plan_id`
- Index: `status`
- Index: `current_period_end`
- Index: `trial_end`
- Index: `payment_method_id`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)
- `plan_id` REFERENCES subscription_plans(id)
- `payment_method_id` REFERENCES payment_methods(id) ON DELETE SET NULL

### Table: invoices
Generated invoices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| subscription_id | UUID | FK, NOT NULL | Reference to subscriptions.id |
| amount | DECIMAL(10,2) | NOT NULL | Invoice amount |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'SEK' | Currency code |
| status | ENUM | NOT NULL | Status: 'draft', 'open', 'paid', 'uncollectible', 'void' |
| due_date | DATE | NOT NULL | Payment due date |
| paid_at | TIMESTAMP WITH TIME ZONE | NULL | When payment was received |
| pdf_url | VARCHAR(255) | NULL | URL to invoice PDF |
| provider_invoice_id | VARCHAR(255) | NULL | ID in payment provider system |
| billing_details | JSONB | NOT NULL | Billing information |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Index: `subscription_id`
- Index: `status`
- Index: `due_date`
- Index: `paid_at`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)
- `subscription_id` REFERENCES subscriptions(id) ON DELETE CASCADE

### Table: payments
Payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| invoice_id | UUID | FK, NOT NULL | Reference to invoices.id |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'SEK' | Currency code |
| status | ENUM | NOT NULL | Status: 'pending', 'succeeded', 'failed', 'refunded' |
| payment_method_id | UUID | FK, NOT NULL | Reference to payment_methods.id |
| provider_payment_id | VARCHAR(255) | NULL | ID in payment provider system |
| refunded_amount | DECIMAL(10,2) | NULL | Amount refunded if applicable |
| notes | TEXT | NULL | Payment notes |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Index: `invoice_id`
- Index: `status`
- Index: `payment_method_id`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)
- `invoice_id` REFERENCES invoices(id) ON DELETE CASCADE
- `payment_method_id` REFERENCES payment_methods(id)

### Table: payment_methods
Stored payment methods.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| organization_id | UUID | FK, NOT NULL | Reference to organizations.id from user-service |
| type | ENUM | NOT NULL | Type: 'credit_card', 'bankgiro', 'other' |
| is_default | BOOLEAN | NOT NULL DEFAULT false | Whether this is the default method |
| last_four | VARCHAR(4) | NULL | Last four digits for cards |
| expiry_date | VARCHAR(7) | NULL | Expiry date for cards (MM/YYYY) |
| brand | VARCHAR(50) | NULL | Card brand if applicable |
| holder_name | VARCHAR(255) | NULL | Card/account holder name |
| provider_payment_method_id | VARCHAR(255) | NULL | ID in payment provider system |
| billing_details | JSONB | NULL | Billing information |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `organization_id`
- Index: `type`
- Index: `is_default`

**Foreign Keys:**
- `organization_id` REFERENCES organizations(id) ON DELETE CASCADE (FK to user-service)

## Schema: Admin Service (admin-service)

### Table: system_metrics
System performance data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| timestamp | TIMESTAMP WITH TIME ZONE | NOT NULL | Measurement time |
| service_name | VARCHAR(100) | NOT NULL | Service being measured |
| service_instance | VARCHAR(100) | NOT NULL | Specific instance identifier |
| cpu_usage | DECIMAL(5,2) | NOT NULL | CPU usage percentage |
| memory_usage | DECIMAL(10,2) | NOT NULL | Memory usage in MB |
| response_time | INTEGER | NULL | Avg response time in ms |
| error_rate | DECIMAL(5,2) | NULL | Error rate percentage |
| request_count | INTEGER | NULL | Number of requests |
| active_users | INTEGER | NULL | Number of active users |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `timestamp`
- Index: `service_name`
- Index: `service_instance`
- Index: `(service_name, timestamp)` (For time series queries)

### Table: admin_logs
Record of administrative actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary identifier |
| timestamp | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Action time |
| admin_id | UUID | FK, NOT NULL | Reference to users.id from user-service |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(100) | NULL | Type of entity affected |
| entity_id | UUID | NULL | ID of affected entity |
| details | JSONB | NULL | Action details |
| ip_address | VARCHAR(45) | NULL | IP address (IPv4/IPv6) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `timestamp`
- Index: `admin_id`
- Index: `action`
- Index: `entity_type`
- Index: `entity_id`

**Foreign Keys:**
- `admin_id` REFERENCES users(id) (FK to user-service)

### Table: supported_languages
Available system languages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | VARCHAR(10) | PK, NOT NULL | Language code (e.g., 'en', 'sv') |
| name | VARCHAR(100) | NOT NULL | Language name in English |
| native_name | VARCHAR(100) | NOT NULL | Language name in its own language |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Whether language is available |
| direction | ENUM | NOT NULL DEFAULT 'ltr' | Text direction: 'ltr', 'rtl' |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `code`
- Index: `is_active`

### Table: translations
Translation keys and values.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | VARCHAR(255) | NOT NULL | Translation key (dot notation) |
| language_code | VARCHAR(10) | NOT NULL | Reference to supported_languages.code |
| translation | TEXT | NOT NULL | Translated text |
| context | TEXT | NULL | Context information for translators |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `(key, language_code)` (Composite)
- Index: `key`
- Index: `language_code`

**Foreign Keys:**
- `language_code` REFERENCES supported_languages(code) ON DELETE CASCADE

### Table: service_health
Current status of each service.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(100) | PK, NOT NULL | Service identifier |
| service_name | VARCHAR(100) | NOT NULL | Service name |
| status | ENUM | NOT NULL | Status: 'up', 'down', 'degraded' |
| last_checked | TIMESTAMP WITH TIME ZONE | NOT NULL | Time of last check |
| message | TEXT | NULL | Status message |
| details | JSONB | NULL | Detailed status information |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `service_name`
- Index: `status`
- Index: `last_checked`

## Database Implementation Best Practices

### Constraints and Data Integrity
- **Primary Keys**: Use UUID v4 for all primary keys to ensure uniqueness across services.
- **Foreign Keys**: Implement appropriate ON DELETE actions (CASCADE, SET NULL, RESTRICT) based on business rules.
- **Check Constraints**: Use CHECK constraints to enforce data validity where appropriate.
- **Defaults**: Set reasonable default values to ensure data consistency.
- **NOT NULL**: Apply NOT NULL constraints to required fields.

### Indexing Strategy
- **Primary Key Indexes**: Automatically created on all primary key columns.
- **Foreign Key Indexes**: Create indexes on all foreign key columns for join performance.
- **Composite Indexes**: Create for frequently combined filter conditions.
- **Partial Indexes**: For large tables where only a subset of rows are frequently queried.
- **JSONB Indexes**: Use GIN indexes for efficient JSONB field querying.
- **Text Search**: Implement GIN indexes with tsvector for text search fields.

### Performance Considerations
- **Connection Pooling**: Implement connection pooling via TypeORM to manage database connections efficiently.
- **Query Optimization**: Use EXPLAIN ANALYZE to optimize complex queries.
- **Table Partitioning**: Consider for very large tables (e.g., messages, logs).
- **Materialized Views**: For complex reports and analytics that don't require real-time data.
- **Regular Maintenance**: Schedule VACUUM and ANALYZE operations to maintain database health.

### Security Practices
- **Row-Level Security**: Implement for multi-tenant data where appropriate.
- **Column-Level Encryption**: For sensitive medical or payment information.
- **Audit Logging**: Capture data changes for sensitive tables.
- **Least Privilege**: Database users with minimal required permissions.

## Entity-Relationship Diagram

Below is a simplified ER diagram representation showing key entities and their relationships:

```
[users] ----< [user_roles] >---- [roles]
  |
  |----< [team_members] >---- [teams] ---- [organizations]
  |
  |----< [player_parent_links] >---- [users]
  |
  |----< [injuries] ---- [player_availability_status]
  |
  |----< [player_medical_info]
  |
  |----< [events] ---- [event_resources] >---- [resources] ---- [resource_types]
  |
  |----< [test_results] ---- [test_definitions]
  |
  |----< [player_game_stats] ---- [games] >---- [team_game_stats]
  |
  |----< [chat_participants] >---- [chats] ---- [messages]
  |
  |----< [player_goals] ---- [seasons] ---- [season_phases]
  |
  |----< [development_plans] ---- [development_plan_items]
```

## Future Considerations

### Database Evolution
- **Schema Migrations**: Use TypeORM migrations for all schema changes.
- **Versioning**: Maintain version history of schema changes.
- **Backward Compatibility**: Ensure changes don't break existing functionality.

### Scaling Strategies
- **Read Replicas**: For read-heavy services like statistics.
- **Sharding**: Consider for very large multi-tenant deployments.
- **Horizontal Partitioning**: For time-series data and logs.

### Backup and Recovery
- **Regular Backups**: Daily full backups with point-in-time recovery.
- **Disaster Recovery**: Cross-region backup strategy for production.
- **Backup Testing**: Regular testing of restoration procedures.

This database schema provides a comprehensive foundation for the Hockey App platform, with careful consideration for data relationships, performance optimization, and future scalability. Each table is designed to support specific business requirements while maintaining database integrity and efficiency.
