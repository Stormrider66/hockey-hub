# Conditioning Workout Builder Implementation Plan

## Overview
This document outlines the implementation plan for enhancing the conditioning workout builder in the Physical Trainer dashboard. The system will support comprehensive cardio workout programming with interval training, multiple equipment types, test-based personalization, and full integration with calendar and statistics services.

## Current State Analysis
- ✅ **Existing Foundation**: SessionBuilder component with drag-and-drop interface
- ✅ **Cardio Support**: CardioSessionDashboard with real-time monitoring
- ✅ **Statistics Service**: TrainingStatistics entity tracks comprehensive metrics
- ✅ **Calendar Integration**: CreateSessionModal links sessions to calendar
- ✅ **Real-time Monitoring**: Socket.io integration for live metrics

## Phase 1: Data Models & API Extensions

### 1.1 Extend Workout Session Model
- [ ] Add `intervalProgram` field to WorkoutSession entity
- [ ] Create IntervalSet interface:
  ```typescript
  interface IntervalSet {
    id: string;
    type: 'work' | 'rest' | 'warmup' | 'cooldown';
    duration: number; // seconds
    targetMetrics: {
      heartRate?: { type: 'bpm' | 'percentage'; value: number; reference?: 'max' | 'lactate' | 'test' };
      watts?: { type: 'absolute' | 'percentage'; value: number; reference?: 'ftp' | 'max' | 'test' };
      pace?: { type: '500m' | 'km' | 'mph'; value: number };
      rpm?: number;
      calories?: number;
    };
    equipment: WorkoutEquipmentType;
    notes?: string;
  }
  ```

### 1.2 Create Workout Equipment Types
- [ ] Define equipment enum:
  ```typescript
  enum WorkoutEquipmentType {
    RUNNING = 'running',
    ROWING = 'rowing',
    SKIERG = 'skierg',
    BIKE_ERG = 'bike_erg',
    WATTBIKE = 'wattbike',
    AIRBIKE = 'airbike',
    ROPE_JUMP = 'rope_jump',
    TREADMILL = 'treadmill'
  }
  ```

### 1.3 Player Test Results Integration
- [ ] Create TestResult entity in training-service:
  ```typescript
  interface TestResult {
    id: string;
    playerId: string;
    testType: 'vo2max' | 'lactate_threshold' | 'ftp' | 'max_hr' | 'max_watts';
    value: number;
    unit: string;
    testDate: Date;
    validUntil?: Date;
  }
  ```

## Phase 2: UI Components Development

### 2.1 Conditioning Workout Builder Modal
- [ ] Create `ConditioningWorkoutBuilder.tsx` component
- [ ] Features:
  - Equipment type selector
  - Interval builder with drag-and-drop
  - Visual timeline preview
  - Total workout metrics calculator

### 2.2 Interval Builder Form
- [ ] Create `IntervalForm.tsx` with fields:
  - [ ] Duration (time picker)
  - [ ] Type (work/rest/warmup/cooldown)
  - [ ] Target heart rate (BPM or % of max/threshold)
  - [ ] Target watts (absolute or % of FTP/max)
  - [ ] Target pace (500m/min for rowing, km/h for running)
  - [ ] Target RPM (for cycling)
  - [ ] Target calories
  - [ ] Notes/instructions

### 2.3 Test-Based Personalization Panel
- [ ] Create `TestBasedTargets.tsx` component
- [ ] Features:
  - [ ] Link to player's latest test results
  - [ ] Calculate zones based on test data
  - [ ] Apply percentages (e.g., 80% of lactate threshold)
  - [ ] Show personalized targets for each player

### 2.4 Workout Templates Library
- [ ] Create `CardioTemplateLibrary.tsx`
- [ ] Pre-built templates:
  - [ ] HIIT (High-Intensity Interval Training)
  - [ ] Steady State Cardio
  - [ ] Pyramid Intervals
  - [ ] Fartlek Training
  - [ ] Recovery Sessions
  - [ ] Test Protocols (FTP, VO2max, etc.)

## Phase 3: Calendar Integration

### 3.1 Enhanced Calendar Event Creation
- [ ] Modify CreateSessionModal to support interval workouts
- [ ] Add workout preview in calendar tooltip
- [ ] Display equipment requirements
- [ ] Show personalized targets per player

### 3.2 Calendar Event Metadata
- [ ] Store interval program in event metadata
- [ ] Include equipment requirements
- [ ] Add test-based personalization data
- [ ] Link to workout execution view

## Phase 4: Training Session Viewer Enhancement

### 4.1 Interval Display Component
- [ ] Create `IntervalDisplay.tsx` for session viewer
- [ ] Features:
  - [ ] Visual timeline with current interval highlighted
  - [ ] Countdown timer for current interval
  - [ ] Next interval preview
  - [ ] Target metrics display
  - [ ] Audio/visual cues for interval changes

