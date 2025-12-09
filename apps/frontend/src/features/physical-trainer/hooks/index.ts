/**
 * Physical Trainer Hooks
 * 
 * A comprehensive collection of React hooks for the Physical Trainer dashboard.
 * These hooks provide state management, data fetching, validation, and business logic
 * for workout creation, player management, and training session coordination.
 */

// Core Data Management Hooks
// ===========================

/**
 * Main data management hook for the Physical Trainer dashboard.
 * Handles loading all required data, team selection, and global state.
 */
export { usePhysicalTrainerData } from './usePhysicalTrainerData';

/**
 * Optimized lazy loading hook for the Physical Trainer dashboard.
 * Only loads data when specific tabs are active to improve performance.
 */
export { useLazyPhysicalTrainerData } from './useLazyPhysicalTrainerData';

/**
 * Session management with calendar integration.
 * Handles CRUD operations for training sessions and calendar events.
 */
export { useSessionManagement } from './useSessionManagement';

// Workout Builder Hooks
// =====================

/**
 * Core workout builder hook with state management and persistence.
 * Supports all workout types: strength, conditioning, hybrid, and agility.
 */
export { 
  useWorkoutBuilder,
  type UseWorkoutBuilderConfig,
  type UseWorkoutBuilderReturn
} from './useWorkoutBuilder';

/**
 * Template management for quick workout creation.
 * Provides pre-built workouts and AI-powered recommendations.
 */
export { 
  useWorkoutTemplates,
  type UseWorkoutTemplatesOptions,
  type UseWorkoutTemplatesReturn,
  type WorkoutTemplate,
  type WorkoutTemplateType,
  type TemplateCategory,
  type TemplateFilters,
  type RecommendationContext
} from './useWorkoutTemplates';

// Player Management Hooks
// =======================

/**
 * Player assignment with team filtering and medical checks.
 * Handles multi-select, availability verification, and conflict detection.
 */
export { 
  usePlayerAssignment,
  type UsePlayerAssignmentParams,
  type UsePlayerAssignmentReturn,
  type MedicalWarning,
  type MedicalError,
  type ValidationError as PlayerValidationError,
  type ValidationWarning as PlayerValidationWarning
} from './usePlayerAssignment';

// Validation & Compliance Hooks
// =============================

/**
 * Comprehensive workout validation with real-time feedback.
 * Validates exercises, sets, reps, weights, and workout structure.
 */
export { 
  useWorkoutValidation,
  commonValidationRules,
  type UseWorkoutValidationConfig,
  type UseWorkoutValidationReturn,
  type CustomValidationRule,
  type CustomValidationRules,
  type FieldErrors,
} from './useWorkoutValidation';

/**
 * Medical compliance checking for injury prevention.
 * Ensures exercises are safe for players with restrictions.
 */
export { 
  useMedicalCompliance
} from './useMedicalCompliance';

/**
 * Live session broadcasting for real-time workout monitoring.
 * Enables trainers to monitor player workouts in real-time with WebSocket connection.
 */
export { 
  useSessionBroadcast
} from './useSessionBroadcast';

/**
 * Bulk session management for creating multiple parallel sessions.
 * Handles session duplication, equipment allocation, and player distribution.
 */
export { 
  useBulkSession,
  type BulkSessionConfig,
  type SessionConfiguration,
  type EquipmentAvailability,
  type FacilityInfo,
  type BulkSessionValidation,
  type BulkSessionState
} from './useBulkSession';

/**
 * Tab caching management for improved performance.
 * Manages which tabs stay cached and implements memory-efficient cleanup strategies.
 */
export { 
  useTabCache
} from './useTabCache';

/**
 * Performance analytics data management for comprehensive insights.
 * Provides data fetching, filtering, and analysis for team and player performance.
 */
export { 
  usePerformanceAnalytics
} from './usePerformanceAnalytics';

/**
 * Analytics data adapter hook for the AnalyticsDashboard component.
 * Transforms performance analytics data to the expected format.
 */
export { 
  useAnalyticsData
} from './useAnalyticsData';

// Smart Defaults & Automation
// ===========================

/**
 * Intelligent defaults for workout creation.
 * Learns from patterns, preferences, and context to reduce manual input.
 */
