/**
 * Batch Operations Hooks for Workout Management
 * 
 * Provides hooks for performing bulk operations on workouts with
 * progress tracking, error handling, and performance optimizations.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BatchRequest,
  BatchResponse,
  BatchProgress,
  BatchOperation,
  BatchOperationType,
  BatchValidationResult,
  BatchUndoContext,
  BatchChunk,
  BatchJob,
  BatchOptions,
  BatchMetadata,
  batchUtils,
  CreateWorkoutData,
  UpdateWorkoutData,
  AssignWorkoutData,
  ScheduleData,
  DuplicateWorkoutData,
  DeleteWorkoutData,
  TemplateCreationData
} from '../types/batch-operations.types';
import { BaseWorkout, WorkoutSession } from '../types';
import { useMedicalCompliance } from './useMedicalCompliance';

/**
 * Configuration for batch operations
 */
const BATCH_CONFIG = {
  DEFAULT_CHUNK_SIZE: 10,
  MAX_CONCURRENCY: 5,
  DEFAULT_RETRY_ATTEMPTS: 3,
  PROGRESS_UPDATE_INTERVAL: 500,
  VALIDATION_DEBOUNCE: 300,
  UNDO_EXPIRATION_HOURS: 24
};

/**
 * Main batch operations hook
 */