### 4.2 Real-time Metrics Comparison
- [ ] Show target vs actual metrics
- [ ] Color-coded zones (on target, above, below)
- [ ] Automatic alerts for out-of-range values
- [ ] Progress bars for interval completion

### 4.3 Player-Specific Views
- [ ] Individual workout cards with personalized targets
- [ ] Test-based adjustments visible
- [ ] Medical restrictions warnings
- [ ] Alternative exercises for restricted players

## Phase 5: Statistics Service Integration

### 5.1 Workout Execution Tracking
- [ ] Create `CardioWorkoutExecution` entity:
  ```typescript
  interface CardioWorkoutExecution {
    id: string;
    workoutSessionId: string;
    playerId: string;
    intervalResults: {
      intervalId: string;
      actualDuration: number;
      avgHeartRate: number;
      maxHeartRate: number;
      avgWatts?: number;
      maxWatts?: number;
      avgPace?: number;
      totalCalories: number;
      targetAchievement: number; // percentage
    }[];
    overallMetrics: {
      totalDuration: number;
      totalCalories: number;
      avgHeartRate: number;
      avgWatts?: number;
      compliance: number; // percentage
    };
  }
  ```

### 5.2 Progress Tracking
- [ ] Track improvements over time
- [ ] Compare to previous similar workouts
- [ ] Generate progress reports
- [ ] Update player fitness profiles

### 5.3 Analytics Dashboard
- [ ] Create workout history view
- [ ] Show trends for each equipment type
- [ ] Display test improvements
- [ ] Generate recommendations

## Phase 6: Advanced Features

### 6.1 AI-Powered Workout Generation
- [ ] Analyze player history
- [ ] Consider current fitness level
- [ ] Account for recent workload
- [ ] Generate personalized programs

### 6.2 Group Synchronization
- [ ] Sync intervals across multiple devices
- [ ] Central control for trainer
- [ ] Emergency stop functionality
- [ ] Group pacing features

### 6.3 Export & Sharing
- [ ] Export to common formats (Zwift, TrainerRoad, etc.)
- [ ] Share workouts between trainers
- [ ] Create workout library
- [ ] Import from external sources

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Implement data models
- [ ] Create API endpoints
- [ ] Set up basic UI structure

### Week 3-4: Core Features
- [ ] Build interval builder
- [ ] Implement equipment selection
- [ ] Create workout preview

### Week 5-6: Integration
- [ ] Calendar integration
- [ ] Training session viewer updates
- [ ] Statistics service connection

### Week 7-8: Advanced Features
- [ ] Test-based personalization
- [ ] Real-time monitoring enhancements
- [ ] Progress tracking

### Week 9-10: Polish & Testing
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation

## Technical Considerations

### Performance
- [ ] Optimize real-time updates for 500+ concurrent users
- [ ] Implement data pagination for workout history
- [ ] Use WebSocket connection pooling
- [ ] Cache frequently accessed test results

### Security
- [ ] Validate all interval parameters
- [ ] Ensure proper access control for test data
- [ ] Audit trail for workout modifications
- [ ] Encrypt sensitive health metrics

### Scalability
- [ ] Design for multi-tenant architecture
- [ ] Support for offline workout creation
- [ ] Bulk workout assignment
- [ ] Concurrent session management

## Success Metrics
- [ ] 90% player compliance with prescribed targets
- [ ] < 2s load time for workout builder
- [ ] 99.9% uptime for real-time monitoring
- [ ] 80% reduction in workout planning time
- [ ] 95% trainer satisfaction score

## Dependencies
- Training Service (port 3004)
- Calendar Service (port 3003)
- Statistics Service (port 3007)
- Medical Service (port 3005) - for restrictions
- WebSocket infrastructure
- Redis for caching

## Risk Mitigation
- [ ] Fallback to manual entry if real-time fails
- [ ] Offline mode for workout execution
- [ ] Data validation at multiple levels
- [ ] Regular automated backups
- [ ] Progressive enhancement approach

## Documentation Requirements
- [ ] API documentation for new endpoints
- [ ] User guide for trainers
- [ ] Integration guide for devices
- [ ] Troubleshooting guide
- [ ] Video tutorials

## Testing Strategy
- [ ] Unit tests for all components
- [ ] Integration tests for service communication
- [ ] E2E tests for complete workflows
- [ ] Load testing with 500+ concurrent users
- [ ] Device compatibility testing
- [ ] Accessibility testing

---

**Note**: This implementation will significantly enhance Hockey Hub's conditioning workout capabilities, providing professional-grade tools for physical trainers to create, monitor, and analyze cardio training programs at scale.