/**
 * Validation API Types for Workout Management
 * 
 * Comprehensive type definitions for unified validation system across all workout types.
 * Provides real-time validation, error handling, and standardized response formats.
 */

import type { WorkoutType, ValidationCategory, ValidationSeverity } from './validation.types';
import type { WorkoutSession, Player, Team } from './base-types';
import type { IntervalProgram } from './conditioning.types';
import type { HybridProgram } from './hybrid.types';
import type { AgilityProgram } from './agility.types';

// ============================================================================
// Core Validation Types
// ============================================================================

export interface ValidationRequest {
  /** Unique request ID for tracking */
  requestId?: string;
  /** Type of workout being validated */
  workoutType: WorkoutType;
  /** Context information for validation */
  context: ValidationContext;
  /** Validation configuration */
  config?: ValidationRequestConfig;
  /** Data to validate */
  data: ValidationData;
}

export interface ValidationContext {
  /** User ID performing validation */
  userId: string;
  /** Organization ID */
  organizationId: string;
  /** Team ID if applicable */
  teamId?: string;
  /** Player IDs being validated */
  playerIds?: string[];
  /** Scheduled date/time for the workout */
  scheduledDateTime?: string;
  /** Facility/location information */
  facility?: {
    id?: string;
    name?: string;
    capacity?: number;
    equipment?: string[];
  };
  /** Session this validation is for (if editing) */
  existingSessionId?: string;
}

export interface ValidationRequestConfig {
  /** Validation strictness level */
  strictness: 'lenient' | 'normal' | 'strict';
  /** Include medical compliance checks */
  includeMedical: boolean;
  /** Include scheduling conflict checks */
  includeScheduling: boolean;
  /** Include facility/equipment checks */
  includeFacility: boolean;
  /** Include performance/safety checks */
  includePerformance: boolean;
  /** Return suggestions along with errors */
  includeSuggestions: boolean;
  /** Maximum response time in ms */
  timeout?: number;
}

export interface ValidationData {
  /** Basic workout information */
  workout?: Partial<WorkoutSession>;
  /** Type-specific program data */
  program?: IntervalProgram | HybridProgram | AgilityProgram | any;
  /** Player assignments */
  assignments?: PlayerAssignmentData[];
  /** Scheduling information */
  schedule?: ScheduleData;
}

export interface PlayerAssignmentData {
  /** Player ID */
  playerId: string;
  /** Custom load percentage (if applicable) */
  loadPercentage?: number;
  /** Player-specific modifications */
  modifications?: string[];
  /** Role in this workout */
  role?: 'participant' | 'observer' | 'assistant';
}

export interface ScheduleData {
  /** Start date and time */
  startDateTime: string;
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Facility/location ID */
  facilityId?: string;
  /** Required equipment */
  requiredEquipment?: string[];
  /** Recurring schedule information */
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

// ============================================================================
// Validation Response Types
// ============================================================================

export interface ValidationResponse {
  /** Overall validation status */
  isValid: boolean;
  /** Request ID that was validated */
  requestId?: string;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Helpful suggestions */
  suggestions: ValidationSuggestion[];
  /** Validation metadata */
  metadata: ValidationMetadata;
  /** Timestamp of validation */
  timestamp: string;
  /** Time taken to validate in ms */
  processingTime: number;
}

export interface ValidationError {
  /** Unique error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Field that triggered the error */
  field?: string;
  /** Error severity level */
  severity: ValidationSeverity;
  /** Error category */
  category: ValidationCategory;
  /** Additional context data */
  context?: Record<string, any>;
  /** Suggested resolution */
  resolution?: string;
  /** Reference to help documentation */
  helpUrl?: string;
}

export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Field that triggered the warning */
  field?: string;
  /** Warning category */
  category: ValidationCategory;
  /** Recommendation to address warning */
  recommendation?: string;
  /** Impact assessment if ignored */
  impact?: 'low' | 'medium' | 'high';
  /** Can this warning be dismissed? */
  dismissible: boolean;
}

export interface ValidationSuggestion {
  /** Type of suggestion */
  type: SuggestionType;
  /** Suggestion title */
  title: string;
  /** Detailed description */
  description: string;
  /** Action to perform */
  action?: SuggestionAction;
  /** Priority of this suggestion */
  priority: 'low' | 'medium' | 'high';
  /** Estimated benefit */
  benefit?: string;
}

export type SuggestionType = 
  | 'optimization'
  | 'alternative'
  | 'best_practice'
  | 'medical_safety'
  | 'scheduling'
  | 'equipment'
  | 'performance';

export interface SuggestionAction {
  /** Action type */
  type: 'modify' | 'replace' | 'add' | 'remove' | 'reschedule';
  /** Target field/object */
  target: string;
  /** New value or modification */
  value?: any;
  /** Parameters for the action */
  parameters?: Record<string, any>;
}

