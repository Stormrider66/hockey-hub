// Player Evaluation DTOs
export {
  // Nested validation classes
  TechnicalSkillsDto,
  SkatingSkillsDto,
  PuckHandlingSkillsDto,
  ShootingSkillsDto,
  PassingSkillsDto,
  TacticalSkillsDto,
  OffensiveSkillsDto,
  DefensiveSkillsDto,
  TransitionSkillsDto,
  PhysicalAttributesDto,
  MentalAttributesDto,
  GameSpecificNotesDto,
  DevelopmentPriorityDto,
  // Main DTOs
  CreatePlayerEvaluationDto,
  UpdatePlayerEvaluationDto,
  PlayerEvaluationResponseDto
} from './player-evaluation.dto';

// Player Development Plan DTOs
export {
  // Nested validation classes
  CurrentLevelDto,
  DevelopmentGoalDto,
  WeeklyPlanDto,
  MilestoneDto,
  ParentCommunicationDto,
  ExternalResourceDto,
  // Main DTOs
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto,
  DevelopmentPlanResponseDto,
  // Utility DTOs
  AddGoalDto,
  UpdateGoalProgressDto,
  AddMilestoneDto,
  CompleteMilestoneDto
} from './player-development-plan.dto';

// Video Analysis DTOs
export {
  // Nested validation classes
  VideoClipDto,
  AnalysisPointDto,
  PlayerPerformanceDto,
  TeamAnalysisDto,
  // Main DTOs
  CreateVideoAnalysisDto,
  UpdateVideoAnalysisDto,
  VideoAnalysisResponseDto,
  // Utility DTOs
  AddVideoClipDto,
  UpdateVideoClipDto,
  ShareVideoAnalysisDto,
  VideoAnalysisFilterDto,
  BulkShareDto
} from './video-analysis.dto';

// Skill Progression DTOs
export {
  // Nested validation classes
  SkillMeasurementDto,
  BenchmarksDto,
  DrillHistoryDto,
  // Main DTOs
  CreateSkillProgressionDto,
  UpdateSkillProgressionDto,
  SkillProgressionResponseDto,
  // Utility DTOs
  AddMeasurementDto,
  UpdateMeasurementDto,
  AddDrillPerformanceDto,
  SetTargetLevelDto,
  UpdateBenchmarksDto,
  SkillProgressionFilterDto,
  ProgressAnalysisDto,
  BulkMeasurementDto,
  SingleMeasurementDto
} from './skill-progression.dto';

// Player Feedback DTOs
export {
  // Main DTOs
  CreatePlayerFeedbackDto,
  UpdatePlayerFeedbackDto,
  PlayerFeedbackResponseDto,
  // Player response DTOs
  PlayerResponseDto,
  MarkDiscussedDto,
  UpdateFeedbackStatusDto,
  // Filtering and bulk operations DTOs
  PlayerFeedbackFilterDto,
  BulkFeedbackDto,
  BulkStatusUpdateDto,
  // Template-based feedback DTOs
  FeedbackTemplateDto,
  CreateFromTemplateDto,
  // Statistics and analytics DTOs
  FeedbackStatsFilterDto,
  PlayerFeedbackStatsDto,
  CoachFeedbackStatsDto
} from './player-feedback.dto';

// Type re-exports for convenience
export type {
  EvaluationType
} from '../../entities/PlayerEvaluation';

export type {
  DevelopmentPlanStatus,
  GoalStatus,
  GoalCategory,
  MilestoneStatus,
  CommunicationMethod,
  ExternalResourceType
} from '../../entities/PlayerDevelopmentPlan';

export type {
  VideoAnalysisType,
  ClipCategory,
  ImportanceLevel
} from '../../entities/VideoAnalysis';

export type {
  FeedbackType,
  FeedbackTone,
  FeedbackStatus
} from '../../entities/PlayerFeedback';