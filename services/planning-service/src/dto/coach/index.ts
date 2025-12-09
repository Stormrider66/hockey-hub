// Tactical Plan DTOs
export {
  PlayerPositionDto,
  PlayerAssignmentDto,
  TriggerDto,
  VideoReferenceDto,
  FormationDto,
  CreateTacticalPlanDto,
  UpdateTacticalPlanDto,
  TacticalPlanResponseDto,
  TacticalPlanFilterDto
} from './tactical-plan.dto';

// Playbook Play DTOs
export {
  PlaySequenceStepDto,
  ContingencyDto,
  PracticeNoteDto,
  CreatePlaybookPlayDto,
  UpdatePlaybookPlayDto,
  PlaybookPlayResponseDto,
  PlaybookPlayFilterDto,
  AddPracticeNoteDto
} from './playbook-play.dto';

// Practice Plan DTOs
export {
  PracticeSectionDto,
  PlayerAttendanceDto,
  PlayerEvaluationDto,
  LineupDto,
  CreatePracticePlanDto,
  UpdatePracticePlanDto,
  PracticePlanResponseDto,
  PracticePlanFilterDto,
  BulkAttendanceUpdateDto,
  BulkEvaluationUpdateDto
} from './practice-plan.dto';

// Game Strategy DTOs
export {
  LineComboDto,
  MatchupDto,
  SpecialInstructionDto,
  KeyPlayerDto,
  GoalieTendenciesDto,
  OpponentScoutingDto,
  LineupsDto,
  PeriodAdjustmentDto,
  GoalAnalysisDto,
  PlayerPerformanceDto,
  PostGameAnalysisDto,
  CreateGameStrategyDto,
  UpdateGameStrategyDto,
  GameStrategyResponseDto,
  GameStrategyFilterDto,
  AddPeriodAdjustmentDto,
  AddPlayerPerformanceDto
} from './game-strategy.dto';

// Drill Library DTOs
export {
  DrillSetupDto,
  DrillInstructionDto,
  CreateDrillDto,
  UpdateDrillDto,
  DrillResponseDto,
  DrillFilterDto,
  RateDrillDto,
  DrillUsageDto,
  BulkDrillOperationDto
} from './drill-library.dto';