export { CachedPlanningService } from './CachedPlanningService';
export { TacticalPlanService } from './TacticalPlanService';
export { PracticePlanService } from './PracticePlanService';
export { GameStrategyService } from './GameStrategyService';
export { DrillLibraryService } from './DrillLibraryService';

// Re-export types for easier consumption
export type {
  CreateTacticalPlanDto,
  UpdateTacticalPlanDto,
  TacticalPlanFilters,
  TacticalPlanSearchParams
} from './TacticalPlanService';

export type {
  CreatePracticePlanDto,
  UpdatePracticePlanDto,
  PracticePlanFilters,
  PracticePlanSearchParams
} from './PracticePlanService';

export type {
  CreateGameStrategyDto,
  UpdateGameStrategyDto,
  GameStrategyFilters,
  GameStrategySearchParams,
  LineupAnalysis
} from './GameStrategyService';

export type {
  CreateDrillDto,
  UpdateDrillDto,
  DrillFilters,
  DrillSearchParams,
  DrillRating
} from './DrillLibraryService';