export interface ValidationMetadata {
  /** Rules that were applied */
  rulesApplied: string[];
  /** Performance metrics */
  performance: {
    /** Total validation time */
    totalTime: number;
    /** Time by validation type */
    breakdown: Record<string, number>;
    /** Cache hit ratio */
    cacheHitRatio?: number;
  };
  /** Validation score (0-100) */
  score: number;
  /** Confidence level */
  confidence: 'low' | 'medium' | 'high';
  /** External services consulted */
  externalServices?: string[];
  /** Version of validation engine */
  engineVersion: string;
}

// ============================================================================
// Specialized Validation Types
// ============================================================================

export interface ContentValidationRequest {
  workoutType: WorkoutType;
  content: any;
  context: Pick<ValidationContext, 'organizationId' | 'teamId'>;
}

export interface ContentValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  contentScore: number;
}

export interface AssignmentValidationRequest {
  playerIds: string[];
  teamId?: string;
  workoutType: WorkoutType;
  assignments?: PlayerAssignmentData[];
  context: Pick<ValidationContext, 'organizationId' | 'userId'>;
}

export interface AssignmentValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  playerSummary: {
    total: number;
    eligible: number;
    restricted: number;
    unavailable: number;
  };
  restrictions: PlayerRestriction[];
  suggestions: ValidationSuggestion[];
}

export interface PlayerRestriction {
  playerId: string;
  playerName: string;
  restrictionType: 'medical' | 'availability' | 'capability';
  severity: 'blocking' | 'limiting' | 'advisory';
  description: string;
  alternatives?: string[];
  expiryDate?: string;
}

export interface MedicalValidationRequest {
  playerIds: string[];
  workoutType: WorkoutType;
  exercises?: string[];
  intensityLevel?: number;
  duration?: number;
  equipment?: string[];
  context: Pick<ValidationContext, 'organizationId'>;
}

export interface MedicalValidationResponse {
  isCompliant: boolean;
  overallRisk: 'low' | 'medium' | 'high';
  playerRisks: PlayerMedicalRisk[];
  exerciseRestrictions: ExerciseRestriction[];
  modifications: MedicalModification[];
  clearances: MedicalClearance[];
}

export interface PlayerMedicalRisk {
  playerId: string;
  playerName: string;
  riskLevel: 'low' | 'medium' | 'high';
  conditions: string[];
  restrictions: string[];
  recommendations: string[];
  requiresClearance: boolean;
}

export interface ExerciseRestriction {
  exerciseId: string;
  exerciseName: string;
  restrictionLevel: 'prohibited' | 'modified' | 'monitored';
  affectedPlayers: string[];
  alternatives: string[];
  modifications: string[];
}

export interface MedicalModification {
  playerId: string;
  exerciseId: string;
  modificationType: 'load_reduction' | 'range_limitation' | 'alternative_exercise' | 'additional_monitoring';
  description: string;
  parameters?: Record<string, any>;
}

export interface MedicalClearance {
  playerId: string;
  required: boolean;
  type: 'medical_staff' | 'physician' | 'specialist';
  reason: string;
  urgency: 'immediate' | 'before_session' | 'within_24h' | 'within_week';
}

export interface ScheduleValidationRequest {
  startDateTime: string;
  duration: number;
  playerIds?: string[];
  teamId?: string;
  facilityId?: string;
  workoutType: WorkoutType;
  context: Pick<ValidationContext, 'organizationId' | 'userId'>;
}

export interface ScheduleValidationResponse {
  isAvailable: boolean;
  conflicts: ScheduleConflict[];
  facilityStatus: FacilityAvailability;
  recommendations: ScheduleRecommendation[];
  alternativeSlots: TimeSlot[];
}

export interface ScheduleConflict {
  type: 'player' | 'team' | 'facility' | 'equipment' | 'staff';
  conflictId: string;
  title: string;
  startTime: string;
  endTime: string;
  severity: 'hard' | 'soft';
  affectedEntities: string[];
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  type: 'reschedule' | 'modify_duration' | 'change_facility' | 'reassign_players';
  description: string;
  feasibility: 'high' | 'medium' | 'low';
  impact: string;
}

export interface FacilityAvailability {
  available: boolean;
  capacity: number;
  currentBookings: number;
  availableEquipment: string[];
  unavailableEquipment: string[];
  restrictions: string[];
}

export interface ScheduleRecommendation {
  type: 'time' | 'facility' | 'duration';
  suggestion: string;
  benefit: string;
  confidence: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  score: number;
  reasoning: string;
}

// ============================================================================
// Batch Validation Types
// ============================================================================

export interface BatchValidationRequest {
  requests: ValidationRequest[];
  config?: {
    parallel: boolean;
    stopOnFirstError: boolean;
    maxConcurrency?: number;
  };
}

export interface BatchValidationResponse {
  results: BatchValidationResult[];
  summary: BatchValidationSummary;
  processingTime: number;
}

export interface BatchValidationResult {
  requestId: string;
  response: ValidationResponse;
  success: boolean;
  error?: string;
}

export interface BatchValidationSummary {
  total: number;
  successful: number;
  failed: number;
  valid: number;
  invalid: number;
  totalErrors: number;
  totalWarnings: number;
  averageScore: number;
}

// ============================================================================
// Real-time Validation Types
// ============================================================================

