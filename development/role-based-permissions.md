# Hockey App - Role-Based Permissions

## Overview
This document defines the various roles in the Hockey App and their permissions to different parts of the system. The roles are designed to provide appropriate access to functionality based on a user's responsibilities within the hockey organization.

## Player Role

### Player (player)
- **Calendar and Schedule**
  - View personal schedule (training, games, meetings)
  - View details for each event (time, location, description)
  - Register attendance/absence for scheduled activities
  - *Limitation:* Cannot create, edit, or delete events

- **Training Information**
  - View details of planned ice and physical training sessions
  - View own registered test results from physical assessments
  - Track personal development over time
  - *Limitation:* Cannot create or edit training sessions or view other players' test results

- **Medical Information**
  - View own injury history and status of ongoing rehabilitation
  - View details of personal treatment plans
  - Report minor discomfort or absence due to illness/injury
  - *Limitation:* Cannot view other players' medical information or edit medical records

- **Communication**
  - Receive notifications from coaches and teammates
  - Participate in team group chats
  - Send and receive private messages to/from coaches and teammates

- **Profile Management**
  - View and edit own profile information
  - Change own password
  - *Limitation:* Cannot change role or view/edit other users' profiles

- **Statistics**
  - View personal game statistics and other individual statistics
  - View team overall statistics (standings, results)
  - *Limitation:* Cannot view detailed statistics for other individual players or edit statistics

## Parent/Guardian

### Parent (parent)
- **Relationship and Connection**
  - Linked to one or more specific player accounts (their children)
  - All permissions and data access limited to information related to these players
  - Clear visualization of which child's information is being displayed (if multiple children exist)

- **Calendar and Schedule**
  - View calendar for the team their child belongs to
  - View details for team common events (training, games, meetings)
  - View their child's specific schedule
  - *Limitation:* Cannot view other players' individual schedules

- **Absence Reporting**
  - Report their child's absence for specific events
  - View history of previous absences
  - Receive confirmation when absence is registered
  - *Notification:* System automatically notifies responsible coach/leader

- **Communication**
  - Send direct messages to coaches/leaders for their child's team
  - Receive team information and messages from coaches
  - Participate in parent group chats if created by coaches
  - *Limitation:* Cannot see chats between players or between coaches

- **Team and Contact Information**
  - View basic information about their child's team
  - View contact details for the team's official coaches
  - View team member list with limited information
  - *Limitation:* Cannot see contact details for other parents or players

- **Profile Management**
  - Manage own profile and contact information
  - Update certain basic information about their child (e.g., contact details)
  - *Limitation:* Cannot change role-based settings

- **Permission Limitations**
  - No access to medical information (medical-service)
  - No detailed access to test results (training-service)
  - No access to statistics beyond basic team statistics
  - No ability to edit team/user information (except own profile)

## Administrative Roles

### Admin
- **System Administration**
  - System health monitoring and metrics
  - Service status overview
  - Performance monitoring
  - Error rate tracking
  - Database usage monitoring

- **Organizational Management**
  - View total number of organizations in the system (but limited detail)
  - Organization registration and setup
  - Multi-tenant management (tenant isolation)
  - System-wide configuration

- **User Aggregation**
  - View aggregated user statistics (anonymized)
  - *Limitation:* No access to detailed club-specific user information
  - Total system-wide user counts
  - Activity patterns (anonymized)

- **Payment and Subscription**
  - Manage subscription plans
  - View organization subscription status
  - *Limitation:* No access to individual payment details
  - Configure payment methods and providers

- **Language and Translation**
  - Add/remove supported languages
  - Manage translation keys
  - Export/import translations
  - Set default language options

- **Security and Compliance**
  - System-wide security settings
  - Access logging review
  - Compliance monitoring
  - *Limitation:* No direct access to sensitive club data

- **Important Privacy Limitations**
  - Cannot view detailed member information within clubs
  - Cannot access club-specific data (training details, medical information)
  - Cannot read communications within clubs
  - Cannot see user-specific statistics
  - All administered data is appropriately anonymized

### Club Administrator (club_admin)
- **Administrative Overview (club level)**
  - Dashboard with key metrics for the entire club
  - Aggregated data about number of teams, players, staff
  - Overview of club activities and status

- **User Management (within the club)**
  - Invite new users to the club
  - Manage roles and permissions within the club
  - Activate/deactivate user accounts
  - View complete list of all users in the club

- **Team Management (within the club)**
  - Create new teams within the club (A-team, junior team, youth team)
  - Edit team information and coach assignments
  - Overview of all teams in the club
  - Archive/remove teams when needed

- **Strategic Planning**
  - Administer the club's overall season planning and goals
  - View individual teams' planning for overview
  - Coordinate development programs across teams

- **Statistics and Analysis**
  - Access to aggregated statistics for the entire club
  - Detailed reports for specific teams
  - Analysis of attendance, match results, test results, injury statistics

- **Finance and Subscription**
  - Overview of the club's subscription status and payments
  - Reports of the club's financial commitments

