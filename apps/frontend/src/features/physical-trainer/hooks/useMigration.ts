import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  batchMigrateWorkouts,
  rollbackMigration,
  detectWorkoutFormat,
  validateWorkoutData,
  MigrationResult,
  BatchMigrationOptions,
  BatchMigrationProgress,
  BatchMigrationResult,
  MigrationError,
  MigrationWarning
} from '../utils/dataMigration';
import { UnifiedWorkoutSession } from '../types/unified';

export interface MigrationState {
  isRunning: boolean;
  isPaused: boolean;
  progress: BatchMigrationProgress | null;
  results: MigrationResult<UnifiedWorkoutSession>[] | null;
  error: string | null;
  warnings: MigrationWarning[];
  currentOperation: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface MigrationAnalysis {
  totalWorkouts: number;
  byFormat: Record<string, number>;
  migrationNeeded: number;
  alreadyMigrated: number;
  invalidData: number;
  estimatedDuration: number;
  potentialIssues: string[];
}

export interface RollbackState {
  isRollingBack: boolean;
  rollbackProgress: number;
  rollbackErrors: MigrationError[];
  originalFormat: string | null;
}

export interface MigrationHookReturn {
  // State
  state: MigrationState;
  analysis: MigrationAnalysis | null;
  rollbackState: RollbackState;
  
  // Actions
  analyzeData: (workouts: any[]) => Promise<MigrationAnalysis>;
  startMigration: (workouts: any[], options: BatchMigrationOptions) => Promise<void>;
  pauseMigration: () => void;
  resumeMigration: () => void;
  cancelMigration: () => void;
  rollback: (workouts: UnifiedWorkoutSession[], targetFormat: string) => Promise<void>;
  
