/**
 * Standardized API types for all workout operations
 * Provides consistent request/response formats across all workout types
 */

import { 
  WorkoutType, 
  BaseWorkout, 
  StrengthWorkout, 
  ConditioningWorkout, 
  HybridWorkout, 
  AgilityWorkout 
} from './base-types';

// ============================================
// Common Types
// ============================================

/**
 * Standard API response metadata
 */
export interface ApiMetadata {
  timestamp: string;
  version: string;
  requestId: string;
  duration: number;
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard pagination response
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard filter parameters
 */
export interface FilterParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  types?: WorkoutType[];
  playerIds?: string[];
  teamIds?: string[];
  createdBy?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  [key: string]: any; // Allow custom filters
}

/**
 * Standard error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    requestId: string;
  };
}

/**
 * Standard success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMetadata;
}

/**
 * Standard list response wrapper
 */
export interface ApiListResponse<T> {
  data: T[];
  pagination: PaginationResponse;
  meta: ApiMetadata;
}

// ============================================
// Workout-Specific Types
// ============================================

/**
 * Unified workout type that can represent any workout
 */
export type UnifiedWorkout = StrengthWorkout | ConditioningWorkout | HybridWorkout | AgilityWorkout;

/**
 * Base workout request fields (common to all types)
 */
export interface BaseWorkoutRequest {
  name: string;
  description?: string;
  scheduledDate?: string;
  assignedPlayerIds?: string[];
  assignedTeamIds?: string[];
  tags?: string[];
  notes?: string;
  facilityId?: string;
}

/**
 * Create workout request based on type
 */
export interface CreateWorkoutRequest<T extends WorkoutType = WorkoutType> {
  type: T;
  workout: T extends 'STRENGTH' ? Omit<StrengthWorkout, 'id' | 'createdAt' | 'updatedAt'> :
           T extends 'CONDITIONING' ? Omit<ConditioningWorkout, 'id' | 'createdAt' | 'updatedAt'> :
           T extends 'HYBRID' ? Omit<HybridWorkout, 'id' | 'createdAt' | 'updatedAt'> :
           T extends 'AGILITY' ? Omit<AgilityWorkout, 'id' | 'createdAt' | 'updatedAt'> :
           never;
}

/**
 * Update workout request
 */
export interface UpdateWorkoutRequest<T extends WorkoutType = WorkoutType> {
  id: string;
  type: T;
  workout: Partial<CreateWorkoutRequest<T>['workout']>;
}

/**
 * Batch operation request
 */
export interface BatchOperationRequest {
  operation: 'create' | 'update' | 'delete' | 'duplicate' | 'archive';
  workoutIds?: string[];
  workouts?: CreateWorkoutRequest[];
  updates?: Partial<BaseWorkoutRequest>;
}

/**
 * Batch operation response
 */
export interface BatchOperationResponse {
  successful: string[];
  failed: Array<{
    id?: string;
    error: string;
    details?: any;
  }>;
  meta: ApiMetadata;
}

/**
 * Workout validation request
 */
export interface ValidateWorkoutRequest {
  workout: Partial<UnifiedWorkout>;
  type: WorkoutType;
  context?: {
    playerIds?: string[];
    teamIds?: string[];
    scheduledDate?: string;
    facilityId?: string;
  };
}

/**
 * Workout validation response
 */
export interface ValidateWorkoutResponse {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  suggestions?: Array<{
    field: string;
    suggestion: string;
    value?: any;
  }>;
}

/**
 * Duplicate workout request
 */
export interface DuplicateWorkoutRequest {
  sourceId: string;
  modifications?: Partial<BaseWorkoutRequest>;
  includeAssignments?: boolean;
}

/**
 * Workout statistics
 */
export interface WorkoutStatistics {
  totalCount: number;
  byType: Record<WorkoutType, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
  popularExercises?: Array<{
    exerciseId: string;
    name: string;
    count: number;
  }>;
}

// ============================================
// API Endpoint Types
// ============================================

/**
 * List workouts endpoint
 * GET /api/workouts
 */
export interface ListWorkoutsRequest {
  pagination?: PaginationParams;
  filters?: FilterParams;
}

export type ListWorkoutsResponse = ApiListResponse<UnifiedWorkout>;

/**
 * Get single workout endpoint
 * GET /api/workouts/:id
 */
export interface GetWorkoutRequest {
  id: string;
  include?: Array<'assignments' | 'history' | 'analytics'>;
}

export type GetWorkoutResponse = ApiSuccessResponse<UnifiedWorkout>;

/**
 * Create workout endpoint
 * POST /api/workouts
 */
export type CreateWorkoutResponse = ApiSuccessResponse<UnifiedWorkout>;

/**
 * Update workout endpoint
 * PUT /api/workouts/:id
 */
export type UpdateWorkoutResponse = ApiSuccessResponse<UnifiedWorkout>;

/**
 * Delete workout endpoint
 * DELETE /api/workouts/:id
 */
export interface DeleteWorkoutResponse {
  success: boolean;
  meta: ApiMetadata;
}

/**
 * Batch operations endpoint
 * POST /api/workouts/batch
 */
export type BatchWorkoutsResponse = BatchOperationResponse;

/**
 * Duplicate workout endpoint
 * POST /api/workouts/:id/duplicate
 */
export type DuplicateWorkoutResponse = ApiSuccessResponse<UnifiedWorkout>;

/**
 * Validate workout endpoint
 * GET /api/workouts/:id/validate
 * POST /api/workouts/validate
 */
export type ValidateWorkoutResponseType = ApiSuccessResponse<ValidateWorkoutResponse>;

/**
 * Get workout statistics endpoint
 * GET /api/workouts/statistics
 */
export interface GetWorkoutStatisticsRequest {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
  playerIds?: string[];
  teamIds?: string[];
}

export type GetWorkoutStatisticsResponse = ApiSuccessResponse<WorkoutStatistics>;

// ============================================
// Error Codes
// ============================================

export enum WorkoutErrorCode {
  // Validation errors
  INVALID_WORKOUT_TYPE = 'INVALID_WORKOUT_TYPE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  
  // Business logic errors
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  FACILITY_NOT_AVAILABLE = 'FACILITY_NOT_AVAILABLE',
  SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT',
  MEDICAL_RESTRICTION = 'MEDICAL_RESTRICTION',
  
  // Permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}

// ============================================
// Transform Utilities
// ============================================

/**
 * Transform workout to API format
 */
export function toApiWorkout(workout: UnifiedWorkout): any {
  return {
    ...workout,
    scheduledDate: workout.scheduledDate ? new Date(workout.scheduledDate).toISOString() : undefined,
    createdAt: workout.createdAt ? new Date(workout.createdAt).toISOString() : undefined,
    updatedAt: workout.updatedAt ? new Date(workout.updatedAt).toISOString() : undefined,
  };
}

/**
 * Transform API response to workout
 */
export function fromApiWorkout(data: any): UnifiedWorkout {
  return {
    ...data,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
  };
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

// ============================================
// Type Guards
// ============================================

export function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response === 'object' && 'error' in response;
}

export function isStrengthWorkout(workout: UnifiedWorkout): workout is StrengthWorkout {
  return workout.type === 'STRENGTH';
}

export function isConditioningWorkout(workout: UnifiedWorkout): workout is ConditioningWorkout {
  return workout.type === 'CONDITIONING';
}

export function isHybridWorkout(workout: UnifiedWorkout): workout is HybridWorkout {
  return workout.type === 'HYBRID';
}

export function isAgilityWorkout(workout: UnifiedWorkout): workout is AgilityWorkout {
  return workout.type === 'AGILITY';
}