export { 
  useSmartDefaults,
  type SmartDefaultsConfig,
  type CalendarContext,
  type TimeSlot,
  type CalendarEvent,
  type FacilityAvailability,
  type HistoricalWorkoutData,
  type UserPreferences,
  type TeamScheduleData,
  type SmartDefaults,
  type DefaultReasoning,
  type UseSmartDefaultsReturn
} from './useSmartDefaults';

// Batch Operations Hooks
// =======================

/**
 * Core batch operations hook for bulk workout management.
 * Supports parallel execution, progress tracking, and rollback capabilities.
 */
export { 
  useBatchOperations
} from './useBatchOperations';

/**
 * Specialized batch operation hooks for specific operations.
 * Pre-configured for common bulk operations with sensible defaults.
 */
export { 
  useBatchCreateWorkouts,
  useBatchUpdateAssignments,
  useBatchScheduleWorkouts,
  useBatchDelete,
  useBatchDuplicate
} from './useBatchOperations';

// Validation Rules & Examples
// ===========================

/**
 * Pre-configured validation rules for different workout types.
 * Use these as starting points for custom validation logic.
 */
export {
  strengthWorkoutValidationRules,
  conditioningWorkoutValidationRules,
  hybridWorkoutValidationRules,
  agilityWorkoutValidationRules,
  sessionValidationRules,
  getValidationRulesForWorkoutType,
  medicalAwareValidationRules,
} from './validation-examples';

// Re-export Common Types
// ======================

/**
 * Validation result types from utils
 */
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../utils/workoutValidation';

/**
 * Session and workout types
 */
export type {
  WorkoutType,
  WorkoutSession,
  TrainingSession
} from '../types/session.types';

/**
 * Exercise and player types
 */
export type {
  Exercise,
  ExerciseSet,
  Player,
  Team
} from '../types';

/**
 * Batch operations types
 */
export type {
  BatchRequest,
  BatchResponse,
  BatchOperation,
  BatchOperationType,
  BatchProgress,
  BatchValidationResult,
  BatchSelection,
  BatchOptions,
  CreateWorkoutData,
  UpdateWorkoutData,
  AssignWorkoutData,
  ScheduleData,
  DuplicateWorkoutData,
  DeleteWorkoutData,
  TemplateCreationData
} from '../types/batch-operations.types';

// Usage Examples
// ==============

/**
 * Example: Import all workout builder hooks
 * ```typescript
 * import { 
 *   useWorkoutBuilder, 
 *   useWorkoutValidation,
 *   usePlayerAssignment,
 *   useMedicalCompliance,
 *   useWorkoutTemplates,
 *   useBatchOperations
 * } from '@/features/physical-trainer/hooks';
 * ```
 * 
 * Example: Import specific hooks with types
 * ```typescript
 * import { 
 *   useWorkoutBuilder,
 *   type UseWorkoutBuilderConfig,
 *   type ValidationError
 * } from '@/features/physical-trainer/hooks';
 * ```
 * 
 * Example: Use in a component
 * ```typescript
 * const MyWorkoutBuilder = () => {
 *   const { formData, updateField, errors } = useWorkoutBuilder({
 *     workoutType: 'STRENGTH',
 *     enableAutosave: true
 *   });
 *   
 *   const { validateWorkout } = useWorkoutValidation({
 *     workoutType: 'STRENGTH',
 *     validationRules: strengthWorkoutValidationRules
 *   });
 *   
 *   return <div>...</div>;
 * };
 * ```
 * 
 * Example: Batch operations usage
 * ```typescript
 * const MyBatchManager = () => {
 *   const { executeBatch, activeJobs } = useBatchOperations();
 *   const batchCreateWorkouts = useBatchCreateWorkouts();
 *   const batchDelete = useBatchDelete();
 *   
 *   const handleBulkCreate = async (workouts) => {
 *     const response = await batchCreateWorkouts(workouts, {
 *       parallel: true,
 *       medicalComplianceCheck: true,
 *       maxConcurrency: 5
 *     });
 *     console.log('Created:', response.summary.successful);
 *   };
 *   
 *   const handleBulkDelete = async (workoutIds) => {
 *     await batchDelete(workoutIds, false, {
 *       rollbackOnError: true,
 *       stopOnError: false
 *     });
 *   };
 *   
 *   return <div>...</div>;
 * };
 * ```
 */