export const useBatchOperations = () => {
  const [activeJobs, setActiveJobs] = useState<Map<string, BatchJob>>(new Map());
  const [undoContexts, setUndoContexts] = useState<Map<string, BatchUndoContext>>(new Map());
  const queryClient = useQueryClient();
  const { checkCompliance } = useMedicalCompliance();
  const workersRef = useRef<Worker[]>([]);

  /**
   * Execute batch operations
   */
  const executeBatch = useCallback(async <T = any>(
    request: BatchRequest<T>
  ): Promise<BatchResponse<T>> => {
    const job: BatchJob = {
      jobId: generateJobId(),
      requestId: request.metadata.requestId,
      status: 'queued',
      progress: {
        requestId: request.metadata.requestId,
        total: request.operations.length,
        completed: 0,
        failed: 0,
        inProgress: 0,
        percentComplete: 0,
        canCancel: true
      }
    };

    setActiveJobs(prev => new Map(prev).set(job.jobId, job));

    try {
      // Validate operations if requested
      if (request.options.validateBeforeExecute) {
        const validation = await validateBatch(request);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Start processing
      job.status = 'processing';
      job.startedAt = new Date();
      setActiveJobs(prev => new Map(prev).set(job.jobId, job));

      const response = await processBatchOperations(request, job);
      
      // Store undo context if successful
      if (response.status === 'completed' || response.status === 'partial') {
        const undoContext = createUndoContext(request, response);
        setUndoContexts(prev => new Map(prev).set(response.requestId, undoContext));
        
        // Clean up expired undo contexts
        cleanupExpiredUndoContexts();
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = response;
      setActiveJobs(prev => new Map(prev).set(job.jobId, job));

      // Invalidate relevant queries
      await invalidateQueries(request.operations);

      // Show notification
      if (request.options.notifyOnComplete) {
        showCompletionNotification(response);
      }

      return response;
    } catch (error) {
      job.status = 'failed';
      job.error = {
        code: 'BATCH_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true
      };
      setActiveJobs(prev => new Map(prev).set(job.jobId, job));
      throw error;
    }
  }, [queryClient, checkCompliance]);

  /**
   * Process batch operations with chunking and concurrency control
   */
  const processBatchOperations = async <T>(
    request: BatchRequest<T>,
    job: BatchJob
  ): Promise<BatchResponse<T>> => {
    const { operations, options } = request;
    const sortedOps = batchUtils.sortByDependencies(operations);
    const chunks = batchUtils.createChunks(sortedOps, options.chunkSize || BATCH_CONFIG.DEFAULT_CHUNK_SIZE);
    
    const results: any[] = [];
    const errors: any[] = [];
    let completed = 0;
    let failed = 0;

    const updateProgress = (inProgress: number) => {
      const progress: BatchProgress = {
        requestId: request.metadata.requestId,
        total: operations.length,
        completed,
        failed,
        inProgress,
        percentComplete: Math.round((completed / operations.length) * 100),
        canCancel: job.status === 'processing'
      };

      job.progress = progress;
      setActiveJobs(prev => new Map(prev).set(job.jobId, job));
      
      if (options.progressCallback) {
        options.progressCallback(progress);
      }
    };

    // Process chunks
    for (const chunk of chunks) {
      if (job.status === 'failed' && options.stopOnError) {
        break;
      }

      updateProgress(chunk.operations.length);

      try {
        const chunkResults = await processChunk(chunk, options);
        results.push(...chunkResults);
        
        const chunkFailed = chunkResults.filter(r => r.status === 'FAILED').length;
        completed += chunkResults.length - chunkFailed;
        failed += chunkFailed;
      } catch (error) {
        failed += chunk.operations.length;
        errors.push({
          code: 'CHUNK_PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Chunk processing failed'
        });

        if (options.stopOnError) {
          break;
        }
      }

      updateProgress(0);
    }

    const summary = {
      total: operations.length,
      successful: completed,
      failed,
      skipped: 0,
      cancelled: 0,
      duration: Date.now() - (job.startedAt?.getTime() || Date.now()),
      averageOperationTime: (Date.now() - (job.startedAt?.getTime() || Date.now())) / operations.length,
      peakConcurrency: options.maxConcurrency || BATCH_CONFIG.MAX_CONCURRENCY
    };

    const status = failed === 0 ? 'completed' : 
                  completed > 0 ? 'partial' : 'failed';

    return {
      requestId: request.metadata.requestId,
      status,
      results,
      summary,
      errors: errors.length > 0 ? errors : undefined,
      metadata: request.metadata
    };
  };

  /**
   * Process a single chunk of operations
   */
  const processChunk = async (chunk: BatchChunk, options: BatchOptions) => {
    const maxConcurrency = options.maxConcurrency || BATCH_CONFIG.MAX_CONCURRENCY;
    const results = [];

    // Use semaphore-like pattern for concurrency control
    const semaphore = new Array(maxConcurrency).fill(null);
    let index = 0;

    const processOperation = async (operation: BatchOperation): Promise<any> => {
      try {
        const result = await executeOperation(operation, options);
        return {
          operationId: operation.id,
          status: 'SUCCESS',
          result,
          timestamp: new Date()
        };
      } catch (error) {
        return {
          operationId: operation.id,
          status: 'FAILED',
          error: {
            code: 'OPERATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date()
        };
      }
    };

    // Process operations with concurrency control
    const promises = chunk.operations.map(async (operation) => {
      // Wait for available slot
      while (semaphore.every(slot => slot !== null)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const slotIndex = semaphore.findIndex(slot => slot === null);
      semaphore[slotIndex] = operation.id;

      try {
        const result = await processOperation(operation);
        return result;
      } finally {
        semaphore[slotIndex] = null;
      }
    });

    return Promise.all(promises);
  };

  /**
   * Execute individual operation based on type
   */
  const executeOperation = async (operation: BatchOperation, options: BatchOptions): Promise<any> => {
    switch (operation.type) {
      case BatchOperationType.CREATE:
        return executeCreateOperation(operation.data as CreateWorkoutData, options);
      
      case BatchOperationType.UPDATE:
        return executeUpdateOperation(operation.data as UpdateWorkoutData, options);
      
      case BatchOperationType.ASSIGN:
        return executeAssignOperation(operation.data as AssignWorkoutData, options);
      
      case BatchOperationType.SCHEDULE:
        return executeScheduleOperation(operation.data as ScheduleData, options);
      
      case BatchOperationType.DUPLICATE:
        return executeDuplicateOperation(operation.data as DuplicateWorkoutData, options);
      
      case BatchOperationType.DELETE:
        return executeDeleteOperation(operation.data as DeleteWorkoutData, options);
      
      case BatchOperationType.TEMPLATE:
        return executeTemplateOperation(operation.data as TemplateCreationData, options);
      
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  };

  /**
   * Individual operation executors
   */
  const executeCreateOperation = async (data: CreateWorkoutData, options: BatchOptions) => {
    // Medical compliance check if requested
    if (options.medicalComplianceCheck && data.assignments) {
      const compliance = await checkCompliance(data.assignments);
      if (!compliance.isCompliant) {
        throw new Error(`Medical compliance check failed: ${compliance.issues.join(', ')}`);
      }
    }

    // Simulate API call - replace with actual implementation
    const response = await fetch('/api/training/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeUpdateOperation = async (data: UpdateWorkoutData, options: BatchOptions) => {
    const response = await fetch(`/api/training/workouts/${data.workoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeAssignOperation = async (data: AssignWorkoutData, options: BatchOptions) => {
    if (options.medicalComplianceCheck) {
      const compliance = await checkCompliance(data.assignments);
      if (!compliance.isCompliant) {
        throw new Error(`Medical compliance check failed: ${compliance.issues.join(', ')}`);
      }
    }

    const response = await fetch(`/api/training/workouts/${data.workoutId}/assignments`, {
      method: data.removeExisting ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: data.assignments })
    });

    if (!response.ok) {
      throw new Error(`Failed to assign workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeScheduleOperation = async (data: ScheduleData, options: BatchOptions) => {
    const response = await fetch('/api/training/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeDuplicateOperation = async (data: DuplicateWorkoutData, options: BatchOptions) => {
    const response = await fetch(`/api/training/workouts/${data.sourceWorkoutId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to duplicate workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeDeleteOperation = async (data: DeleteWorkoutData, options: BatchOptions) => {
    const response = await fetch(`/api/training/workouts/${data.workoutId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permanent: data.permanent })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workout: ${response.statusText}`);
    }

    return response.json();
  };

  const executeTemplateOperation = async (data: TemplateCreationData, options: BatchOptions) => {
    const response = await fetch('/api/training/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }

    return response.json();
  };

  /**
   * Validate batch operations
   */
  const validateBatch = async <T>(request: BatchRequest<T>): Promise<BatchValidationResult> => {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation
    request.operations.forEach(op => {
      if (!op.id) {
        errors.push({
          operationId: op.id || 'unknown',
          message: 'Operation ID is required',
          code: 'MISSING_ID'
        });
      }

      if (!Object.values(BatchOperationType).includes(op.type)) {
        errors.push({
          operationId: op.id,
          message: `Invalid operation type: ${op.type}`,
          code: 'INVALID_TYPE'
        });
      }
    });

    // Check for dependency cycles
    try {
      batchUtils.sortByDependencies(request.operations);
    } catch (error) {
      errors.push({
        operationId: 'batch',
        message: 'Circular dependencies detected',
        code: 'CIRCULAR_DEPENDENCY'
      });
    }

    // Estimate resource requirements
    const estimatedDuration = batchUtils.estimateDuration(request.operations);
    const resourceRequirements = {
      estimatedApiCalls: request.operations.length,
      estimatedDatabaseQueries: request.operations.length * 2,
      estimatedMemoryUsage: request.operations.length * 1024, // KB
      requiredPermissions: ['training:write', 'calendar:write']
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimatedDuration,
      resourceRequirements
    };
  };

  /**
   * Cancel batch operation
   */
  const cancelBatch = useCallback((requestId: string) => {
    setActiveJobs(prev => {
      const updated = new Map(prev);
      for (const [jobId, job] of updated) {
        if (job.requestId === requestId && job.status === 'processing') {
          updated.set(jobId, { ...job, status: 'failed' });
        }
      }
      return updated;
    });
  }, []);

  /**
   * Undo batch operation
   */
  const undoBatch = useCallback(async (requestId: string): Promise<void> => {
    const undoContext = undoContexts.get(requestId);
    if (!undoContext) {
      throw new Error('No undo context found for this batch operation');
    }

    if (undoContext.expiresAt < new Date()) {
      throw new Error('Undo context has expired');
    }

    // Create undo request
    const undoRequest: BatchRequest = {
      operations: undoContext.operations.map(op => ({
        id: generateJobId(),
        type: op.type,
        data: op.undoData
      })),
      options: {
        parallel: true,
        maxConcurrency: BATCH_CONFIG.MAX_CONCURRENCY,
        stopOnError: false,
        notifyOnComplete: true
      },
      metadata: {
        requestId: generateJobId(),
        userId: undoContext.requestId,
        timestamp: new Date(),
        source: 'undo',
        description: `Undo batch operation ${requestId}`
      }
    };

    await executeBatch(undoRequest);
    
    // Remove undo context after successful undo
    setUndoContexts(prev => {
      const updated = new Map(prev);
      updated.delete(requestId);
      return updated;
    });
  }, [executeBatch, undoContexts]);

  /**
   * Helper functions
   */
  const createUndoContext = (request: BatchRequest, response: BatchResponse): BatchUndoContext => {
    const undoOperations = response.results
      .filter(result => result.status === 'SUCCESS')
      .map(result => ({
        operationId: result.operationId,
        type: getUndoOperationType(request.operations.find(op => op.id === result.operationId)?.type),
        undoData: createUndoData(result),
        dependencies: []
      }));

    return {
      requestId: response.requestId,
      operations: undoOperations,
      expiresAt: new Date(Date.now() + BATCH_CONFIG.UNDO_EXPIRATION_HOURS * 60 * 60 * 1000)
    };
  };

  const getUndoOperationType = (originalType?: BatchOperationType): BatchOperationType => {
    switch (originalType) {
      case BatchOperationType.CREATE:
        return BatchOperationType.DELETE;
      case BatchOperationType.DELETE:
        return BatchOperationType.CREATE;
      case BatchOperationType.UPDATE:
        return BatchOperationType.UPDATE; // Restore previous values
      default:
        return BatchOperationType.UPDATE;
    }
  };

  const createUndoData = (result: any): any => {
    // Create appropriate undo data based on operation result
    return {
      workoutId: result.result?.id,
      originalData: result.result?.originalData
    };
  };

  const cleanupExpiredUndoContexts = () => {
    const now = new Date();
    setUndoContexts(prev => {
      const updated = new Map(prev);
      for (const [key, context] of updated) {
        if (context.expiresAt < now) {
          updated.delete(key);
        }
      }
      return updated;
    });
  };

  const invalidateQueries = async (operations: BatchOperation[]) => {
    const affectedKeys = ['workouts', 'sessions', 'assignments', 'templates'];
    await Promise.all(
      affectedKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
    );
  };

  const showCompletionNotification = (response: BatchResponse) => {
    const { summary } = response;
    if (summary.failed === 0) {
      toast.success(`Batch operation completed successfully. ${summary.successful} operations completed.`);
    } else if (summary.successful > 0) {
      toast.warning(`Batch operation partially completed. ${summary.successful} successful, ${summary.failed} failed.`);
    } else {
      toast.error(`Batch operation failed. ${summary.failed} operations failed.`);
    }
  };

  const generateJobId = (): string => {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workersRef.current.forEach(worker => worker.terminate());
    };
  }, []);

  return {
    executeBatch,
    validateBatch,
    cancelBatch,
    undoBatch,
    activeJobs: Array.from(activeJobs.values()),
    undoContexts: Array.from(undoContexts.values()),
    getJobProgress: (requestId: string) => {
      const job = Array.from(activeJobs.values()).find(j => j.requestId === requestId);
      return job?.progress;
    }
  };
};

/**
 * Specific batch operation hooks
 */

export const useBatchCreateWorkouts = () => {
  const { executeBatch } = useBatchOperations();

  return useCallback(async (workoutsData: CreateWorkoutData[], options?: Partial<BatchOptions>) => {
    const operations = workoutsData.map((data, index) => ({
      id: `create-${index}-${Date.now()}`,
      type: BatchOperationType.CREATE,
      data
    }));

    const request: BatchRequest<CreateWorkoutData> = {
      operations,
      options: {
        parallel: true,
        maxConcurrency: 5,
        medicalComplianceCheck: true,
        notifyOnComplete: true,
        ...options
      },
      metadata: {
        requestId: `batch-create-${Date.now()}`,
        userId: 'current-user',
        timestamp: new Date(),
        source: 'bulk-create',
        description: `Create ${workoutsData.length} workouts`
      }
    };

    return executeBatch(request);
  }, [executeBatch]);
};

export const useBatchUpdateAssignments = () => {
  const { executeBatch } = useBatchOperations();

  return useCallback(async (assignmentsData: AssignWorkoutData[], options?: Partial<BatchOptions>) => {
    const operations = assignmentsData.map((data, index) => ({
      id: `assign-${index}-${Date.now()}`,
      type: BatchOperationType.ASSIGN,
      data
    }));

    const request: BatchRequest<AssignWorkoutData> = {
      operations,
      options: {
        parallel: true,
        maxConcurrency: 10,
        medicalComplianceCheck: true,
        notifyOnComplete: true,
        ...options
      },
      metadata: {
        requestId: `batch-assign-${Date.now()}`,
        userId: 'current-user',
        timestamp: new Date(),
        source: 'bulk-assign'
      }
    };

    return executeBatch(request);
  }, [executeBatch]);
};

export const useBatchScheduleWorkouts = () => {
  const { executeBatch } = useBatchOperations();

  return useCallback(async (scheduleData: ScheduleData[], options?: Partial<BatchOptions>) => {
    const operations = scheduleData.map((data, index) => ({
      id: `schedule-${index}-${Date.now()}`,
      type: BatchOperationType.SCHEDULE,
      data
    }));

    const request: BatchRequest<ScheduleData> = {
      operations,
      options: {
        parallel: false, // Schedule sequentially to avoid conflicts
        conflictResolution: 'ADJUST_TIME',
        notifyOnComplete: true,
        ...options
      },
      metadata: {
        requestId: `batch-schedule-${Date.now()}`,
        userId: 'current-user',
        timestamp: new Date(),
        source: 'bulk-schedule'
      }
    };

    return executeBatch(request);
  }, [executeBatch]);
};

export const useBatchDelete = () => {
  const { executeBatch } = useBatchOperations();

  return useCallback(async (workoutIds: string[], permanent = false, options?: Partial<BatchOptions>) => {
    const operations = workoutIds.map((workoutId, index) => ({
      id: `delete-${index}-${Date.now()}`,
      type: BatchOperationType.DELETE,
      data: { workoutId, permanent }
    }));

    const request: BatchRequest<DeleteWorkoutData> = {
      operations,
      options: {
        parallel: true,
        maxConcurrency: 5,
        rollbackOnError: !permanent,
        notifyOnComplete: true,
        ...options
      },
      metadata: {
        requestId: `batch-delete-${Date.now()}`,
        userId: 'current-user',
        timestamp: new Date(),
        source: 'bulk-delete'
      }
    };

    return executeBatch(request);
  }, [executeBatch]);
};

export const useBatchDuplicate = () => {
  const { executeBatch } = useBatchOperations();

  return useCallback(async (duplicateData: DuplicateWorkoutData[], options?: Partial<BatchOptions>) => {
    const operations = duplicateData.map((data, index) => ({
      id: `duplicate-${index}-${Date.now()}`,
      type: BatchOperationType.DUPLICATE,
      data
    }));

    const request: BatchRequest<DuplicateWorkoutData> = {
      operations,
      options: {
        parallel: true,
        maxConcurrency: 3,
        notifyOnComplete: true,
        ...options
      },
      metadata: {
        requestId: `batch-duplicate-${Date.now()}`,
        userId: 'current-user',
        timestamp: new Date(),
        source: 'bulk-duplicate'
      }
    };

    return executeBatch(request);
  }, [executeBatch]);
};