  // Utilities
  validateWorkout: (workout: any) => { isValid: boolean; errors: MigrationError[] };
  getProgressSummary: () => MigrationProgressSummary | null;
  exportResults: () => MigrationReport;
  clearResults: () => void;
}

export interface MigrationProgressSummary {
  percentage: number;
  processedCount: number;
  remainingCount: number;
  successRate: number;
  errorRate: number;
  warningRate: number;
  estimatedTimeRemaining: string;
  averageTimePerItem: number;
}

export interface MigrationReport {
  summary: {
    startTime: Date;
    endTime: Date;
    duration: number;
    totalProcessed: number;
    successful: number;
    failed: number;
    warnings: number;
  };
  formatBreakdown: Record<string, number>;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  performanceMetrics: {
    averageTimePerItem: number;
    peakMemoryUsage: number;
    throughput: number;
  };
}

const MIGRATION_STORAGE_KEY = 'physical-trainer-migration-state';
const MIGRATION_RESULTS_KEY = 'physical-trainer-migration-results';

export function useMigration(): MigrationHookReturn {
  const [state, setState] = useState<MigrationState>({
    isRunning: false,
    isPaused: false,
    progress: null,
    results: null,
    error: null,
    warnings: [],
    currentOperation: null,
    startTime: null,
    endTime: null
  });

  const [analysis, setAnalysis] = useState<MigrationAnalysis | null>(null);
  const [rollbackState, setRollbackState] = useState<RollbackState>({
    isRollingBack: false,
    rollbackProgress: 0,
    rollbackErrors: [],
    originalFormat: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const migrationPromiseRef = useRef<Promise<void> | null>(null);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(MIGRATION_STORAGE_KEY);
    const savedResults = localStorage.getItem(MIGRATION_RESULTS_KEY);
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          ...parsed,
          startTime: parsed.startTime ? new Date(parsed.startTime) : null,
          endTime: parsed.endTime ? new Date(parsed.endTime) : null,
          isRunning: false, // Never restore running state
          isPaused: false
        }));
      } catch (error) {
        console.warn('Failed to restore migration state:', error);
      }
    }

    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        setState(prev => ({ ...prev, results: parsed }));
      } catch (error) {
        console.warn('Failed to restore migration results:', error);
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<MigrationState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      
      // Save to localStorage (excluding results to prevent bloat)
      const stateToSave = {
        ...updated,
        results: null // Save results separately
      };
      localStorage.setItem(MIGRATION_STORAGE_KEY, JSON.stringify(stateToSave));
      
      return updated;
    });
  }, []);

  // Save results separately
  const saveResults = useCallback((results: MigrationResult<UnifiedWorkoutSession>[]) => {
    localStorage.setItem(MIGRATION_RESULTS_KEY, JSON.stringify(results));
  }, []);

  const analyzeData = useCallback(async (workouts: any[]): Promise<MigrationAnalysis> => {
    setState(prev => ({ ...prev, currentOperation: 'Analyzing data...' }));

    const formatCounts: Record<string, number> = {};
    let migrationNeeded = 0;
    let alreadyMigrated = 0;
    let invalidData = 0;
    const potentialIssues: string[] = [];

    // Analyze each workout
    workouts.forEach((workout, index) => {
      try {
        const format = detectWorkoutFormat(workout);
        formatCounts[format] = (formatCounts[format] || 0) + 1;

        if (format === 'unified') {
          alreadyMigrated++;
        } else if (format === 'unknown') {
          invalidData++;
          potentialIssues.push(`Workout ${index + 1}: Unknown format`);
        } else {
          migrationNeeded++;
          
          // Quick validation
          const validation = validateWorkoutData(workout, format);
          if (!validation.isValid) {
            potentialIssues.push(
              `Workout ${index + 1} (${format}): ${validation.errors.map(e => e.message).join(', ')}`
            );
          }
        }
      } catch (error) {
        invalidData++;
        potentialIssues.push(`Workout ${index + 1}: Analysis failed - ${error.message}`);
      }
    });

    // Estimate duration (rough calculation)
    const avgTimePerWorkout = 50; // ms
    const estimatedDuration = workouts.length * avgTimePerWorkout;

    const analysisResult: MigrationAnalysis = {
      totalWorkouts: workouts.length,
      byFormat: formatCounts,
      migrationNeeded,
      alreadyMigrated,
      invalidData,
      estimatedDuration,
      potentialIssues: potentialIssues.slice(0, 20) // Limit to first 20 issues
    };

    setAnalysis(analysisResult);
    setState(prev => ({ ...prev, currentOperation: null }));

    return analysisResult;
  }, []);

  const startMigration = useCallback(async (
    workouts: any[],
    options: BatchMigrationOptions
  ): Promise<void> => {
    if (state.isRunning) {
      throw new Error('Migration already running');
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    const startTime = new Date();
    saveState({
      isRunning: true,
      isPaused: false,
      error: null,
      warnings: [],
      results: null,
      startTime,
      endTime: null,
      currentOperation: 'Starting migration...'
    });

    try {
      const migrationPromise = batchMigrateWorkouts(
        workouts,
        options,
        (progress: BatchMigrationProgress) => {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Migration cancelled');
          }

          saveState({
            progress,
            currentOperation: `Processing batch ${progress.currentBatch}...`
          });
        }
      );

      migrationPromiseRef.current = migrationPromise as any;
      const result: BatchMigrationResult = await migrationPromise;

      const endTime = new Date();
      const allWarnings = result.results.flatMap(r => r.warnings);

      saveState({
        isRunning: false,
        progress: {
          ...result.summary,
          currentBatch: Math.ceil(result.summary.total / options.batchSize),
          estimatedTimeRemaining: 0
        } as any,
        results: result.results,
        warnings: allWarnings,
        endTime,
        currentOperation: null
      });

      saveResults(result.results);

    } catch (error) {
      const endTime = new Date();
      saveState({
        isRunning: false,
        isPaused: false,
        error: error.message,
        endTime,
        currentOperation: null
      });
    } finally {
      abortControllerRef.current = null;
      migrationPromiseRef.current = null;
    }
  }, [state.isRunning, saveState, saveResults]);

  const pauseMigration = useCallback(() => {
    if (state.isRunning && !state.isPaused) {
      saveState({ 
        isPaused: true,
        currentOperation: 'Migration paused...'
      });
    }
  }, [state.isRunning, state.isPaused, saveState]);

  const resumeMigration = useCallback(() => {
    if (state.isRunning && state.isPaused) {
      saveState({ 
        isPaused: false,
        currentOperation: 'Resuming migration...'
      });
    }
  }, [state.isRunning, state.isPaused, saveState]);

  const cancelMigration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    saveState({
      isRunning: false,
      isPaused: false,
      currentOperation: 'Migration cancelled',
      endTime: new Date()
    });

    // Clear the promise reference
    migrationPromiseRef.current = null;
  }, [saveState]);

  const rollback = useCallback(async (
    workouts: UnifiedWorkoutSession[],
    targetFormat: string
  ): Promise<void> => {
    setRollbackState({
      isRollingBack: true,
      rollbackProgress: 0,
      rollbackErrors: [],
      originalFormat: 'unified'
    });

    try {
      const rollbackResults: any[] = [];
      const errors: MigrationError[] = [];

      for (let i = 0; i < workouts.length; i++) {
        const workout = workouts[i];
        
        try {
          const result = rollbackMigration(workout, targetFormat as any);
          
          if (result.success) {
            rollbackResults.push(result.data);
          } else {
            errors.push(...result.errors);
          }
        } catch (error) {
          errors.push({
            field: 'general',
            message: `Rollback failed for workout ${workout.id}: ${error.message}`,
            code: 'ROLLBACK_ERROR'
          });
        }

        // Update progress
        const progress = Math.round(((i + 1) / workouts.length) * 100);
        setRollbackState(prev => ({
          ...prev,
          rollbackProgress: progress,
          rollbackErrors: errors
        }));

        // Small delay to prevent UI blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Complete rollback
      setRollbackState({
        isRollingBack: false,
        rollbackProgress: 100,
        rollbackErrors: errors,
        originalFormat: 'unified'
      });

    } catch (error) {
      setRollbackState(prev => ({
        ...prev,
        isRollingBack: false,
        rollbackErrors: [
          ...prev.rollbackErrors,
          {
            field: 'general',
            message: `Rollback operation failed: ${error.message}`,
            code: 'ROLLBACK_OPERATION_ERROR'
          }
        ]
      }));
    }
  }, []);

  const validateWorkout = useCallback((workout: any) => {
    const format = detectWorkoutFormat(workout);
    
    if (format === 'unknown') {
      return {
        isValid: false,
        errors: [{
          field: 'format',
          message: 'Unknown workout format',
          code: 'UNKNOWN_FORMAT'
        }]
      };
    }

    const validation = validateWorkoutData(workout, format);
    return {
      isValid: validation.isValid,
      errors: validation.errors.map(e => ({
        field: e.field,
        message: e.message,
        code: 'VALIDATION_ERROR'
      }))
    };
  }, []);

  const getProgressSummary = useCallback((): MigrationProgressSummary | null => {
    if (!state.progress) return null;

    const { progress } = state;
    const percentage = Math.round((progress.processed / progress.total) * 100);
    const successRate = progress.processed > 0 ? 
      Math.round((progress.successful / progress.processed) * 100) : 0;
    const errorRate = progress.processed > 0 ? 
      Math.round((progress.failed / progress.processed) * 100) : 0;
    const warningRate = progress.processed > 0 ? 
      Math.round((progress.warnings / progress.processed) * 100) : 0;

    // Format estimated time remaining
    const minutes = Math.floor(progress.estimatedTimeRemaining / 60000);
    const seconds = Math.floor((progress.estimatedTimeRemaining % 60000) / 1000);
    const estimatedTimeRemaining = `${minutes}m ${seconds}s`;

    const averageTimePerItem = state.startTime ? 
      (Date.now() - state.startTime.getTime()) / progress.processed : 0;

    return {
      percentage,
      processedCount: progress.processed,
      remainingCount: progress.total - progress.processed,
      successRate,
      errorRate,
      warningRate,
      estimatedTimeRemaining,
      averageTimePerItem
    };
  }, [state.progress, state.startTime]);

  const exportResults = useCallback((): MigrationReport => {
    const duration = state.startTime && state.endTime ? 
      state.endTime.getTime() - state.startTime.getTime() : 0;

    const formatBreakdown: Record<string, number> = {};
    const allErrors: MigrationError[] = [];
    const allWarnings: MigrationWarning[] = [];

    if (state.results) {
      state.results.forEach(result => {
        const format = result.metadata.sourceType;
        formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      });
    }

    const totalProcessed = state.results?.length || 0;
    const successful = state.results?.filter(r => r.success).length || 0;
    const failed = state.results?.filter(r => !r.success).length || 0;

    return {
      summary: {
        startTime: state.startTime || new Date(),
        endTime: state.endTime || new Date(),
        duration,
        totalProcessed,
        successful,
        failed,
        warnings: allWarnings.length
      },
      formatBreakdown,
      errors: allErrors,
      warnings: allWarnings,
      performanceMetrics: {
        averageTimePerItem: totalProcessed > 0 ? duration / totalProcessed : 0,
        peakMemoryUsage: 0, // Would need additional tracking
        throughput: duration > 0 ? (totalProcessed / duration) * 1000 : 0 // items per second
      }
    };
  }, [state]);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: null,
      warnings: [],
      error: null,
      progress: null,
      startTime: null,
      endTime: null
    }));
    
    localStorage.removeItem(MIGRATION_STORAGE_KEY);
    localStorage.removeItem(MIGRATION_RESULTS_KEY);
  }, []);

  return {
    state,
    analysis,
    rollbackState,
    analyzeData,
    startMigration,
    pauseMigration,
    resumeMigration,
    cancelMigration,
    rollback,
    validateWorkout,
    getProgressSummary,
    exportResults,
    clearResults
  };
}

