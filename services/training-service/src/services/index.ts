// Existing services
export { CachedWorkoutSessionService } from './CachedWorkoutSessionService';
export { CalendarIntegrationService } from './CalendarIntegrationService';
export { EquipmentAvailabilityService } from './EquipmentAvailabilityService';
export { EquipmentInventoryService } from './EquipmentInventoryService';
export { EquipmentReservationService } from './EquipmentReservationService';
export { ExerciseService } from './ExerciseService';
export { MedicalIntegrationService } from './MedicalIntegrationService';
export { PlanningIntegrationService } from './PlanningIntegrationService';
export { PlayerWellnessService } from './PlayerWellnessService';
export { SessionTemplateService } from './SessionTemplateService';
export { TrainingEventService } from './TrainingEventService';
export { TrainingSessionSocketService } from './TrainingSessionSocketService';
export { WorkoutAssignmentService } from './WorkoutAssignmentService';
export { WorkoutTypeService } from './WorkoutTypeService';

// New Coach Dashboard services
export { PlayerEvaluationService } from './PlayerEvaluationService';
export { PlayerDevelopmentPlanService } from './PlayerDevelopmentPlanService';
export { VideoAnalysisService } from './VideoAnalysisService';
export { SkillProgressionService } from './SkillProgressionService';
export { PlayerFeedbackService } from './PlayerFeedbackService';

// Re-export types
export type {
  CreatePlayerEvaluationDto,
  UpdatePlayerEvaluationDto,
  EvaluationFilters,
  EvaluationSearchParams,
  SkillAnalysis,
  PlayerProgressSummary
} from './PlayerEvaluationService';

export type {
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto
} from './PlayerDevelopmentPlanService';

export type {
  CreateVideoAnalysisDto
} from './VideoAnalysisService';

export type {
  CreateSkillTrackingDto,
  RecordMeasurementDto
} from './SkillProgressionService';

export type {
  CreateFeedbackDto,
  UpdateFeedbackDto
} from './PlayerFeedbackService';