export interface RealTimeValidationConfig {
  /** Enable real-time validation */
  enabled: boolean;
  /** Debounce time in milliseconds */
  debounceMs: number;
  /** Fields to validate in real-time */
  fields: string[];
  /** Validation triggers */
  triggers: ValidationTrigger[];
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttlMs: number;
    maxEntries: number;
  };
}

export type ValidationTrigger = 
  | 'field_change'
  | 'player_assignment'
  | 'schedule_change'
  | 'content_modification'
  | 'medical_update';

export interface ValidationCache {
  key: string;
  request: ValidationRequest;
  response: ValidationResponse;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface ValidationState {
  /** Current validation status */
  status: 'idle' | 'validating' | 'completed' | 'error';
  /** Last validation result */
  lastResult?: ValidationResponse;
  /** Pending validation requests */
  pendingRequests: Set<string>;
  /** Validation cache */
  cache: Map<string, ValidationCache>;
  /** Real-time config */
  config: RealTimeValidationConfig;
  /** Error state */
  error?: string;
}

// ============================================================================
// Validation Rule Engine Types
// ============================================================================

export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule category */
  category: ValidationCategory;
  /** Applicable workout types */
  workoutTypes: WorkoutType[];
  /** Rule priority (higher = earlier execution) */
  priority: number;
  /** Rule condition */
  condition: RuleCondition;
  /** Rule action */
  action: RuleAction;
  /** Is rule enabled */
  enabled: boolean;
  /** Rule metadata */
  metadata?: Record<string, any>;
}

export interface RuleCondition {
  /** Field to evaluate */
  field?: string;
  /** Condition operator */
  operator: ConditionOperator;
  /** Expected value */
  value?: any;
  /** Custom evaluation function */
  customFunction?: string;
  /** Nested conditions */
  conditions?: RuleCondition[];
  /** Logical operator for nested conditions */
  logicalOperator?: 'AND' | 'OR';
}

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'custom';

export interface RuleAction {
  /** Action type */
  type: 'error' | 'warning' | 'suggestion';
  /** Result message */
  message: string;
  /** Error/warning code */
  code: string;
  /** Suggested resolution */
  resolution?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// API Endpoint Types
// ============================================================================

export interface ValidationEndpoints {
  /** Full workout validation */
  validateWorkout: {
    url: '/api/workouts/validate';
    method: 'POST';
    request: ValidationRequest;
    response: ValidationResponse;
  };
  
  /** Content-only validation */
  validateContent: {
    url: '/api/workouts/validate/content';
    method: 'POST';
    request: ContentValidationRequest;
    response: ContentValidationResponse;
  };
  
  /** Player assignment validation */
  validateAssignments: {
    url: '/api/workouts/validate/assignments';
    method: 'POST';
    request: AssignmentValidationRequest;
    response: AssignmentValidationResponse;
  };
  
  /** Medical compliance validation */
  validateMedical: {
    url: '/api/workouts/validate/medical';
    method: 'POST';
    request: MedicalValidationRequest;
    response: MedicalValidationResponse;
  };
  
  /** Schedule conflict validation */
  validateSchedule: {
    url: '/api/workouts/validate/schedule';
    method: 'POST';
    request: ScheduleValidationRequest;
    response: ScheduleValidationResponse;
  };
  
  /** Batch validation */
  validateBatch: {
    url: '/api/workouts/validate/batch';
    method: 'POST';
    request: BatchValidationRequest;
    response: BatchValidationResponse;
  };
  
  /** Get validation rules */
  getValidationRules: {
    url: '/api/workouts/validation/rules';
    method: 'GET';
    response: { rules: ValidationRule[] };
  };
  
  /** Update validation configuration */
  updateValidationConfig: {
    url: '/api/workouts/validation/config';
    method: 'PUT';
    request: RealTimeValidationConfig;
    response: { success: boolean };
  };
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface ValidationApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Error details */
  details?: Record<string, any>;
  /** Timestamp */
  timestamp: string;
  /** Request ID for tracking */
  requestId?: string;
  /** Support reference */
  supportId?: string;
}

export interface ValidationTimeoutError extends ValidationApiError {
  code: 'VALIDATION_TIMEOUT';
  timeout: number;
  partialResults?: Partial<ValidationResponse>;
}

export interface ValidationNetworkError extends ValidationApiError {
  code: 'VALIDATION_NETWORK_ERROR';
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface ValidationSummary {
  /** Overall status */
  status: 'valid' | 'invalid' | 'warning';
  /** Score out of 100 */
  score: number;
  /** Error count by severity */
  errors: Record<ValidationSeverity, number>;
  /** Warning count by category */
  warnings: Record<ValidationCategory, number>;
  /** Top issues */
  topIssues: string[];
  /** Recommendations */
  recommendations: string[];
}

export interface ValidationProgress {
  /** Current step */
  step: string;
  /** Completed steps */
  completed: number;
  /** Total steps */
  total: number;
  /** Percentage complete */
  percentage: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
}

// ============================================================================
// Export all types
// ============================================================================
// Note: All types are already exported individually above.
// This section has been removed to avoid duplicate exports.