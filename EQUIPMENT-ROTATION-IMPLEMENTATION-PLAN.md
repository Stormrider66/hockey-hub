# Equipment Inventory & Rotation System Implementation Plan

## Overview
Implementation of a comprehensive equipment management and workout rotation system for team training scenarios where equipment is limited and needs to be shared among players.

## Problem Statement
- Teams have 24 players but limited equipment (6 rowers, 6 skiergs, 6 bikeergs, 6 assault bikes)
- Need to track equipment availability and prevent over-allocation
- Support rotation/circuit training where groups rotate through different stations
- Automatically populate team players and manage equipment constraints

## Implementation Phases

### Phase 1: Equipment Inventory System ✅ (Current)
**Goal**: Create foundation for tracking and managing equipment availability

#### 1.1 Database Schema
```typescript
// Equipment inventory tables
equipment_items {
  id: string
  type: WorkoutEquipmentType
  name: string // "Rower #1"
  serial_number?: string
  status: 'available' | 'in_use' | 'maintenance'
  facility_id: string
  location?: string
  created_at: timestamp
  updated_at: timestamp
}

equipment_reservations {
  id: string
  equipment_item_id: string
  session_id: string
  player_id?: string
  reserved_from: timestamp
  reserved_until: timestamp
  status: 'active' | 'completed' | 'cancelled'
}

facility_equipment_config {
  facility_id: string
  equipment_type: WorkoutEquipmentType
  total_count: number
  default_location: string
}
```

#### 1.2 Core Services
- `EquipmentInventoryService` - Manage equipment items
- `EquipmentReservationService` - Handle reservations and availability
- `EquipmentAvailabilityService` - Real-time availability checking

#### 1.3 API Endpoints
- `GET /api/equipment/inventory` - List all equipment
- `GET /api/equipment/availability` - Check availability by type
- `POST /api/equipment/reserve` - Reserve equipment for session
- `DELETE /api/equipment/reserve/:id` - Release equipment
- `GET /api/equipment/conflicts` - Check for scheduling conflicts

#### 1.4 Frontend Components
- `EquipmentAvailabilityWidget` - Shows real-time availability
- `EquipmentSelector` - Enhanced selector with availability
- `EquipmentConflictWarning` - Alerts for over-allocation

### Phase 2: Team-to-Player Flow Enhancement
**Goal**: Streamline player selection with equipment constraints

#### 2.1 Features
- Team selector in player assignment tab
- Auto-populate all team players
- Visual capacity indicators based on equipment
- Disable selection when equipment limit reached
- Show equipment assignment per player

#### 2.2 Components
- `TeamPlayerSelector` - Enhanced player selection with team support
- `EquipmentCapacityBar` - Visual indicator of equipment usage
- `PlayerEquipmentAssignment` - Assign specific equipment to players

### Phase 3: Workout Rotation System
**Goal**: Support circuit/station training with multiple concurrent workouts

#### 3.1 Features
- Create multiple workout stations (3-4 different workouts)
- Assign different equipment to each station
- Group players and rotate through stations
- Manage timing and transitions
- Visual rotation schedule

#### 3.2 Data Model
```typescript
interface RotationSession {
  id: string
  name: string
  teamId: string
  stations: WorkoutStation[]
  playerGroups: PlayerGroup[]
  rotationSchedule: RotationSchedule
  totalDuration: number
  equipmentReservations: EquipmentReservation[]
}

interface WorkoutStation {
  id: string
  stationNumber: number
  name: string
  workout: IntervalProgram | StrengthWorkout
  equipmentType: WorkoutEquipmentType
  equipmentCount: number
  duration: number
}

interface PlayerGroup {
  id: string
  name: string // "Group A"
  playerIds: string[]
  color: string // For visual identification
}

interface RotationSchedule {
  stationDuration: number
  transitionTime: number
  rotations: RotationSlot[]
}
```

#### 3.3 Components
- `RotationWorkoutBuilder` - Main rotation configuration
- `StationConfiguration` - Setup each workout station
- `GroupManager` - Drag-drop interface for groups
- `RotationTimeline` - Visual rotation schedule
- `RotationExecutionView` - Live session management

### Phase 4: Real-time Integration
**Goal**: Live updates and conflict management

#### 4.1 Features
- WebSocket updates for equipment status
- Real-time conflict detection
- Live rotation progress tracking
- Equipment check-in/check-out system
- Session overlap warnings

#### 4.2 Technical Implementation
- Extend existing WebSocket infrastructure
- Add equipment namespace in Socket.io
- Implement optimistic UI updates
- Add conflict resolution strategies

## User Flow Examples

### Example 1: Simple Team Workout
1. Select team (24 players auto-populate)
2. Create rowing interval workout
3. System shows "6 rowers available"
4. Select 6 players maximum
5. Save workout with equipment reserved

### Example 2: Rotation Workout
1. Select team (24 players)
2. Enable "Rotation Mode"
3. Create 4 stations:
   - Station 1: Rowing intervals (6 rowers)
   - Station 2: Bike intervals (6 bikes)
   - Station 3: Ski intervals (6 skiergs)
   - Station 4: Assault bike (6 bikes)
4. System auto-creates 4 groups of 6 players
5. Set 20-minute stations with 2-minute transitions
6. Total workout: 86 minutes (4×20 + 3×2)

## Success Metrics
- Zero equipment double-booking incidents
- 90% equipment utilization during peak hours
- 50% reduction in workout setup time
- Support for 4+ concurrent training groups

## Technical Considerations
- Equipment IDs should be scannable (QR/NFC)
- Support offline mode for equipment tracking
- Integration with facility management systems
- Mobile-friendly for on-floor management

## Implementation Timeline
- Phase 1: 2-3 days (Equipment Inventory)
- Phase 2: 2 days (Team Flow)
- Phase 3: 3-4 days (Rotation System)
- Phase 4: 2 days (Real-time)
- Testing & Polish: 2 days

Total: ~2 weeks for full implementation

## Next Steps
1. Create equipment inventory service and database schema
2. Build equipment availability API
3. Create frontend components for equipment tracking
4. Integrate with existing workout builders