// Additional utility hooks
export function useMigrationValidation() {
  const [validationCache, setValidationCache] = useState<Map<string, any>>(new Map());

  const validateWorkouts = useCallback(async (workouts: any[]) => {
    const results = new Map();
    
    for (const workout of workouts) {
      const workoutId = workout.id || JSON.stringify(workout).substring(0, 100);
      
      if (validationCache.has(workoutId)) {
        results.set(workoutId, validationCache.get(workoutId));
        continue;
      }

      const format = detectWorkoutFormat(workout);
      const validation = validateWorkoutData(workout, format);
      
      const result = {
        format,
        isValid: validation.isValid,
        errors: validation.errors,
        workout
      };
      
      results.set(workoutId, result);
      setValidationCache(prev => new Map([...prev, [workoutId, result]]));
    }

    return results;
  }, [validationCache]);

  const clearCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  return {
    validateWorkouts,
    clearCache,
    cacheSize: validationCache.size
  };
}

export function useMigrationPerformance() {
  const [performanceData, setPerformanceData] = useState({
    memoryUsage: 0,
    throughput: 0,
    averageTimePerItem: 0,
    peakConcurrency: 0
  });

  const startMonitoring = useCallback(() => {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let peakMemory = 0;

    const interval = setInterval(() => {
      // Monitor memory usage (if available)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        peakMemory = Math.max(peakMemory, memInfo.usedJSHeapSize);
      }

      const elapsed = Date.now() - startTime;
      const throughput = itemsProcessed / (elapsed / 1000); // items per second

      setPerformanceData(prev => ({
        ...prev,
        memoryUsage: peakMemory,
        throughput,
        averageTimePerItem: itemsProcessed > 0 ? elapsed / itemsProcessed : 0
      }));
    }, 1000);

    return {
      recordItem: () => itemsProcessed++,
      stop: () => clearInterval(interval)
    };
  }, []);

  return {
    performanceData,
    startMonitoring
  };
}

// Error boundary hook for migration errors
export function useMigrationErrorHandler() {
  const [errors, setErrors] = useState<MigrationError[]>([]);

  const handleError = useCallback((error: MigrationError) => {
    setErrors(prev => [...prev, error]);
    
    // Log to console for debugging
    console.error('Migration Error:', error);
    
    // Could also send to error reporting service
    // errorReportingService.captureException(error);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getErrorsByType = useCallback(() => {
    const byType: Record<string, MigrationError[]> = {};
    errors.forEach(error => {
      if (!byType[error.code]) {
        byType[error.code] = [];
      }
      byType[error.code].push(error);
    });
    return byType;
  }, [errors]);

  return {
    errors,
    handleError,
    clearErrors,
    getErrorsByType,
    hasErrors: errors.length > 0
  };
}