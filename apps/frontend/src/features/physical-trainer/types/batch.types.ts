/**
 * Batch Operations Types for Physical Trainer
 * 
 * Provides comprehensive type definitions for handling bulk workout operations
 * including creation, updates, deletion, assignment, and scheduling.
 */

// Note: Avoiding circular dependency with index.ts
// Using 'any' types to avoid import issues with non-existent exports
type WorkoutSession = any;
type WorkoutTemplate = any;

// Define SessionPlayer type locally since training.types doesn't exist
export interface SessionPlayer {
  playerId: string;
  playerName: string;
  status?: 'active' | 'rest' | 'injured';
  loadPercentage?: number;
}

// Base types for batch operations
export interface BatchOperationItem<T = any> {
  id: string;
  data: T;
  status?: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
  retryCount?: number;
}

export interface BatchOperationResult<T = any> {
  successful: T[];
  failed: BatchOperationError[];
  total: number;
  successCount: number;
  failureCount: number;
  duration: number;
  operationType: BatchOperationType;
}

export interface BatchOperationError {
  itemId: string;
  error: string;
  data?: any;
  retryable: boolean;
}

export enum BatchOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  SCHEDULE = 'schedule',
  DUPLICATE = 'duplicate',
  EXPORT = 'export',
  IMPORT = 'import'
}

// Batch Create Operations
export interface BatchCreateWorkoutRequest {
  templates: Partial<WorkoutTemplate>[];
  options?: {
    skipValidation?: boolean;
    validateOnly?: boolean;
    assignToTeams?: string[];
    assignToPlayers?: string[];
  };
}

export interface BatchCreateWorkoutResponse extends BatchOperationResult<WorkoutTemplate> {
  createdTemplates: WorkoutTemplate[];
  validationErrors?: Record<string, string[]>;
}

// Batch Update Operations
export interface BatchUpdateWorkoutRequest {
  updates: Array<{
    id: string;
    changes: Partial<WorkoutTemplate>;
  }>;
  options?: {
    mergeStrategy?: 'replace' | 'merge' | 'patch';
    skipConflictCheck?: boolean;
    forceUpdate?: boolean;
  };
}

export interface BatchUpdateWorkoutResponse extends BatchOperationResult<WorkoutTemplate> {
  updatedTemplates: WorkoutTemplate[];
  conflicts?: Array<{
    id: string;
    field: string;
    currentValue: any;
    newValue: any;
  }>;
}

// Batch Delete Operations
export interface BatchDeleteWorkoutRequest {
  templateIds: string[];
  options?: {
    cascade?: boolean; // Delete associated sessions
    softDelete?: boolean;
    archiveData?: boolean;
  };
}

export interface BatchDeleteWorkoutResponse extends BatchOperationResult<string> {
  deletedIds: string[];
  cascadedDeletions?: {
    sessions: number;
    assignments: number;
  };
}

// Batch Assignment Operations
export interface BatchAssignmentTarget {
  type: 'player' | 'team' | 'group';
  id: string;
  metadata?: Record<string, any>;
}

export interface BatchAssignWorkoutRequest {
  templateIds: string[];
  targets: BatchAssignmentTarget[];
  options?: {
    scheduleDate?: string;
    duration?: number;
    notes?: string;
    overrideExisting?: boolean;
  };
}

export interface BatchAssignWorkoutResponse extends BatchOperationResult<WorkoutSession> {
  assignments: Array<{
    templateId: string;
    targetId: string;
    sessionId: string;
  }>;
  skipped?: Array<{
    templateId: string;
    targetId: string;
    reason: string;
  }>;
}

// Batch Schedule Operations
export interface BatchSchedulePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  daysOfMonth?: number[];
  startDate: string;
  endDate?: string;
  excludeDates?: string[];
}

export interface BatchScheduleWorkoutRequest {
  templateIds: string[];
  pattern: BatchSchedulePattern;
  targets: BatchAssignmentTarget[];
  options?: {
    timeSlots?: string[]; // HH:mm format
    location?: string;
    autoResolveConflicts?: boolean;
    notifyPlayers?: boolean;
  };
}

export interface BatchScheduleWorkoutResponse extends BatchOperationResult<WorkoutSession> {
  scheduledSessions: WorkoutSession[];
  conflicts?: Array<{
    date: string;
    time: string;
    conflictingSessionId: string;
    resolution?: 'skipped' | 'rescheduled' | 'overridden';
  }>;
}

// Batch Template Operations
export interface BatchTemplateOperation {
  type: 'duplicate' | 'merge' | 'split';
  sourceTemplateIds: string[];
  options?: Record<string, any>;
}

export interface BatchDuplicateTemplateRequest {
  templateIds: string[];
  options?: {
    namePrefix?: string;
    nameSuffix?: string;
    modifyData?: (template: WorkoutTemplate) => Partial<WorkoutTemplate>;
    targetFolder?: string;
  };
}

// Progress Tracking
export interface BatchOperationProgress {
  operationId: string;
  type: BatchOperationType;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  startTime: Date;
  estimatedTimeRemaining?: number;
  currentItem?: string;
  errors: BatchOperationError[];
  cancellable: boolean;
}

export interface BatchOperationOptions {
  atomic?: boolean; // All or nothing
  parallel?: boolean; // Process in parallel
  chunkSize?: number; // Items per chunk
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    retryableErrors?: string[];
  };
  progressCallback?: (progress: BatchOperationProgress) => void;
  onError?: 'continue' | 'stop' | 'rollback';
}

// Import/Export Operations
export interface BatchImportRequest {
  file?: File;
  data?: any[];
  format: 'json' | 'csv' | 'excel';
  mapping?: Record<string, string>; // Field mapping
  options?: {
    validateBeforeImport?: boolean;
    updateExisting?: boolean;
    skipDuplicates?: boolean;
  };
}

export interface BatchExportRequest {
  templateIds?: string[];
  filters?: Record<string, any>;
  format: 'json' | 'csv' | 'excel' | 'pdf';
  options?: {
    includeMetadata?: boolean;
    includeHistory?: boolean;
    groupBy?: string;
  };
}

// Conflict Resolution
export interface BatchConflictResolution {
  strategy: 'skip' | 'override' | 'merge' | 'rename' | 'manual';
  rules?: Array<{
    field: string;
    condition: 'always' | 'if_newer' | 'if_different';
    action: 'use_source' | 'use_target' | 'merge' | 'prompt';
  }>;
}

// Rollback Support
export interface BatchOperationSnapshot {
  operationId: string;
  timestamp: Date;
  affectedItems: Array<{
    id: string;
    type: string;
    previousState: any;
    newState: any;
  }>;
}

export interface BatchRollbackRequest {
  operationId: string;
  options?: {
    partial?: boolean; // Rollback only failed items
    preserveSuccessful?: boolean;
  };
}

// Utility Types
export type BatchOperationStatus = 
  | 'idle'
  | 'validating'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolling_back';

export interface BatchValidationResult {
  valid: boolean;
  errors: Array<{
    itemIndex: number;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

// Hook Types
export interface UseBatchOperationOptions {
  onProgress?: (progress: BatchOperationProgress) => void;
  onComplete?: (result: BatchOperationResult) => void;
  onError?: (error: BatchOperationError[]) => void;
  autoRetry?: boolean;
  notifyOnComplete?: boolean;
}

export interface BatchOperationState {
  operations: Record<string, BatchOperationProgress>;
  activeOperationId?: string;
  history: BatchOperationResult[];
}