- **Calendar and Communication Management**
  - Combined calendar view for all teams within the club
  - Create and manage club-wide events
  - Send messages to all members or specific groups

- **Sports Overview**
  - Read access to training plans and exercise library
  - Overview of injury status within the club

## Coach Roles

### Ice Coach (coach)
- **Plan and Create Ice Training Sessions**
  - Design ice sessions by combining different exercises (drills)
  - Manage a library of ice training exercises
  - Categorize exercises by focus area
  - Specify purpose, goals, and structure for each ice session

- **Team Tactics and Individual Development**
  - Document tactical systems and strategies
  - Track individual players' technical development
  - Manage feedback on player performance

- **Scheduling**
  - Book ice training, games, and meetings in the team calendar
  - Specify times, locations, and opponents
  - Manage changes in the schedule with automatic notifications

- **Attendance Registration**
  - Register attendance/absence for players
  - View statistics on players' attendance over time

- **Team and Player Management**
  - View team roster and detailed player information
  - Manage team divisions and groups within the team
  - Assign player roles and positions

- **Game Reporting and Statistics**
  - Register game results and basic statistics
  - Document goal scorers, assists, penalties, ice time
  - Analyze team and individual player statistics

- **Communication**
  - Send messages to individual players or the entire team
  - Create team chats for specific purposes
  - Receive notifications from other team members

- **Season Planning**
  - View and potentially modify season planning
  - Document team and individual player objectives
  - Track development against set goals

### Physical Trainer (fys_coach)
- **Plan and Create Physical Training Sessions**
  - Create detailed physical training sessions with exercises, sets, reps, and intensity
  - Manage a library of physical training exercises
  - Assign sessions to specific players or groups

- **Conduct and Register Physical Tests**
  - Plan different types of tests (strength, speed, endurance, mobility)
  - Register test results for individual players
  - Document test protocols and methodology

- **Overview and Follow-up**
  - View completed sessions and tests per player
  - Track players' progress and adherence to training programs
  - Identify strengths and weaknesses based on training data

- **Scheduling**
  - Book physical training sessions in the team or individual calendar
  - Specify time, location, and participants for training sessions
  - View overview of scheduled activities

- **Analyze Test Results**
  - View history and development of player test results over time
  - Compare results within the team or against benchmarks
  - Visualize development curves and trends

## Medical Roles

### Medical Roles (Physiotherapist, Athletic Therapist, Physician)
- **Injury Management**
  - Register new injuries on players
  - Overview of active and historical injuries for players
  - Update status and details for existing injuries

- **Treatment Planning**
  - Create and link treatment plans to specific injuries
  - Document performed treatments and actions

- **Rehabilitation Follow-up**
  - Log progress in rehabilitation via progress notes
  - View history of a player's rehab process

- **Medical Record Keeping**
  - Maintain basic medical information relevant to sports performance
  - Manage injury history and treatment outcomes

- **Communication/Notifications**
  - Receive notifications related to medical work
  - Send messages to players and coaches regarding injury status

- **User/Team Information**
  - View information about the players and teams they work with
  - Filter and search for specific players

- **Calendar Management**
  - View team calendar and player schedules
  - Book rehab appointments, follow-ups, and other medical events
  - Get reminders about scheduled appointments

- **Rehab Analysis**
  - Display trend data for injuries and recovery
  - View injury statistics at team and individual levels
  - Analyze recovery metrics and progress

## Support Roles

### Equipment Manager (equipment_manager)
- **Equipment Management**
  - Inventory and overview of team equipment
  - Ordering and renewal of materials
  - Management of uniforms and training equipment

- **Communication and Information**
  - Send messages to the team regarding equipment issues
  - Convey information about bookings, times, and locations
  - Share general information and practical details

- **Calendar Management**
  - View team calendar and planned activities
  - Add information about equipment and equipment needs
  - Coordinate equipment with upcoming training and games

- **Team Information**
  - View team rosters and contact information
  - Have access to player registry for their team
  - Coordinate with coaches about equipment needs

- **Game Preparations**
  - Checklist for game equipment
  - Coordination of equipment transport
  - Ensure all equipment is in place

## Implementation Details

Roles are implemented through user management in `user-service` and role-based access control (RBAC) configured in the API gateway to ensure users only access the microservices and functions needed for their specific roles.

### Technical Implementation

1. Roles are defined in user-service with the role names:
   - `admin`
   - `club_admin`
   - `coach`
   - `fys_coach`
   - `rehab` (for physiotherapist, athletic therapist, physician)
   - `equipment_manager`
   - `player`
   - `parent`

2. API gateway is configured to validate user roles against allowed actions
   
3. JWT tokens contain the user's roles to enable authorization at each API call

4. Each microservice implements detailed permission controls for specific endpoints based on user role

5. For the parent role, a special relationship table `player_parent_links` is implemented that links parent accounts to player accounts

This structure provides a flexible but secure permissions model that can be adapted to the organization's needs.