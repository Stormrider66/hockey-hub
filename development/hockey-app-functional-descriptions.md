# Hockey App - Functional Descriptions

This document describes the core functions in the Hockey App platform, their purpose, and how they integrate with other parts of the system to create a comprehensive solution for hockey organizations.

---

**Table of Contents**
1. [Calendar](#calendar-calendar-service)
2. [Physical Training Module](#physical-training-module-training-service)
3. [Medical/Rehabilitation Module](#medicalrehabilitation-module-medical-service)
4. [AI-Assisted Training & Rehabilitation](#ai-assisted-training--rehabilitation)
5. [Communication](#communication-communication-service)
6. [Test Module](#test-module-training-service)
7. [Analysis Module](#analysis-module-statistics-service)
8. [Automated Data Collection & Match Updates](#automated-data-collection--match-updates)
9. [Planning Module](#planning-module-planning-service)
10. [Administration Module](#administration-module-admin-service)
11. [Payment Module](#payment-module-payment-service)

## Calendar (calendar-service)

### Main Purpose
The calendar functions as the central hub for all scheduling and time planning within the organization and its teams. Its primary purposes are to:

- **Create structure and overview**: Provide a clear and comprehensive view of all activities – ice and physical training, games, meetings, medical follow-ups, travel, and other events.
- **Facilitate planning**: Serve as the tool where coaches and administrators plan and schedule team and individual activities.
- **Inform users**: Ensure that all stakeholders (players, coaches, parents, etc.) can easily view their schedule and receive information about upcoming events.
- **Synchronize operations**: Reduce the risk of schedule conflicts and ensure everyone knows where they need to be and when.
- **Integrate information**: Function as a surface where events created in other parts of the system (e.g., a planned training session in the training-service) are automatically displayed.

### Functions

#### Event Types
Support for creating and visually distinguishing different types of events, such as:
- Ice training
- Physical training
- Games (home/away)
- Meetings (team meetings, coach meetings)
- Medical appointments (rehabilitation, examinations)
- Travel
- Other (social activities, tournaments, etc.)

Color-coding is used to visually distinguish different event types.

#### Views
Ability to display the schedule in different time perspectives:
- Month view (standard overview)
- Week view
- Day view

Implemented through CalendarView.js.

#### Navigation
- Easy navigation forward and backward in time
- Jump to today's date
- Implemented through CustomToolbar

#### Filtering
Ability to filter the view to only show events for:
- Specific teams (if the user has access to multiple)
- Specific locations (ice rinks, gyms, etc.)
- Specific event types
- Specific resources

Team and location filters are implemented in CustomToolbar.

#### Event Management
- **Create events**: Authorized users (Admin, Club Admin, Coach, Team Admin) can create new events by clicking on a time/day in the calendar.
- **View details**: All users can click on an existing event to see more detailed information.
- **Edit/delete**: Authorized users can edit or delete events they created or have administrative rights over.

#### Advanced Resource Management
- **Resource types**:
  - Ability to define different types of bookable resources (ice rink, gym, theory room, locker room, etc.)
  - Administrative function managed by admin or club_admin
  - Categorization of resources for easier filtering and searching

- **Specific resources**:
  - Definition of concrete bookable resources linked to locations
  - Example: For the location "Skellefteå Kraft Arena," resources can be "A-Hall," "B-Hall," "Weight Gym," "Conference Room"
  - Resources have properties such as type, capacity, and description

- **Resource booking**:
  - When creating/editing events, first choose location, then specific resource
  - Ability to select multiple resources for an event (e.g., ice rink + locker room)
  - Clear visualization of which resources are linked to an event

- **Conflict detection**:
  - Automatic checking of resource availability during booking
  - Warning if a resource is already booked during the selected time period
  - Alternative suggestions for available times or resources
  - Prevention of double-booking critical resources

- **Resource overview**:
  - Special view to see schedule for a specific resource
  - Filter to show bookings by resource type or specific resource
  - Resource utilization statistics (premium feature)

#### Integration with Other Services
- **training-service**: When an ice or physical training session is planned, a corresponding event is automatically created in the calendar. Changes are synchronized.
- **medical-service**: Rehabilitation appointments or follow-ups appear in the player's/team's calendar.
- **user-service**: Retrieves information about teams and locations for filtering and for managing which users should see which events.
- **communication-service**: Sends notifications for new/changed events to affected users.

#### Permission Control
What a user can see and do in the calendar is governed by their role and team affiliation:
- Players see their personal schedule
- Coaches see and manage their team's schedule
- Club Admin sees all teams in the organization
- Admin sees all calendar events in the system

#### Visual Feedback
- Clear visual markings for today's date
- Hover effects on clickable days (different depending on permissions)
- Color-coding of events
- Visual indication of resource conflicts

### Technical Implementation

#### Data Models
- **events**: Main table for calendar events
  - id, title, start_time, end_time, event_type, location_id, team_id, created_by, description
- **locations**: Defines places where events can take place
  - id, name, address, description
- **resource_types**: Categorizes different types of bookable resources
  - id, name, description
- **resources**: Defines specific bookable resources
  - id, name, resource_type_id, location_id, capacity, description
- **event_resources**: Junction table between events and resources (many-to-many)
  - event_id, resource_id, booking_note

#### Backend Components
- **Event Management API**: CRUD functions for events
- **Resource Management API**: Management of resource types and resources
- **Conflict Detection Service**: Checking resource availability and conflicts
- **Notification Service**: Integration with communication-service for notifications

#### API Endpoints
- Port number: 3003
- Main endpoints:
  - GET /events - List events (with filtering options)
  - POST /events - Create new event
  - GET /events/:id - View specific event
  - PUT /events/:id - Update event
  - DELETE /events/:id - Delete event
  - GET /locations - List available locations
  - GET/POST/PUT/DELETE /resource-types - Manage resource types
  - GET/POST/PUT/DELETE /resources - Manage resources
  - GET /resources/:id/availability - Check resource availability
  - GET /resources/:id/schedule - View schedule for specific resource

---

## Physical Training Module (training-service)

### Main Purpose
The Physical Training Module provides physical trainers, coaches, and players with a complete tool for planning, conducting, and following up on physical training. The system is designed to be flexible and adaptable to different types of training and individual player characteristics, with the ability to link training intensity to the player's test results.

### Functions

#### Session Templates and Categorization
- **Categorization**: Physical trainers can create and organize session templates in their own categories (Strength, Conditioning, Agility, etc.)
- **Flexible structure**: Ability to build session templates with different sections, rows, and columns
- **Library usage**: Templates can be built by dragging in exercises from a central exercise library

#### Exercise Library
- **Exercise management**: Add, edit, and categorize exercises
- **Multimedia**: Link instructional videos to each exercise for correct execution
- **Metadata**: Store information about muscle groups, equipment requirements, and difficulty level

#### Data-Driven Intensity
- **Dynamic linking**: Link the intensity in a session (weight, heart rate, watts, etc.) to a player's individual test results
- **Percentage-based training**: Set exercises to a certain percentage of the player's maximum capacity (e.g., 75% of 1RM in squats)
- **Test integration**: Integration with the test database to retrieve current values for each player
- **Support for different parameters**: Linking to percentage of max heart rate, lactate threshold (heart rate or watts), max watts, etc.

#### Live Session Execution
- **Session clock**: Display a timer on the player's device during session execution
- **Real-time information**: Show current and target heart rate/watts/kcal/h during the session
- **Dynamic intervals**: Handle complex intervals where the load varies within the same interval
- **Flexible rest times**:
  - Rest based on fixed time (timer)
  - Rest based on physiological recovery (e.g., "rest until heart rate is below X% of max heart rate")
- **Real-time adjustments**: Ability to adjust intensity/time on intervals during an ongoing session

#### Integration with Other Services
- **calendar-service**: Scheduling of physical training sessions in the user's calendar
- **statistics-service**: Retrieve test results to calculate individual training intensities
- **user-service**: Access to player information and group division
- **communication-service**: Notifications about assigned sessions and reminders

#### Permission Control
- **Physical trainers**: Full access to create, edit templates, and assign sessions
- **Ice coaches**: Access to view and assign predefined sessions to players
- **Players**: Access to view their assigned sessions and conduct them with the session player
- **Admin/Club Admin**: Overall access for follow-up and statistics

### Technical Implementation

#### Data Models
- **physical_session_templates**: Base template for physical sessions
  - id, name, category_id, description, created_by_user_id
  - structure: Flexible JSONB column that defines the session structure
- **physical_session_categories**: User-defined categories
  - id, name, created_by_user_id
- **exercises**: Library of physical exercises
  - id, name, description, video_url, muscle_group, etc.
- **scheduled_physical_sessions**: Scheduled sessions for players/groups
  - id, template_id, calendar_event_id, assigned_to_user_id/team_id, scheduled_date
  - resolved_structure: JSONB with calculated values for specific players

#### Backend Components
- **Template/Category Management**: CRUD functions for templates and categories
- **Exercise Management**: CRUD functions for the exercise library
- **Intensity Calculation Logic**: Calculation of specific intensity values based on test data
- **Live Session Endpoints**: API for handling session execution and real-time adjustments

#### Frontend Components
- **Template Builder Interface**: Visual editor for creating and editing session templates
- **Exercise Library Manager**: Interface for managing the exercise library
- **Live Session Player**: Mobile-optimized view for displaying and conducting training sessions

#### API Endpoints
- Port number: 3004
- Main endpoints:
  - GET/POST/PUT/DELETE /physical-templates - Manage session templates
  - GET/POST/PUT/DELETE /physical-categories - Manage session categories
  - GET/POST/PUT/DELETE /exercises - Manage the exercise library
  - POST /scheduled-sessions - Schedule sessions for players/teams
  - GET /scheduled-sessions/:id/prepare - Calculate intensity values for specific player
  - GET/POST /live-sessions - Handle ongoing sessions

## 3.4 Training Management (training-service)

- Touch screen-optimized interface for use in training environment

**(See `training-service-api.md` for detailed API endpoints related to this feature, including WebSocket communication for real-time updates.)**

## Implementation Instructions for Cursor

---

## Medical/Rehabilitation Module (medical-service)

### Main Purpose
The Medical/Rehabilitation Module forms the hub for all information and management around players' health, injuries, and rehabilitation within the organization. The purpose of the module is to:

- **Centralize health data**: Gather all relevant medical information and injury history in a secure and easily accessible place.
- **Streamline injury management**: Standardize the process for reporting, assessing, treating, and following up on injuries.
- **Optimize rehabilitation**: Provide tools for creating individualized rehabilitation plans and closely track the player's progress.
- **Facilitate communication**: Improve the flow of information between the rehabilitation team, coaches, and players regarding injury status and return to play.
- **Promote injury prevention**: Through analysis of injury data, identify patterns and risk factors to enable preventive measures.
- **Ensure "Return-to-Play"**: Provide a structured way to assess when a player is medically ready to return to full training and competition.

### Functions

#### Injury Registration
- **Registration**: Rehabilitation staff can register a new injury with detailed information
- **Data collection**: Logs player, date, body part, suspected injury type, injury mechanism, initial assessment, and severity
- **Upload**: Ability to upload relevant images or documents (e.g., X-ray results)

#### Injury Overview/Dashboard
- **Overview view**: The rehabilitation team sees a dashboard of all current injuries within their areas of responsibility
- **Filtering**: Ability to filter/sort based on player, team, injury type, status, and severity
- **Status indicator**: Clear visual indication of the injury status (newly reported, under treatment, rehabilitation, ready for return)

#### Detailed Injury Management
- **Detail page**: For each injury, there is a detail page that collects all information
- **Information**: Shows basic injury data, diagnosis, treatment plan, progress notes, treatments performed
- **Prognosis**: Estimated time to return ("Estimated Time to Return" - ETR)
- **Timeline**: Chronological timeline of the injury progression and treatments

#### Treatment Plans and Logging
- **Treatment plans**: Create structured treatment plans linked to specific injuries
- **Phase division**: Ability to divide rehabilitation into phases with specific goals
- **Action planning**: Specify rehabilitation exercises and other measures per phase
- **Treatment logging**: Log treatments performed (date, type, practitioner, comments)

#### Progress and Follow-up Logging
- **Notes**: Ability to continuously add notes about the player's progress
- **Data collection**: Log both subjective feedback (pain, sensation) and objective measurements (mobility, strength)
- **Time stamping**: Each note is time-stamped and signed by the logger

#### Player Status / Availability
- **Availability status**: The rehabilitation team sets the player's current availability status based on injury and rehabilitation status
- **Status levels**:
  - Full training/game participation
  - Limited training (e.g., no contact, adapted exercises)
  - Individual training only (ice/physical)
  - Rehabilitation only
  - Completely off activity
- **Coach view**: This status is clearly visible to coaches in team overviews, calendar, and attendance lists

#### Medical Journal
- **Basic journal function**: Section with strict permissions for permanent medical information
- **Information**: Allergies, previous relevant operations/injuries, chronic conditions, results from medical screenings
- **Document management**: Upload and manage relevant medical documents

#### Communication and Notifications
- **Notifications**: Automatic messages to coaches for new serious injuries or status changes
- **Player notifications**: Messages to players about scheduled rehabilitation appointments or updates to their plan
- **Message function**: Secure communication between rehabilitation team and players/coaches

#### Reporting and Analysis
- **Injury reports**: Generate statistics on injury incidence (number of injuries, types, body parts) per team or over time
- **Recovery analysis**: Analyze time to return to play for different injury types
- **Trend identification**: Identify patterns, risk periods, or correlations between injury types and activities
- **Integration**: Connection to statistics-service for deeper data analysis

### Permission Control
- **Medical team**: Full access to medical information for players within their area of responsibility
- **Players**: Access only to their own medical information
- **Coaches**: Primarily see availability status and limited, non-sensitive information about the injury (type/body part and ETR)
- **Club Admin/Admin**: Can see aggregated/anonymized statistics but not necessarily individual data

### Integration with Other Services
- **calendar-service**: Scheduling of rehabilitation appointments and medical follow-ups
- **communication-service**: Send notifications for status changes and updates
- **user-service**: Authentication and permission control for sensitive medical data
- **statistics-service**: Send anonymized injury data for analysis and reporting
- **training-service**: Synchronization of player status for training planning

### Technical Implementation

#### Data Models
- **injuries**: Injury registration
  - id, player_id, date_occurred, date_reported, body_part, injury_type, mechanism, severity, description
- **injury_updates**: (progress_notes) Follow-up notes
  - id, injury_id, date, note, created_by_user_id
- **treatments**: Treatments performed
  - id, injury_id, date, treatment_type, notes, performed_by_user_id
- **treatment_plans**: Structured treatment plans
  - id, injury_id, phase, description, expected_duration
- **treatment_plan_items**: Specific actions in a plan
  - id, treatment_plan_id, description, frequency, duration
- **player_availability_status**: Player's availability status
  - id, player_id, current_status (enum), notes, effective_from, updated_by_user_id
- **player_medical_info**: Permanent medical information
  - id, player_id, allergies, medical_conditions, surgical_history, etc.

#### API Endpoints
- Port number: 3005
- Main endpoints:
  - GET/POST/PUT/DELETE /injuries - Manage injuries
  - GET/POST /injuries/:id/updates - Manage follow-up notes
  - GET/POST /injuries/:id/treatments - Manage treatments performed
  - GET/POST/PUT /treatment-plans - Manage treatment plans
  - GET/POST/PUT /player-status - Manage player's availability status
  - GET/POST/PUT /player-medical - Manage player's medical information
  - GET /reports/injuries - Generate injury reports and statistics

---

## AI-Assisted Training & Rehabilitation

### Main Purpose
The AI-assisted training and rehabilitation function provides support to coaches and medical teams by automatically generating suggestions for training programs and rehabilitation plans. The purpose is to:

- **Support leaders with limited expertise**: Provide qualified guidance even when specialist expertise is lacking
- **Standardize training and rehabilitation**: Ensure that programs follow proven methods and best practices
- **Save time**: Streamline the creation of individualized programs
- **Improve results**: Optimize training and rehabilitation processes with evidence-based methods
- **Create continuity**: Ensure that training and rehabilitation follow a structured progression rate

### Functions

#### AI-Generated Physical Training Programs
- **Program generation**: Create complete physical training programs based on parameters such as:
  - Player's position and characteristics
  - Current phase of the season (pre-season, mid-season, off-season)
  - Available time and equipment
  - Player's age and development level
  - Previous test results
- **Customizable output**: Generates programs with appropriate exercises, sets, reps, rest, and intensity levels
- **Progression**: Built-in logic for periodization and progression over time

#### AI-Generated Rehabilitation Plans
- **Injury-specific rehabilitation**: Creates rehabilitation plans based on:
  - Injury type and severity
  - Body part
  - Time since injury
  - Player's age and previous injury history
- **Phase division**: Structures rehabilitation in clear phases (acute, subacute, progressive, return-to-play)
- **Measurement points**: Suggests criteria for when the player can advance to the next phase
- **Precautions**: Includes specific warnings and contraindications

#### Editing and Customization
- **Modification**: Coaches and medical team can edit and customize AI-generated suggestions
- **Combine**: Ability to combine AI suggestions with their own exercises or programs
- **Save as template**: Saving of modified AI programs as templates for future use

#### Integration with Other Functionality
- **Exercise library**: Uses existing exercises from the system's exercise library
- **Calendar integration**: Ability to schedule generated programs directly in the calendar
- **Follow-up**: Integration with existing follow-up functions for training and rehabilitation

#### Educational Aspect
- **Explanations**: AI provides rationales for why specific exercises were chosen
- **Knowledge sharing**: Provides relevant information about exercises and rehabilitation principles
- **Development**: Helps less experienced leaders build their expertise over time

### Technical Implementation

#### Integration Points
- **AI service**: A separate AI service that integrates with training-service and medical-service
- **Data input**: 
  - Retrieves data from the player's profile and test results
  - Uses information about previous injuries and rehabilitation results
  - Uses exercise library from training-service
- **Data output**:
  - Delivers structured programs to training-service
  - Delivers rehabilitation plans to medical-service

#### Data Models
- **ai_training_templates**: Saved AI-generated training templates
  - id, name, description, parameters_used, created_date, created_by_user_id
  - training_structure: JSONB with the generated training structure
- **ai_rehab_templates**: Saved AI-generated rehabilitation templates
  - id, name, injury_type, body_part, phase, parameters_used, created_date
  - rehab_structure: JSONB with the generated rehabilitation structure

#### API Endpoints
- Port number: integrated with existing services
- Main endpoints:
  - POST /ai/generate-training - Generate a physical training program
  - POST /ai/generate-rehab - Generate a rehabilitation plan
  - GET /ai/training-templates - List saved AI-generated training templates
  - GET /ai/rehab-templates - List saved AI-generated rehabilitation templates

#### AI Technology
- **Model type**: Uses a specialized language model trained on medical and sports data
- **Continuous learning**: The system can improve over time based on feedback and outcomes
- **Safety**: Clear warnings when AI recommends seeking expert advice

#### User Interface
- **Generation form**: Intuitive form to specify parameters for program generation
- **Preview**: Ability to preview and edit generated programs
- **Feedback loop**: Function to provide feedback on AI-generated suggestions for continuous improvement

---

## Communication (communication-service)

### Main Purpose
The Communication function enables real-time communication between the app's users and is a critical part for collaboration and information dissemination within the organization. The system gives users the ability to communicate directly with each other or in groups, share information, and receive immediate updates.

### Functions

#### Chat Types
- **Private chats (1-to-1)**: 
  - Direct communication between two users
  - Support for different relationships: coach-player, rehab-player, player-player
  - Easy to start and find conversations

- **Group chats**: 
  - Team groupings where all team members and leaders automatically become participants
  - Role-based group conversations (e.g., "A-team Coaches", "Rehabilitation Team")
  - Ability to create temporary group conversations for specific purposes

#### Core Functions
- **Text messages**: 
  - Send and receive text-based messages
  - Support for formatting and emoji
  - Real-time updates of new messages

- **Media sharing**: 
  - Attach images to messages
  - Preview images directly in the chat flow
  - Support for common image formats (JPEG, PNG, GIF)

- **Chat overview**: 
  - List of the user's active private and group chats
  - Sorting based on latest activity
  - Clear indication of unread messages

- **Message management**: 
  - Display of message history with infinite scroll
  - Clear timestamps for all messages
  - Information about sender with name and possible role

- **Read receipts**: 
  - Indicators for when messages have been read by recipients
  - Status of unread messages in the chat list
  - Optimized for group conversations

- **Notifications**: 
  - Push notifications for new messages in inactive chats
  - Configurable notification settings per chat
  - Sound notifications for more important messages

#### File Attachment Function
- **Upload process**: 
  - User selection of image via file picker
  - Preview before upload
  - Clear loading indicator during the process

- **File storage**: 
  - Secure storage of file attachments in cloud service
  - Optimization of image size for different user scenarios
  - Automatic generation of thumbnails for faster loading

- **Image display**: 
  - Responsive display of images in the chat flow
  - Clickable images to show larger version (lightbox)
  - Support for saving images locally on the device

### Integration with Other Services
- **user-service**: 
  - Retrieves user profile data for display in chat
  - Determines which users exist and which teams they belong to
  - Controls chat membership and permissions based on roles

- **notification-system**: 
  - Sends push notifications for new messages
  - Manages users' notification settings

- **file-storage-service**: 
  - Stores uploaded file attachments
  - Generates permanent URLs to images
  - Manages access control for shared files

### Technical Implementation

#### Real-time Communication
- **WebSockets**: Uses Socket.IO or similar for real-time communication
- **Message queues**: Handles high load and guarantees delivery
- **Status information**: Shows when users are online/offline/typing

#### Data Models
- **chats**: Defines a conversation
  - id, chat_type (private/group), name (for groups), created_at
- **chat_participants**: Links users to chats
  - id, chat_id, user_id, joined_at, role_in_chat
- **messages**: Stores message content
  - id, chat_id, sender_id, message_type, content, image_url, created_at
- **message_reads**: Tracks read status
  - id, message_id, user_id, read_at

#### File Attachment Handling
- **File database**: 
  - message_type: Indicates message type ('text', 'image')
  - image_url: Stores URL to the image in file storage
  - thumbnail_url: URL to thumbnail image for faster loading
  - file_metadata: Stores information about file size, mimetype, etc.

#### API Endpoints
- Port number: 3002
- Main endpoints:
  - WebSocket connection for real-time communication
  - GET /chats - List user's chats
  - POST /chats - Create new chat
  - GET /chats/:id/messages - Retrieve message history
  - POST /chats/:id/messages - Send text message
  - POST /chat/upload - Upload file attachment
  - POST /messages/:id/read - Mark message as read

#### Security and Performance
- **Authentication**: JWT token validation for all communication
- **Data optimization**: Pagination of message history
- **Permission control**: Ensures users can only view and send messages in chats they belong to

---

## Test Module (training-service)

### Main Purpose
The Test Module provides a structured system for conducting, recording, and analyzing physical tests of players. The module is integrated with the Training Module and helps coaches track player development, establish baselines for training intensity, and make data-driven decisions.

### Functions

#### Test Definition
- **Test catalog**: A comprehensive library of standardized physical tests
- **Test categories**: Tests organized by type (strength, speed, endurance, etc.)
- **Test protocols**: Detailed instructions for how each test should be conducted
- **Measurement units**: Clear definition of how results are measured and recorded

#### Test Scheduling
- **Test batches**: Group multiple tests into testing sessions
- **Calendar integration**: Schedule tests in the central calendar
- **Notification system**: Notify players about upcoming tests
- **Recurring tests**: Set up regular testing schedules (monthly, quarterly, etc.)

#### Test Administration
- **Recording interface**: Mobile-friendly interface for recording test results
- **Batch testing**: Record results for multiple players efficiently
- **Real-time input**: Enter results during test execution
- **Historical view**: See previous results for comparison during testing

#### Results Analysis
- **Individual tracking**: Track development of individual players over time
- **Team comparison**: Compare results across the team
- **Position-specific analysis**: Compare players in the same position
- **Norm values**: Compare to age/gender/level-appropriate norms
- **Statistical tools**: Calculate percentiles, averages, and outliers

#### Integration with Training
- **Training intensity**: Link test results to training intensity calculations
- **Automated updates**: Update training parameters when new test results are recorded
- **Goal tracking**: Set test-based goals and track progress
- **Weakness identification**: Highlight areas needing focused training

### Technical Implementation

#### Data Models
- **test_definitions**: Catalog of available tests
  - id, name, category, description, unit, protocol, created_by, active
- **test_batches**: Groupings of tests for administration
  - id, name, description, scheduled_date, team_id, created_by
- **test_batch_items**: Tests included in a batch
  - id, batch_id, test_id, sequence
- **test_results**: Individual test results
  - id, player_id, test_id, batch_id, value, date, notes, administrated_by
- **test_norms**: Reference values for result interpretation
  - id, test_id, age_min, age_max, gender, level, min_value, average_value, max_value

#### API Endpoints
- Part of training-service (Port 3004)
- Main endpoints:
  - GET/POST/PUT/DELETE /tests - Manage test definitions
  - GET/POST /test-batches - Manage test batches
  - GET/POST /test-results - Record and retrieve test results
  - GET /test-results/player/:id - Get all test results for a player
  - GET /test-results/team/:id - Get results for a team
  - GET /test-results/analysis - Get statistical analysis of results

---

## Analysis Module (statistics-service)

### Main Purpose
The Analysis Module provides comprehensive tools for collecting, processing, and visualizing statistics and performance data. It serves as the analytical engine of the platform, helping coaches and players make data-driven decisions and track progress toward goals.

### Functions

#### Data Collection
- **Manual entry**: Interface for entering game and training statistics
- **External import**: Integration with external statistics providers
- **Automated collection**: Connection to tracking systems and wearables
- **Historical import**: Tools for importing historical data

#### Player Statistics
- **Game statistics**: Track in-game performance metrics
- **Training statistics**: Record training metrics and attendance
- **Test results integration**: Pull data from the Test Module
- **Injury tracking**: Statistics on injury frequency, type, and recovery time
- **Development curves**: Track progress over time on key metrics

#### Team Statistics
- **Game results**: Record outcomes, goals for/against
- **Team metrics**: Track team-level performance indicators
- **Opponent analysis**: Compare performance against different opponents
- **Trend analysis**: Identify team performance trends over time
- **Correlation tools**: Find relationships between different metrics

#### Data Visualization
- **Interactive dashboards**: Customizable views for different users
- **Graph library**: Various chart types for different data visualization needs
- **Comparative views**: Easy comparison between players, teams, or time periods
- **Print/export capability**: Generate reports for meetings or presentations
- **Mobile-friendly views**: Optimized visualizations for smaller screens

#### Advanced Analytics
- **Predictive models**: Project future performance based on current trends
- **Pattern recognition**: Identify recurring patterns in performance data
- **Benchmarking**: Compare against league averages or elite performance
- **Custom formulas**: Define and calculate custom metrics
- **Goal tracking**: Monitor progress toward defined performance goals

### Technical Implementation

#### Data Models
- **player_game_stats**: Individual player statistics from games
  - id, player_id, game_id, stat_type, value
- **team_game_stats**: Team-level statistics from games
  - id, team_id, game_id, stat_type, value
- **games**: Game information
  - id, team_id, opponent_id, date, location, result, notes
- **stat_definitions**: Definitions of different statistics
  - id, name, type, unit, category, description
- **custom_metrics**: User-defined calculated metrics
  - id, name, formula, description, created_by
- **reports**: Saved report configurations
  - id, name, type, parameters, user_id, created_at

#### API Endpoints
- Port number: 3007
- Main endpoints:
  - GET/POST /player-stats - Record and retrieve player statistics
  - GET/POST /team-stats - Record and retrieve team statistics
  - GET/POST /games - Manage game records
  - GET /analytics/player/:id - Get comprehensive player analytics
  - GET /analytics/team/:id - Get comprehensive team analytics
  - GET/POST /reports - Manage saved reports
  - GET /metrics/definitions - Get available metric definitions

---

## Automated Data Collection & Match Updates

### Main Purpose
This functionality enables automatic collection of statistics and events during games, reducing manual data entry and providing near real-time updates to the platform. It integrates with external data sources and provides mechanisms for importing and processing data from various formats.

### Functions

#### Data Source Integration
- **League data feeds**: Connect to official league statistics APIs
- **Third-party statistics providers**: Integration with specialized statistics services
- **Video analysis tools**: Connection to automated video analysis systems
- **IoT/Wearable integration**: Import data from tracking devices and wearables

#### Match Data Import
- **Live updates**: Near real-time statistics updates during games
- **Post-game import**: Comprehensive import of match data after completion
- **Manual correction**: Tools to review and adjust automatically imported data
- **Conflict resolution**: Handling of discrepancies between different data sources

#### Automated Processing
- **Data transformation**: Converting external data formats to system format
- **Statistics calculation**: Deriving additional statistics from raw data
- **Player matching**: Associating external player identifiers with system users
- **Historical aggregation**: Updating career and season totals automatically

#### Notification System
- **Live alerts**: Push notifications for significant game events
- **Performance alerts**: Notifications for exceptional performances
- **Report generation**: Automated post-game reports
- **Milestone alerts**: Notifications when players reach statistical milestones

### Technical Implementation

#### Data Models
- **data_sources**: Configuration of external data sources
  - id, name, type, configuration, active
- **data_mappings**: Mapping between external and internal data formats
  - id, source_id, external_field, internal_field, transformation_rule
- **import_logs**: Records of data imports
  - id, source_id, timestamp, status, error_message, records_processed
- **import_queues**: Pending data imports
  - id, source_id, data_reference, priority, scheduled_time, status

#### API Endpoints
- Integration with statistics-service
- Main endpoints:
  - POST /import/match - Import complete match data
  - POST /import/live-update - Process live match update
  - GET /import/status/:id - Check import status
  - POST /import/manual-correction - Submit corrections to imported data
  - GET /data-sources - List configured data sources

---

## Planning Module (planning-service)

### Main Purpose
The Planning Module enables long-term strategic planning for hockey organizations, from season-level planning down to individual player development plans. It helps coaches and administrators create structured development pathways, set goals, and track progress systematically.

### Functions

#### Season Planning
- **Season framework**: Define the overall structure of the season
- **Periodization**: Divide the season into distinct training phases
- **Training focus**: Set primary and secondary focus areas for each period
- **Competition planning**: Integrate games and tournaments into the season plan
- **Recovery periods**: Schedule appropriate recovery times

#### Team Goals
- **Performance goals**: Set measurable team performance targets
- **Development goals**: Define skill development priorities for the team
- **Process goals**: Establish behavioral and practice-related objectives
- **Categorization**: Organize goals by type, priority, and timeframe
- **Progress tracking**: Monitor and update goal achievement status

#### Individual Development Plans
- **Player pathways**: Create personalized development plans
- **Tailored goals**: Set individual objectives based on position and skill level
- **Skill focus**: Target specific skills for improvement
- **Integration with training**: Link development plans to training assignments
- **Progress review**: Schedule and document development reviews

#### Resource Planning
- **Staff allocation**: Plan coaching and support staff assignments
- **Facility scheduling**: Long-term planning of facility requirements
- **Equipment needs**: Project and plan for equipment requirements
- **Budget planning**: Basic financial planning for activities
- **Scenario planning**: Create alternative plans for different circumstances

### Technical Implementation

#### Data Models
- **seasons**: Season definitions
  - id, organization_id, name, start_date, end_date, status
- **season_phases**: Phases within a season
  - id, season_id, name, start_date, end_date, focus_primary, focus_secondary
- **team_goals**: Team-level objectives
  - id, team_id, season_id, description, category, measure, target_value, priority, status
- **player_goals**: Individual player objectives
  - id, player_id, season_id, description, category, measure, target_value, priority, status
- **development_plans**: Structured player development frameworks
  - id, player_id, created_by, season_id, status, review_schedule
- **development_plan_items**: Specific elements in a development plan
  - id, plan_id, skill_area, current_level, target_level, actions, resources

#### API Endpoints
- Port number: 3006
- Main endpoints:
  - GET/POST/PUT/DELETE /seasons - Manage season definitions
  - GET/POST/PUT/DELETE /seasons/:id/phases - Manage season phases
  - GET/POST/PUT/DELETE /team-goals - Manage team goals
  - GET/POST/PUT/DELETE /player-goals - Manage player goals
  - GET/POST/PUT/DELETE /development-plans - Manage development plans
  - GET /seasons/:id/overview - Get comprehensive season overview
  - GET /progress-reports - Generate progress reports

---

## Administration Module (admin-service)

### Main Purpose
The Administration Module provides tools for monitoring system health, managing organizations, and handling platform-wide functions such as language management. The module offers a central control panel for administrators with appropriate permission control.

### Functions

#### System Monitoring
- **Health metrics**:
  - Monitoring of service status
  - Response time tracking
  - Error rate monitoring
  - Database performance monitoring
  - Memory and CPU usage

- **Usage analysis**:
  - Tracking of active users (anonymized)
  - Feature usage statistics (aggregated)
  - Peak load periods
  - Anonymous session duration
  - User engagement metrics (anonymized)

#### Organization Management
- **Organization setup**:
  - Organization registration
  - Settings configuration
  - Branding customization
  - Module activation
  - Service level configuration

- **Multi-tenant management**:
  - Tenant isolation
  - Limited system-wide statistics that protect privacy:
    - Total number of registered organizations
    - Total number of active users (not per organization)
    - System utilization rate (aggregated)
  - Global policies
  - Resource allocation

#### Translation Management
- **Language configuration**:
  - Adding/removing languages
  - Setting default language
  - Language support level
  - Fallback configuration
  - Regional formatting settings

- **Translation interface**:
  - Management of translation keys
  - Context information
  - Translation status information
  - Import/export functionality
  - Translation memory assistance

### Technical Implementation

#### Data Models
- **organizations**: Organization-level settings and information
  - id, name, contact_email, contact_phone, logo_url, primary_color, secondary_color, default_language, status, created_at, updated_at
- **system_metrics**: System performance data
  - id, timestamp, service_name, service_instance, cpu_usage, memory_usage, response_time, error_rate, request_count, active_users
- **admin_logs**: Record of administrative actions
  - id, timestamp, admin_id, action, entity_type, entity_id, details, ip_address
- **supported_languages**: Available system languages
  - code, name, native_name, is_active, direction, created_at, updated_at
- **translations**: Translation keys and values
  - key, language_code, translation, context, created_at, updated_at
- **service_health**: Current status of each service
  - id, service_name, status, last_checked, message, details

#### API Endpoints
- Port number: 3009
- Main endpoints:
  - GET /metrics/system - Retrieve system statistics
  - GET /metrics/usage - Retrieve usage statistics (aggregated and anonymized)
  - GET /system/health - Get system health status
  - GET /system/logs - Retrieve administrator logs
  - GET/POST/PUT /organizations - Manage organizations
  - GET/POST/PUT /languages - Manage available languages
  - GET/POST /translations - Manage translations
  - GET /translations/export/:language - Export translations
  - POST /translations/import/:language - Import translations

---

## Payment Module (payment-service)

### Main Purpose
The Payment Module handles all economic aspects of the Hockey App platform, including subscription management, invoice handling, and payment processing. The module ensures secure and transparent management of all financial transactions within the system.

### Functions

#### Subscription Management
- **Subscription plans**:
  - Definition of different package levels with varying functionality
  - Price settings per plan (monthly/yearly)
  - Trial periods and promotional offers
  - Feature-based limitations per plan

- **Lifecycle management**:
  - Activation upon payment approval
  - Automatic renewal of subscriptions
  - Upgrading/downgrading between plans
  - Pause functionality for seasonal organizations
  - Termination process with data storage options

#### Invoicing
- **Invoice generation**:
  - Automatic generation according to payment plan
  - Customized invoices with organization logo
  - PDF generation for download and printing
  - Support for different currency formats according to language selection

- **Invoice status**:
  - Tracking of paid/unpaid status
  - Reminders for overdue invoices
  - Overview of payment history
  - Export functions for accounting systems

#### Payment Processing
- **Payment handling**:
  - Secure tokenization of payment details
  - Automatic charging at renewal
  - Handling of failed payments
  - Refund functionality

- **Payment method management**:
  - Storage of multiple payment methods
  - Selection of default payment method
  - Updating of expired credit cards
  - Secure deletion of payment information

### Technical Implementation

#### Data Models
- **subscription_plans**: Definition of available subscription levels
  - id, name, description, features, monthly_price, yearly_price, trial_period_days, is_active, created_at, updated_at
- **subscriptions**: Organization subscriptions
  - id, organization_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, trial_end, quantity, payment_method_id, provider_subscription_id, created_at, updated_at
- **invoices**: Generated invoices
  - id, organization_id, subscription_id, amount, currency, status, due_date, paid_at, pdf_url, provider_invoice_id, created_at, updated_at
- **payments**: Payment records
  - id, organization_id, invoice_id, amount, currency, status, payment_method_id, provider_payment_id, refunded_amount, created_at, updated_at
- **payment_methods**: Stored payment methods
  - id, organization_id, type, is_default, last_four, expiry_date, brand, holder_name, provider_payment_method_id, created_at, updated_at

#### API Endpoints
- Port number: 3008
- Main endpoints:
  - GET/POST/PUT /subscription-plans - Manage subscription plans
  - GET/POST/PUT /subscriptions - Manage subscriptions
  - GET /invoices - List invoices
  - GET /invoices/:id/pdf - Download invoice as PDF
  - POST/GET /payments - Process and retrieve payments
  - GET/POST/PUT/DELETE /payment-methods - Manage payment methods
  - GET /organizations/:id/billing - Retrieve billing information for an organization

---

## Security and Privacy Measures

### Limited Administrative Access
System administrators have limited access to specific information about clubs and their members:

- **Permitted access for administrators**:
  - Total number of registered clubs
  - Aggregated user statistics (not club-specific)
  - System health and performance
  - Payment and subscription status (not individual level)
  - Language and translation management

- **Limited access (requires club administrator rights)**:
  - Detailed member information
  - Club-specific data (training, games, medical information)
  - Communication within clubs
  - User-specific statistics

### Data Protection and Privacy
- All personal data is stored encrypted in the database
- Medical information has an extra encryption layer
- Strict permission control for access to sensitive information
- Automatic logging of access to sensitive information
- Regular reviews of access logs
- Complete support for GDPR requirements (right to access, deletion, portability)

### Payment Security
- No storage of complete card details in the system
- Use of secure tokenization methods via Stripe
- PCI-DSS compatible integrations
- Secure handling of payment data in transit and at rest
- Periodic rotation of API keys and certificates

## Integrations and Third-Party Components

### Payment Providers
- **Stripe Integration**
  - Primary payment processor
  - Subscription management
  - Webhook handling
  - Refund processing
  - Secure card storage

- **Bankgiro Integration (Sweden)**
  - Invoice generation
  - Payment tracking
  - Reconciliation
  - File-based integration
  - OCR number management

### Reporting and Export Capabilities
- Export of billing information for accounting systems
- Customizable reports for organization administrators
- Data export in standard formats (CSV, JSON)
- Scheduled reports via email
- Dashboard integrations for real-time analytics

## System Resilience

### Error Monitoring and Recovery
- Comprehensive logging of all financial transactions
- Automatic alerts for failed payments
- Recovery mechanisms for interrupted transactions
- Retry logic for temporary errors
- Backup of payment-related data

### Performance Optimization
- Caching of non-confidential data for faster access
- Optimized database indexes for fast searches
- Connection pooling for database efficiency
- Lazy loading of payment history
- Pagination of large data sets