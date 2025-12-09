/**
 * Batch Operations Types for Workout Management
 * 
 * Provides comprehensive type definitions for performing bulk operations
 * on workouts including creation, updates, scheduling, and assignments.
 */

import { 
  WorkoutType, 
  BaseWorkout, 
  WorkoutSession,
  PlayerAssignment,
  ValidationError
} from './base-types';

/**
 * Types of batch operations supported
 */
export enum BatchOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  SCHEDULE = 'SCHEDULE',
  DUPLICATE = 'DUPLICATE',
  ARCHIVE = 'ARCHIVE',
  TEMPLATE = 'TEMPLATE'
}

/**
 * Status of individual batch operations
 */
export enum BatchOperationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED'
}

/**
 * Base structure for a batch operation
 */
export interface BatchOperation<T = any> {
  id: string;
  type: BatchOperationType;
  data: T;
  priority?: number;
  dependencies?: string[]; // IDs of operations that must complete first
  metadata?: Record<string, any>;
}

/**
 * Operation-specific data types
 */
export interface CreateWorkoutData {
  workout: Partial<BaseWorkout>;
  assignments?: PlayerAssignment[];
  schedule?: ScheduleData;
  templateId?: string;
}

export interface UpdateWorkoutData {
  workoutId: string;
  updates: Partial<BaseWorkout>;
  preserveAssignments?: boolean;
}

export interface AssignWorkoutData {
  workoutId: string;
  assignments: PlayerAssignment[];
  removeExisting?: boolean;
  checkMedicalCompliance?: boolean;
}

export interface ScheduleData {
  workoutId?: string;
  startTime: Date;
  endTime: Date;
  facilityId?: string;
  recurring?: RecurringSchedule;
  conflictResolution?: ConflictResolutionStrategy;
}

export interface DuplicateWorkoutData {
  sourceWorkoutId: string;
  count: number;
  modifications?: Partial<BaseWorkout>;
  includeAssignments?: boolean;
  namePattern?: string; // e.g., "{original} - Copy {n}"
}

export interface DeleteWorkoutData {
  workoutId: string;
  permanent?: boolean;
  cascadeDelete?: boolean; // Delete related data
}

export interface TemplateCreationData {
  workoutIds: string[];
  templateName: string;
  category: string;
  description?: string;
  tags?: string[];
  visibility?: 'private' | 'team' | 'organization' | 'public';
}

/**
 * Recurring schedule configuration
 */
export interface RecurringSchedule {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // For monthly
  endDate?: Date;
  occurrences?: number;
  exceptions?: Date[]; // Dates to skip
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  SKIP = 'SKIP',
  OVERRIDE = 'OVERRIDE',
  ADJUST_TIME = 'ADJUST_TIME',
  FIND_ALTERNATIVE = 'FIND_ALTERNATIVE',
  PROMPT_USER = 'PROMPT_USER'
}

/**
 * Batch operation options
 */
export interface BatchOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  stopOnError?: boolean;
  rollbackOnError?: boolean;
  validateBeforeExecute?: boolean;
  chunkSize?: number;
  retryFailedOperations?: boolean;
  retryAttempts?: number;
  progressCallback?: (progress: BatchProgress) => void;
  conflictResolution?: ConflictResolutionStrategy;
  medicalComplianceCheck?: boolean;
  notifyOnComplete?: boolean;
}

/**
 * Batch metadata for tracking and auditing
 */
export interface BatchMetadata {
  requestId: string;
  userId: string;
  timestamp: Date;
  source: string;
  description?: string;
  tags?: string[];
  estimatedDuration?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Main batch request structure
 */
export interface BatchRequest<T = any> {
  operations: BatchOperation<T>[];
  options: BatchOptions;
  metadata: BatchMetadata;
}

/**
 * Individual operation result
 */
export interface BatchOperationResult<T = any> {
  operationId: string;
  status: BatchOperationStatus;
  result?: T;
  error?: BatchError;
  duration?: number;
  retryCount?: number;
  timestamp: Date;
}

/**
 * Batch error details
 */
export interface BatchError {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
  suggestedAction?: string;
  validationErrors?: ValidationError[];
}

/**
 * Overall batch response
 */
export interface BatchResponse<T = any> {
  requestId: string;
  status: 'completed' | 'partial' | 'failed' | 'cancelled';
  results: BatchOperationResult<T>[];
  summary: BatchSummary;
  errors?: BatchError[];
  metadata: BatchMetadata;
}

/**
 * Batch execution summary
 */
export interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  cancelled: number;
  duration: number;
  averageOperationTime: number;
  peakConcurrency: number;
}

/**
 * Progress tracking for batch operations
 */
export interface BatchProgress {
  requestId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
  canCancel: boolean;
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  valid: boolean;
  errors: BatchValidationError[];
  warnings: BatchValidationWarning[];
  estimatedDuration: number;
  resourceRequirements: ResourceRequirements;
}

export interface BatchValidationError {
  operationId: string;
  field?: string;
  message: string;
  code: string;
}

