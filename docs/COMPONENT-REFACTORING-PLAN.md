# Component Refactoring Plan

A phased approach to refactor 15 large component files (500+ lines) into smaller, maintainable modules. The plan prioritizes the largest files first and groups related components together.

## Current State

15 component files exceed 500 lines, with 5 files exceeding 2000 lines:

| Priority | File | Lines | Phase |
|----------|------|-------|-------|
| Critical | `CoachDashboard.tsx` | 2788 | 1 |
| Critical | `PlaySystemEditor.tsx` | 2759 | 2 |
| Critical | `ConditioningWorkoutBuilderSimple.tsx` | 2384 | 2 |
| Critical | `PlayerDashboard.tsx` | 2305 | 1 |
| Critical | `TacticalBoardCanvas.tsx` | 1963 | 2 |
| High | `ExportManager.tsx` (coach) | 1286 | 3 |
| High | `ExportManager.tsx` (export) | 1253 | 3 |
| High | `EnhancedIntervalForm...` | 1224 | 3 |
| High | `AdminDashboard.tsx` | 1173 | 3 |
| High | `QRCodeGenerator.tsx` | 1129 | 3 |
| Medium | `PlayerAgilityViewer.tsx` | 1058 | 4 |
| Medium | `SessionsTab.tsx` | 1051 | 4 |
| Medium | `MedicalStaffDashboard.tsx` | 979 | 4 |
| Medium | `StrengthWorkoutBuilder.tsx` | 962 | 4 |
| Medium | `SessionBuilder.tsx` | 957 | 4 |

---

## Phase 1: Dashboard Components (Sprint 1)

Target: Reduce CoachDashboard.tsx (2788 lines) and PlayerDashboard.tsx (2305 lines)

### 1.1 CoachDashboard Refactoring

**Target Structure:**
```
features/coach/
├── CoachDashboard.tsx              (~150 lines - orchestrator)
├── components/
│   ├── overview/
│   │   ├── QuickStatsCards.tsx
│   │   ├── TodaySchedule.tsx
│   │   ├── PlayerAvailability.tsx
│   │   └── PerformanceTrends.tsx
│   ├── team/
│   │   ├── RosterManagement.tsx
│   │   ├── LineCombinations.tsx
│   │   └── PlayerStatsTable.tsx
│   ├── practice/
│   │   ├── PracticeSchedule.tsx
│   │   ├── PlanningTools.tsx
│   │   └── SessionTemplateList.tsx
│   ├── games/
│   │   ├── GameSchedule.tsx
│   │   ├── TacticalBoardPreview.tsx
│   │   └── SpecialTeamsAnalysis.tsx
│   ├── statistics/
│   │   ├── GoalDistribution.tsx
│   │   ├── ShotMetrics.tsx
│   │   └── AdvancedMetrics.tsx
│   └── development/
│       ├── IndividualPlans.tsx
│       ├── SkillPrograms.tsx
│       └── SeasonTimeline.tsx
├── hooks/
│   ├── useCoachDashboard.ts        (state management)
│   └── useCoachTabs.ts             (tab logic)
└── types/
    └── coach-dashboard.types.ts
```

**Approach:**
1. Extract each tab content into its own component
2. Move shared state into custom hooks
3. Create a types file for dashboard-specific types
4. Keep CoachDashboard.tsx as a thin orchestrator

### 1.2 PlayerDashboard Refactoring

**Target Structure:**
```
features/player/
├── PlayerDashboard.tsx             (~150 lines - orchestrator)
├── components/
│   ├── wellness/
│   │   ├── WellnessForm.tsx
│   │   ├── WellnessMetrics.tsx
│   │   ├── WellnessChart.tsx
│   │   └── WellnessInsights.tsx
│   ├── schedule/
│   │   ├── TodaySchedule.tsx
│   │   ├── UpcomingEvents.tsx
│   │   └── TrainingAssignments.tsx
│   ├── performance/
│   │   ├── ReadinessScore.tsx
│   │   ├── PerformanceTrends.tsx
│   │   └── GoalProgress.tsx
│   └── training/
│       ├── ActiveWorkouts.tsx
│       └── WorkoutHistory.tsx
├── hooks/
│   ├── usePlayerDashboard.ts
│   └── useWellnessSubmission.ts
└── types/
    └── player-dashboard.types.ts
```

**Key Extractions from PlayerDashboard.tsx:**
- Lines 126-135: `wellnessMetrics` config -> `constants/wellness.ts`
- Lines 137-173: `generateHistoricalData` -> `utils/generateWellnessData.ts`
- Lines 175-210: Type definitions -> `types/player-dashboard.types.ts`

---

## Phase 2: Complex Editors (Sprint 2)

Target: PlaySystemEditor.tsx (2759), ConditioningWorkoutBuilderSimple.tsx (2384), TacticalBoardCanvas.tsx (1963)

### 2.1 PlaySystemEditor Refactoring

**Target Structure:**
```
features/coach/components/tactical/
├── PlaySystemEditor.tsx            (~200 lines - main container)
├── components/
│   ├── PlayCanvas.tsx
│   ├── PlayerPositioning.tsx
│   ├── MovementEditor.tsx
│   ├── PlayToolbar.tsx
│   ├── PlayLibrary.tsx
│   └── PlayPreview.tsx
├── hooks/
│   ├── usePlayEditor.ts
│   ├── usePlayHistory.ts           (undo/redo)
│   └── usePlayExport.ts
└── utils/
    ├── playCalculations.ts
    └── playValidation.ts
```

