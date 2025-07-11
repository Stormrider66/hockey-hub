# Hybrid & Agility Workout Implementation Plan

## Overview
This document outlines the implementation plan for adding full support for Hybrid and Agility workouts in Hockey Hub. Hybrid workouts combine exercises with intervals, while Agility workouts focus on speed, coordination, and reaction training.

## ✅ Completed Tasks

### 1. **Frontend Type Support**
- ✅ Added 'agility' and 'hybrid' to SESSION_TYPES in SessionBuilder
- ✅ Updated SessionData interface to include both types
- ✅ Both types are available in workout creation modals

### 2. **Backend Type Support**
- ✅ Added HYBRID to WorkoutType enum
- ✅ Created comprehensive configuration for HYBRID type including:
  - Metrics configuration (exercise type, duration, intensity)
  - Equipment requirements (dumbbells + cardio equipment)
  - Progression models (beginner to elite)
  - Safety protocols
- ✅ Created migration: `1736500000000-AddHybridWorkoutType.ts`

## 🔄 Next Implementation Steps

### Phase 1: Create HybridWorkoutBuilder Component

**File**: `/apps/frontend/src/features/physical-trainer/components/HybridWorkoutBuilder.tsx`

**Features**:
1. **Dual-Mode Interface**:
   ```typescript
   interface HybridBlock {
     id: string;
     type: 'exercise' | 'interval';
     duration: number;
     content: Exercise[] | IntervalSet[];
   }
   ```

2. **Builder Tabs**:
   - **Structure Tab**: Define workout blocks (exercise vs interval)
   - **Exercises Tab**: Add strength/skill exercises to exercise blocks
   - **Intervals Tab**: Add cardio intervals to interval blocks
   - **Preview Tab**: Visual timeline of the complete workout

3. **Key Components**:
   - Block timeline (drag & drop reordering)
   - Exercise selector for exercise blocks
   - Interval builder for interval blocks
   - Transition time between blocks
   - Total workout summary

### Phase 2: Create AgilityWorkoutBuilder Component

**File**: `/apps/frontend/src/features/physical-trainer/components/AgilityWorkoutBuilder.tsx`

**Features**:
1. **Agility-Specific Elements**:
   ```typescript
   interface AgilityDrill {
     id: string;
     name: string;
     pattern: 'linear' | 'lateral' | 'multidirectional' | 'reactive';
     duration: number;
     sets: number;
     equipment: string[];
     metrics: {
       timeToComplete?: number;
       successRate?: number;
       reactionTime?: number;
     };
   }
   ```

2. **Drill Library**:
   - Cone drills (T-drill, 5-10-5, box drill)
   - Ladder drills (in-in-out, lateral shuffle, crossover)
   - Reaction drills (light/sound cues)
   - Sport-specific patterns

3. **Metrics Tracking**:
   - Completion time
   - Error count
   - Reaction time
   - Movement quality score

### Phase 3: Update TrainingSessionViewer

**File**: `/apps/frontend/src/features/physical-trainer/components/TrainingSessionViewer.tsx`

**Current Logic**:
```typescript
if (initialIntervals) {
  return <IntervalDisplay />;
} else {
  return <ExerciseDisplay />;
}
```

**New Logic**:
```typescript
switch (sessionData.type) {
  case 'CARDIO':
    return <IntervalDisplay />;
  case 'HYBRID':
    return <HybridDisplay />;
  case 'AGILITY':
    return <AgilityDisplay />;
  default:
    return <ExerciseDisplay />;
}
```

### Phase 4: Create Display Components

#### HybridDisplay Component
**File**: `/apps/frontend/src/features/physical-trainer/components/viewers/HybridDisplay.tsx`

**Features**:
- Timeline showing current block (exercise or interval)
- Smooth transitions between blocks
- Different UI for exercise vs interval blocks
- Progress tracking for each block
- Rest periods between blocks

#### AgilityDisplay Component
**File**: `/apps/frontend/src/features/physical-trainer/components/viewers/AgilityDisplay.tsx`

**Features**:
- Visual drill patterns
- Timer with go/stop signals
- Success/fail tracking
- Reaction time measurement
- Video demonstrations (optional)

### Phase 5: Data Structure Updates

#### HybridWorkoutSession Interface
```typescript
interface HybridWorkoutSession extends WorkoutSession {
  hybridProgram: {
    blocks: HybridBlock[];
    transitions: {
      duration: number;
      type: 'rest' | 'active_recovery';
    }[];
    totalDuration: number;
    totalExercises: number;
    totalIntervals: number;
  };
}
```

#### AgilityWorkoutSession Interface
```typescript
interface AgilityWorkoutSession extends WorkoutSession {
  agilityProgram: {
    drills: AgilityDrill[];
    restBetweenDrills: number;
    totalDuration: number;
    focusAreas: string[];
    equipmentSetup: {
      pattern: string;
      spacing: string;
      equipment: string[];
    };
  };
}
```

### Phase 6: Integration Updates

1. **SessionsTab.tsx**:
   - Add buttons for "Hybrid Workout" and "Agility Training"
   - Route to appropriate builders

2. **Mock Data**:
   - Add sample hybrid workouts
   - Add sample agility drills
   - Update calendar events

3. **Player Dashboard**:
   - Handle hybrid and agility workout launches
   - Show appropriate preview information

## 📋 Implementation Checklist

### ✅ Completed Tasks (Current Session)
- [x] Create HybridWorkoutBuilder component
- [x] Create HybridBlock interface and types in hybrid.types.ts
- [x] Implement block-based workout structure with drag-and-drop
- [x] Create HybridBlockItem component for block display
- [x] Create BlockEditor component for editing all block types
- [x] Create HybridPreview component with timeline and print view
- [x] Update SessionsTab to add Hybrid and Agility buttons
- [x] Update TrainingSessionViewer routing logic for workout types
- [x] Add HYBRID to backend WorkoutType enum with configuration

### Remaining Tasks
- [ ] Create HybridDisplay viewer component for session execution
- [ ] Create AgilityWorkoutBuilder component
- [ ] Create AgilityDisplay viewer component
- [ ] Add mock data for both workout types
- [ ] Test player dashboard integration
- [ ] Connect to backend APIs for saving/loading

### Final Polish
- [ ] Add transitions between blocks
- [ ] Implement progress saving
- [ ] Add workout templates
- [ ] Create documentation

## 🎯 Success Criteria

1. **Hybrid Workouts**:
   - Can create workouts mixing exercises and intervals
   - Smooth transitions between different block types
   - Clear visual distinction in viewer
   - Progress tracking for both components

2. **Agility Workouts**:
   - Drill pattern visualization
   - Time and accuracy tracking
   - Equipment setup guidance
   - Performance metrics collection

3. **User Experience**:
   - Intuitive builder interfaces
   - Clear viewer displays
   - Seamless player experience
   - Proper data persistence

## 📝 Notes for Next Session

1. Start with HybridWorkoutBuilder implementation
2. Focus on the block-based structure first
3. Reuse existing Exercise and Interval components where possible
4. Maintain consistency with existing UI patterns
5. Ensure TypeScript type safety throughout

This plan provides a clear roadmap for implementing comprehensive support for Hybrid and Agility workouts in the Hockey Hub platform.