export interface BatchValidationWarning {
  operationId: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ResourceRequirements {
  estimatedApiCalls: number;
  estimatedDatabaseQueries: number;
  estimatedMemoryUsage: number;
  requiredPermissions: string[];
}

/**
 * Undo/Rollback support
 */
export interface BatchUndoContext {
  requestId: string;
  operations: UndoOperation[];
  expiresAt: Date;
}

export interface UndoOperation {
  operationId: string;
  type: BatchOperationType;
  undoData: any;
  dependencies?: string[];
}

/**
 * Batch selection controls
 */
export interface BatchSelection {
  selectedIds: Set<string>;
  selectAll: boolean;
  filters?: SelectionFilters;
}

export interface SelectionFilters {
  workoutTypes?: WorkoutType[];
  dateRange?: { start: Date; end: Date };
  assignedPlayers?: string[];
  assignedTeams?: string[];
  tags?: string[];
  status?: string[];
}

/**
 * Chunk processing for large batches
 */
export interface BatchChunk {
  chunkId: string;
  operations: BatchOperation[];
  startIndex: number;
  endIndex: number;
  status: BatchOperationStatus;
}

/**
 * Background processing job
 */
export interface BatchJob {
  jobId: string;
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: BatchProgress;
  startedAt?: Date;
  completedAt?: Date;
  result?: BatchResponse;
  error?: BatchError;
}

/**
 * Notification preferences for batch operations
 */
export interface BatchNotificationPreferences {
  onStart?: boolean;
  onProgress?: boolean | number; // true or percentage threshold
  onComplete?: boolean;
  onError?: boolean;
  channels?: ('email' | 'push' | 'in-app')[];
}

/**
 * Type guards
 */
export const isBatchOperation = (obj: any): obj is BatchOperation => {
  return obj && typeof obj.id === 'string' && obj.type in BatchOperationType;
};

export const isCreateOperation = (op: BatchOperation): op is BatchOperation<CreateWorkoutData> => {
  return op.type === BatchOperationType.CREATE;
};

export const isUpdateOperation = (op: BatchOperation): op is BatchOperation<UpdateWorkoutData> => {
  return op.type === BatchOperationType.UPDATE;
};

export const isAssignOperation = (op: BatchOperation): op is BatchOperation<AssignWorkoutData> => {
  return op.type === BatchOperationType.ASSIGN;
};

export const isScheduleOperation = (op: BatchOperation): op is BatchOperation<ScheduleData> => {
  return op.type === BatchOperationType.SCHEDULE;
};

export const isDuplicateOperation = (op: BatchOperation): op is BatchOperation<DuplicateWorkoutData> => {
  return op.type === BatchOperationType.DUPLICATE;
};

export const isDeleteOperation = (op: BatchOperation): op is BatchOperation<DeleteWorkoutData> => {
  return op.type === BatchOperationType.DELETE;
};

export const isTemplateOperation = (op: BatchOperation): op is BatchOperation<TemplateCreationData> => {
  return op.type === BatchOperationType.TEMPLATE;
};

/**
 * Helper to create batch operations
 */
export class BatchOperationBuilder {
  private operations: BatchOperation[] = [];

  create(data: CreateWorkoutData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.CREATE,
      data,
      metadata
    });
    return this;
  }

  update(data: UpdateWorkoutData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.UPDATE,
      data,
      metadata
    });
    return this;
  }

  assign(data: AssignWorkoutData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.ASSIGN,
      data,
      metadata
    });
    return this;
  }

  schedule(data: ScheduleData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.SCHEDULE,
      data,
      metadata
    });
    return this;
  }

  duplicate(data: DuplicateWorkoutData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.DUPLICATE,
      data,
      metadata
    });
    return this;
  }

  delete(data: DeleteWorkoutData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.DELETE,
      data,
      metadata
    });
    return this;
  }

  template(data: TemplateCreationData, metadata?: Record<string, any>): this {
    this.operations.push({
      id: this.generateId(),
      type: BatchOperationType.TEMPLATE,
      data,
      metadata
    });
    return this;
  }

  build(): BatchOperation[] {
    return this.operations;
  }

  private generateId(): string {
    return `batch-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Batch operation utilities
 */
export const batchUtils = {
  /**
   * Estimate duration for batch operations
   */
  estimateDuration(operations: BatchOperation[], avgOperationTime = 500): number {
    const parallelFactor = 0.3; // Assume 30% time savings from parallelization
    return operations.length * avgOperationTime * (1 - parallelFactor);
  },

  /**
   * Group operations by type for optimization
   */
  groupByType(operations: BatchOperation[]): Map<BatchOperationType, BatchOperation[]> {
    const groups = new Map<BatchOperationType, BatchOperation[]>();
    operations.forEach(op => {
      const group = groups.get(op.type) || [];
      group.push(op);
      groups.set(op.type, group);
    });
    return groups;
  },

  /**
   * Sort operations by dependencies
   */
  sortByDependencies(operations: BatchOperation[]): BatchOperation[] {
    const sorted: BatchOperation[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (op: BatchOperation) => {
      if (visited.has(op.id)) return;
      if (visiting.has(op.id)) {
        throw new Error(`Circular dependency detected for operation ${op.id}`);
      }

      visiting.add(op.id);

      if (op.dependencies) {
        op.dependencies.forEach(depId => {
          const dep = operations.find(o => o.id === depId);
          if (dep) visit(dep);
        });
      }

      visiting.delete(op.id);
      visited.add(op.id);
      sorted.push(op);
    };

    operations.forEach(visit);
    return sorted;
  },

  /**
   * Create chunks for large batch processing
   */
  createChunks(operations: BatchOperation[], chunkSize: number): BatchChunk[] {
    const chunks: BatchChunk[] = [];
    for (let i = 0; i < operations.length; i += chunkSize) {
      chunks.push({
        chunkId: `chunk-${i / chunkSize}`,
        operations: operations.slice(i, i + chunkSize),
        startIndex: i,
        endIndex: Math.min(i + chunkSize - 1, operations.length - 1),
        status: BatchOperationStatus.PENDING
      });
    }
    return chunks;
  }
};