### 2.2 ConditioningWorkoutBuilderSimple Refactoring

**Target Structure:**
```
features/physical-trainer/components/
├── ConditioningWorkoutBuilder/
│   ├── index.tsx                   (~150 lines - main)
│   ├── components/
│   │   ├── IntervalEditor.tsx
│   │   ├── WorkoutTimeline.tsx
│   │   ├── ExerciseSelector.tsx
│   │   ├── IntensityZones.tsx
│   │   └── WorkoutPreview.tsx
│   ├── hooks/
│   │   └── useConditioningBuilder.ts
│   └── types.ts
```

### 2.3 TacticalBoardCanvas Refactoring

**Target Structure:**
```
features/coach/components/tactical/
├── TacticalBoardCanvas/
│   ├── index.tsx                   (~200 lines)
│   ├── components/
│   │   ├── RinkSurface.tsx
│   │   ├── PlayerTokens.tsx
│   │   ├── PuckToken.tsx
│   │   ├── DrawingLayer.tsx
│   │   ├── AnimationControls.tsx
│   │   └── CanvasToolbar.tsx
│   ├── hooks/
│   │   ├── useCanvasInteraction.ts
│   │   ├── useDrawing.ts
│   │   └── useAnimation.ts
│   └── utils/
│       └── canvasHelpers.ts
```

---

## Phase 3: Export and Form Components (Sprint 3)

Target: ExportManager (x2), EnhancedIntervalForm, AdminDashboard, QRCodeGenerator

### 3.1 Consolidate Duplicate ExportManagers

Two similar files exist:
- `features/coach/components/tactical/ExportManager.tsx` (1286 lines)
- `features/coach/components/export/ExportManager.tsx` (1253 lines)

**Action:** 
1. Audit both files for differences
2. Create a single shared ExportManager in `components/shared/export/`
3. Use composition for tactical-specific needs

### 3.2 AdminDashboard Refactoring

Apply same pattern as Phase 1 dashboards - extract each section into subcomponents.

### 3.3 EnhancedIntervalForm and QRCodeGenerator

Extract form sections and preview components into smaller units.

---

## Phase 4: Remaining Components (Sprint 4)

Target: PlayerAgilityViewer, SessionsTab, MedicalStaffDashboard, StrengthWorkoutBuilder, SessionBuilder

Apply patterns established in Phases 1-3 to remaining components.

---

## Implementation Guidelines

### Refactoring Checklist (per component)

1. **Preparation**
   - Create feature branch: `refactor/[component-name]`
   - Run existing tests, ensure they pass
   - Document current component responsibilities

2. **Extraction Process**
   - Start with types and constants (lowest risk)
   - Extract utility functions next
   - Create custom hooks for state logic
   - Split UI into subcomponents
   - Keep main file as thin orchestrator

3. **Testing**
   - Update import paths in existing tests
   - Add unit tests for new hooks
   - Run full test suite before PR

4. **PR Structure**
   - One PR per major component
   - Include before/after line counts
   - Link to this plan in PR description

### Code Patterns to Follow

**Hook extraction pattern:**
```typescript
// hooks/usePlayerDashboard.ts
export function usePlayerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: overview } = useGetPlayerOverviewQuery(playerId);
  
  return {
    activeTab,
    setActiveTab,
    overview,
    // ... other state
  };
}
```

**Component composition pattern:**
```typescript
// PlayerDashboard.tsx (after refactor)
export default function PlayerDashboard() {
  const { activeTab, setActiveTab, ...dashboardState } = usePlayerDashboard();
  
  return (
    <DashboardLayout>
      <DashboardTabs value={activeTab} onChange={setActiveTab}>
        <TabContent value="overview">
          <OverviewSection {...dashboardState} />
        </TabContent>
        {/* ... */}
      </DashboardTabs>
    </DashboardLayout>
  );
}
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Max component file size | Under 400 lines |
| Main dashboard orchestrators | Under 200 lines |
| Test coverage maintained | >= 83% |
| No new linter errors | 0 |
| All existing tests passing | 100% |

---

## Estimated Timeline

- **Phase 1:** 3-4 days (2 dashboard files)
- **Phase 2:** 4-5 days (3 complex editors)
- **Phase 3:** 3-4 days (5 files including consolidation)
- **Phase 4:** 3-4 days (5 remaining files)

**Total:** ~15-17 working days across 4 sprints

---

## Task Checklist

### Phase 1
- [ ] Refactor CoachDashboard.tsx (2788 lines) into modular components
- [ ] Refactor PlayerDashboard.tsx (2305 lines) into modular components

### Phase 2
- [ ] Refactor PlaySystemEditor.tsx (2759 lines)
- [ ] Refactor ConditioningWorkoutBuilderSimple.tsx (2384 lines)
- [ ] Refactor TacticalBoardCanvas.tsx (1963 lines)

### Phase 3
- [ ] Consolidate and refactor duplicate ExportManager components
- [ ] Refactor AdminDashboard.tsx (1173 lines)
- [ ] Refactor EnhancedIntervalForm and QRCodeGenerator

### Phase 4
- [ ] Refactor PlayerAgilityViewer.tsx (1058 lines)
- [ ] Refactor SessionsTab.tsx (1051 lines)
- [ ] Refactor MedicalStaffDashboard.tsx (979 lines)
- [ ] Refactor StrengthWorkoutBuilder.tsx (962 lines)
- [ ] Refactor SessionBuilder.tsx (957 lines)



