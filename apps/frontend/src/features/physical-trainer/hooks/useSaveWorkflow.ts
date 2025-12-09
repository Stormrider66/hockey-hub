import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useCreateWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useCheckWorkoutConflictsMutation,
  useCreateBulkWorkoutAssignmentMutation,
  type CreateWorkoutRequest
} from '@/store/api/trainingApi';
import { useWorkoutValidation } from './useWorkoutValidation';
import { usePlayerAssignment } from './usePlayerAssignment';
import { useMedicalCompliance } from './useMedicalCompliance';
import { useOfflineMode } from './useOfflineMode';
import { WorkoutType } from '../types/session.types';
import { toast } from 'react-hot-toast';

// Save workflow steps
export enum SaveStep {
  VALIDATE_CONTENT = 1,
  VALIDATE_ASSIGNMENTS = 2,
  CHECK_MEDICAL = 3,
  SAVE_DATA = 4
}

// Step status types
export type StepStatus = 'pending' | 'processing' | 'success' | 'error' | 'warning';

// Individual step result
export interface StepResult {
  step: SaveStep;
  status: StepStatus;
  message?: string;
  errors?: string[];
  warnings?: string[];
}

// Save result
export interface SaveResult {
  success: boolean;
  workoutId?: string;
  conflictResolution?: 'skip' | 'override' | 'merge';
  createdCount?: number;
  errors?: Array<{ playerId?: string; error: string }>;
  assignments?: any[];
}

// Save error
export interface SaveError {
  step: SaveStep;
  message: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

// Success modal props
export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SaveResult;
  workoutType: WorkoutType;
  title?: string;
  onSchedule?: () => void;
  onViewDetails?: () => void;
}

// Hook params
export interface UseSaveWorkflowParams {
  workoutType: WorkoutType;
  workoutData: any;
  playerAssignments: {
    players: string[];
    teams: string[];
  };
  workoutId?: string; // For updates
  onSaveSuccess?: (result: SaveResult) => void;
  onSaveError?: (error: SaveError) => void;
  showSuccessModal?: boolean;
  autoSchedule?: boolean;
  conflictResolution?: 'skip' | 'override' | 'merge';
  scheduleDates?: string[]; // For bulk assignment
}

// Hook return type
export interface UseSaveWorkflowReturn {
  // State
  currentStep: SaveStep | null;
  isValidating: boolean;
  isSaving: boolean;
  progress: number;
  errors: SaveError[];
  stepResults: StepResult[];
  
  // Actions
  save: () => Promise<SaveResult | null>;
  validateStep: (step: SaveStep) => Promise<StepResult>;
  retry: () => Promise<SaveResult | null>;
  reset: () => void;
  
  // Status
  canProceed: boolean;
  getStepStatus: (step: SaveStep) => StepStatus;
  getErrorSummary: () => string;
  hasWarnings: boolean;
  hasErrors: boolean;
  
  // Modal
  successModalProps: SuccessModalProps | null;
  isSuccessModalOpen: boolean;
  closeSuccessModal: () => void;
}

export function useSaveWorkflow({
  workoutType,
  workoutData,
  playerAssignments = { players: [], teams: [] },
  workoutId,
  onSaveSuccess,
  onSaveError,
  showSuccessModal = true,
  autoSchedule = false,
  conflictResolution = 'skip',
  scheduleDates = []
}: UseSaveWorkflowParams): UseSaveWorkflowReturn {
  const { t } = useTranslation(['physicalTrainer']);
  
  // State
  const [currentStep, setCurrentStep] = useState<SaveStep | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<SaveError[]>([]);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [successResult, setSuccessResult] = useState<SaveResult | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Refs to track retries
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Offline mode support
  const { isOnline, addToQueue, getQueuedItem } = useOfflineMode();
  
  // API mutations
  const [createWorkout] = useCreateWorkoutSessionMutation();
  const [updateWorkout] = useUpdateWorkoutSessionMutation();
  const [checkConflicts] = useCheckWorkoutConflictsMutation();
  const [bulkAssign] = useCreateBulkWorkoutAssignmentMutation();
  
  // Validation hooks
  const workoutValidation = useWorkoutValidation({
    workoutType,
    workoutData,
    validateOnMount: false
  });
  
  const assignmentValidation = usePlayerAssignment({
    initialPlayers: playerAssignments?.players || [],
    initialTeams: playerAssignments?.teams || [],
    requireAssignment: true,
    enableMedicalChecks: false, // We check medical separately
    workoutType,
    exercises: workoutData.exercises || []
  });
  
  const medicalCompliance = useMedicalCompliance({
    playerIds: assignmentValidation.affectedPlayers.map(p => p.id),
    workoutType,
    workoutContent: workoutData,
    enableRealTimeChecks: true
  });
  
  // Calculate progress
  const progress = useMemo(() => {
    if (!currentStep) return 0;
    return (currentStep / 4) * 100;
  }, [currentStep]);
  
  // Get step status
  const getStepStatus = useCallback((step: SaveStep): StepStatus => {
    const result = stepResults.find(r => r.step === step);
    if (!result) return 'pending';
    return result.status;
  }, [stepResults]);
  
  // Update step result
  const updateStepResult = useCallback((result: StepResult) => {
    setStepResults(prev => {
      const filtered = prev.filter(r => r.step !== result.step);
      return [...filtered, result].sort((a, b) => a.step - b.step);
    });
  }, []);
  
  // Step 1: Validate workout content
  const validateContent = useCallback(async (): Promise<StepResult> => {
    setCurrentStep(SaveStep.VALIDATE_CONTENT);
    updateStepResult({ step: SaveStep.VALIDATE_CONTENT, status: 'processing' });
    
    try {
      const validation = await workoutValidation.validate();
      
      if (!validation.isValid) {
        const result: StepResult = {
          step: SaveStep.VALIDATE_CONTENT,
          status: 'error',
          message: t('save.validation.contentError'),
          errors: validation.errors.map(e => e.message)
        };
        updateStepResult(result);
        return result;
      }
      
      if (validation.warnings.length > 0) {
        const result: StepResult = {
          step: SaveStep.VALIDATE_CONTENT,
          status: 'warning',
          message: t('save.validation.contentWarning'),
          warnings: validation.warnings.map(w => w.message)
        };
        updateStepResult(result);
        return result;
      }
      
      const result: StepResult = {
        step: SaveStep.VALIDATE_CONTENT,
        status: 'success',
        message: t('save.validation.contentSuccess')
      };
      updateStepResult(result);
      return result;
    } catch (error) {
      const result: StepResult = {
        step: SaveStep.VALIDATE_CONTENT,
        status: 'error',
        message: t('save.validation.contentUnknownError'),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      updateStepResult(result);
      return result;
    }
  }, [workoutValidation, updateStepResult, t]);
  
  // Step 2: Validate player assignments
  const validateAssignments = useCallback(async (): Promise<StepResult> => {
    setCurrentStep(SaveStep.VALIDATE_ASSIGNMENTS);
    updateStepResult({ step: SaveStep.VALIDATE_ASSIGNMENTS, status: 'processing' });
    
    try {
      if (!assignmentValidation.isValid) {
        const result: StepResult = {
          step: SaveStep.VALIDATE_ASSIGNMENTS,
          status: 'error',
          message: t('save.validation.assignmentError'),
          errors: assignmentValidation.errors.map(e => e.message)
        };
        updateStepResult(result);
        return result;
      }
      
      // Check for scheduling conflicts if dates provided
      if (scheduleDates.length > 0 && !workoutId) {
        const conflictCheck = await checkConflicts({
          playerIds: assignmentValidation.affectedPlayers.map(p => p.id),
          scheduleDates
        }).unwrap();
        
        if (conflictCheck.data?.conflicts && conflictCheck.data.conflicts.length > 0) {
          const result: StepResult = {
            step: SaveStep.VALIDATE_ASSIGNMENTS,
            status: 'warning',
            message: t('save.validation.schedulingConflicts'),
            warnings: conflictCheck.data.conflicts.map(c => 
              `${c.playerId} on ${c.date}: ${c.type} conflict`
            )
          };
          updateStepResult(result);
          return result;
        }
      }
      
      if (assignmentValidation.warnings.length > 0) {
        const result: StepResult = {
          step: SaveStep.VALIDATE_ASSIGNMENTS,
          status: 'warning',
          message: t('save.validation.assignmentWarning'),
          warnings: assignmentValidation.warnings.map(w => w.message)
        };
        updateStepResult(result);
        return result;
      }
      
      const result: StepResult = {
        step: SaveStep.VALIDATE_ASSIGNMENTS,
        status: 'success',
        message: t('save.validation.assignmentSuccess', {
          count: assignmentValidation.totalAffectedPlayers
        })
      };
      updateStepResult(result);
      return result;
    } catch (error) {
      const result: StepResult = {
        step: SaveStep.VALIDATE_ASSIGNMENTS,
        status: 'error',
        message: t('save.validation.assignmentUnknownError'),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      updateStepResult(result);
      return result;
    }
  }, [assignmentValidation, checkConflicts, scheduleDates, workoutId, updateStepResult, t]);
  
  // Step 3: Check medical compliance
  const checkMedical = useCallback(async (): Promise<StepResult> => {
    setCurrentStep(SaveStep.CHECK_MEDICAL);
    updateStepResult({ step: SaveStep.CHECK_MEDICAL, status: 'processing' });
    
    try {
      const complianceResults = await medicalCompliance.validateWorkout();
      
      const hasViolations = complianceResults.some(r => !r.isCompliant);
      const hasWarnings = complianceResults.some(r => r.warnings.length > 0);
      
      if (hasViolations) {
        const violations = complianceResults
          .filter(r => !r.isCompliant)
          .flatMap(r => r.violations);
          
        const result: StepResult = {
          step: SaveStep.CHECK_MEDICAL,
          status: 'error',
          message: t('save.validation.medicalViolations'),
          errors: violations
        };
        updateStepResult(result);
        return result;
      }
      
      if (hasWarnings) {
        const warnings = complianceResults
          .flatMap(r => r.warnings);
          
        const result: StepResult = {
          step: SaveStep.CHECK_MEDICAL,
          status: 'warning',
          message: t('save.validation.medicalWarnings'),
          warnings
        };
        updateStepResult(result);
        return result;
      }
      
      const result: StepResult = {
        step: SaveStep.CHECK_MEDICAL,
        status: 'success',
        message: t('save.validation.medicalSuccess')
      };
      updateStepResult(result);
      return result;
    } catch (error) {
      const result: StepResult = {
        step: SaveStep.CHECK_MEDICAL,
        status: 'error',
        message: t('save.validation.medicalUnknownError'),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      updateStepResult(result);
      return result;
    }
  }, [medicalCompliance, updateStepResult, t]);
  
  // Step 4: Save workout data
  const saveData = useCallback(async (): Promise<StepResult> => {
    setCurrentStep(SaveStep.SAVE_DATA);
    updateStepResult({ step: SaveStep.SAVE_DATA, status: 'processing' });
    
    try {
      // Prepare workout request
      const workoutRequest: CreateWorkoutRequest = {
        title: workoutData.name || workoutData.title,
        description: workoutData.description,
        type: workoutType as any,
        scheduledDate: workoutData.date || new Date().toISOString(),
        location: workoutData.location || 'Training Center',
        teamId: assignmentValidation.selectedTeams[0] || 'default-team',
        playerIds: assignmentValidation.affectedPlayers.map(p => p.id),
        estimatedDuration: workoutData.duration || 60,
        exercises: workoutData.exercises,
        intervalProgram: workoutData.intervalProgram,
        hybridProgram: workoutData.hybridProgram,
        agilityProgram: workoutData.agilityProgram,
        settings: workoutData.settings
      };
      
      // Check if offline - queue the operation instead of making API call
      if (!isOnline) {
        const action = workoutId ? 'update' : 'create';
        const dataWithId = workoutId ? 
          { ...workoutRequest, id: workoutId } : 
          { ...workoutRequest, id: `temp_${Date.now()}` };
        
        addToQueue({
          type: 'workout',
          action,
          data: dataWithId,
          maxRetries: 3
        });
        
        const result: StepResult = {
          step: SaveStep.SAVE_DATA,
          status: 'success',
          message: t('save.success.offlineQueued')
        };
        updateStepResult(result);
        
        const saveResult: SaveResult = {
          success: true,
          workoutId: dataWithId.id
        };
        setSuccessResult(saveResult);
        return result;
      }
      
      let saveResult: SaveResult;
      
      if (workoutId) {
        // Update existing workout
        const response = await updateWorkout({
          id: workoutId,
          data: workoutRequest
        }).unwrap();
        
        saveResult = {
          success: true,
          workoutId: workoutId
        };
      } else if (scheduleDates.length > 1 && !workoutId) {
        // Bulk assignment for multiple dates
        const bulkResponse = await bulkAssign({
          workout: workoutRequest,
          playerIds: assignmentValidation.affectedPlayers.map(p => p.id),
          scheduleDates,
          conflictResolution
        }).unwrap();
        
        saveResult = {
          success: true,
          createdCount: bulkResponse.data?.created,
          errors: bulkResponse.data?.errors,
          assignments: bulkResponse.data?.assignments
        };
      } else {
        // Create new single workout
        const response = await createWorkout(workoutRequest).unwrap();
        
        saveResult = {
          success: true,
          workoutId: response.data?.id
        };
      }
      
      const result: StepResult = {
        step: SaveStep.SAVE_DATA,
        status: 'success',
        message: t('save.success.message')
      };
      updateStepResult(result);
      
      setSuccessResult(saveResult);
      return result;
    } catch (error: any) {
      const isNetworkError = error.status === 'FETCH_ERROR' || !navigator.onLine;
      
      // If it's a network error and we have offline capability, queue it
      if (isNetworkError) {
        const action = workoutId ? 'update' : 'create';
        const dataWithId = workoutId ? 
          { ...workoutRequest, id: workoutId } : 
          { ...workoutRequest, id: `temp_${Date.now()}` };
        
        addToQueue({
          type: 'workout',
          action,
          data: dataWithId,
          maxRetries: 3
        });
        
        const result: StepResult = {
          step: SaveStep.SAVE_DATA,
          status: 'success',
          message: t('save.success.offlineQueued')
        };
        updateStepResult(result);
        
        const saveResult: SaveResult = {
          success: true,
          workoutId: dataWithId.id
        };
        setSuccessResult(saveResult);
        return result;
      }
      
      const result: StepResult = {
        step: SaveStep.SAVE_DATA,
        status: 'error',
        message: t('save.errors.saveError'),
        errors: [error.data?.message || error.message || 'Unknown error']
      };
      updateStepResult(result);
      
      // Create save error
      const saveError: SaveError = {
        step: SaveStep.SAVE_DATA,
        message: result.message || '',
        code: error.status,
        details: error.data,
        retryable: isNetworkError
      };
      setErrors(prev => [...prev, saveError]);
      
      return result;
    }
  }, [
    workoutType,
    workoutData,
    workoutId,
    assignmentValidation,
    scheduleDates,
    conflictResolution,
    createWorkout,
    updateWorkout,
    bulkAssign,
    updateStepResult,
    isOnline,
    addToQueue,
    t
  ]);
  
  // Validate a specific step
  const validateStep = useCallback(async (step: SaveStep): Promise<StepResult> => {
    switch (step) {
      case SaveStep.VALIDATE_CONTENT:
        return validateContent();
      case SaveStep.VALIDATE_ASSIGNMENTS:
        return validateAssignments();
      case SaveStep.CHECK_MEDICAL:
        return checkMedical();
      case SaveStep.SAVE_DATA:
        return saveData();
      default:
        throw new Error(`Invalid step: ${step}`);
    }
  }, [validateContent, validateAssignments, checkMedical, saveData]);
  
  // Main save function
  const save = useCallback(async (): Promise<SaveResult | null> => {
    setIsValidating(true);
    setIsSaving(true);
    setErrors([]);
    retryCountRef.current = 0;
    
    try {
      // Execute all steps in sequence
      for (const step of [
        SaveStep.VALIDATE_CONTENT,
        SaveStep.VALIDATE_ASSIGNMENTS,
        SaveStep.CHECK_MEDICAL,
        SaveStep.SAVE_DATA
      ]) {
        const result = await validateStep(step);
        
        // Stop on error (warnings are OK to proceed)
        if (result.status === 'error') {
          const error: SaveError = {
            step,
            message: result.message || 'Validation failed',
            details: result.errors
          };
          
          if (onSaveError) {
            onSaveError(error);
          }
          
          toast.error(result.message || 'Validation failed');
          return null;
        }
      }
      
      // All steps completed successfully
      if (successResult) {
        if (onSaveSuccess) {
          onSaveSuccess(successResult);
        }
        
        if (showSuccessModal) {
          setIsSuccessModalOpen(true);
        }
        
        toast.success(t('save.success.message'));
        return successResult;
      }
      
      return null;
    } finally {
      setIsValidating(false);
      setIsSaving(false);
      setCurrentStep(null);
    }
  }, [validateStep, onSaveError, onSaveSuccess, showSuccessModal, successResult, t]);
  
  // Retry function
  const retry = useCallback(async (): Promise<SaveResult | null> => {
    if (retryCountRef.current >= maxRetries) {
      toast.error(t('save.errors.maxRetriesReached'));
      return null;
    }
    
    retryCountRef.current += 1;
    
    // Find the last failed step
    const failedStep = stepResults
      .filter(r => r.status === 'error')
      .sort((a, b) => b.step - a.step)[0];
      
    if (!failedStep) {
      // No failed step, run full save
      return save();
    }
    
    // Retry from the failed step onwards
    setIsValidating(true);
    setIsSaving(true);
    
    try {
      for (let step = failedStep.step; step <= SaveStep.SAVE_DATA; step++) {
        const result = await validateStep(step);
        
        if (result.status === 'error') {
          toast.error(result.message || 'Retry failed');
          return null;
        }
      }
      
      if (successResult) {
        if (onSaveSuccess) {
          onSaveSuccess(successResult);
        }
        
        if (showSuccessModal) {
          setIsSuccessModalOpen(true);
        }
        
        toast.success(t('save.success.message'));
        return successResult;
      }
      
      return null;
    } finally {
      setIsValidating(false);
      setIsSaving(false);
      setCurrentStep(null);
    }
  }, [stepResults, save, validateStep, onSaveSuccess, showSuccessModal, successResult, t]);
  
  // Reset function
  const reset = useCallback(() => {
    setCurrentStep(null);
    setIsValidating(false);
    setIsSaving(false);
    setErrors([]);
    setStepResults([]);
    setSuccessResult(null);
    setIsSuccessModalOpen(false);
    retryCountRef.current = 0;
  }, []);
  
  // Get error summary
  const getErrorSummary = useCallback((): string => {
    const allErrors = stepResults
      .filter(r => r.status === 'error')
      .flatMap(r => r.errors || []);
      
    if (allErrors.length === 0) return '';
    if (allErrors.length === 1) return allErrors[0];
    
    return t('save.errors.multipleErrors', { count: allErrors.length });
  }, [stepResults, t]);
  
  // Status flags
  const hasErrors = stepResults.some(r => r.status === 'error');
  const hasWarnings = stepResults.some(r => r.status === 'warning');
  const canProceed = !hasErrors && !isValidating && !isSaving;
  
  // Success modal props
  const successModalProps: SuccessModalProps | null = successResult && isSuccessModalOpen ? {
    isOpen: isSuccessModalOpen,
    onClose: () => setIsSuccessModalOpen(false),
    result: successResult,
    workoutType,
    title: workoutData.name || workoutData.title,
    onSchedule: autoSchedule ? () => {
      // Navigate to calendar or scheduling view
      window.location.href = '/trainer/calendar';
    } : undefined,
    onViewDetails: successResult.workoutId ? () => {
      // Navigate to workout details
      window.location.href = `/trainer/workouts/${successResult.workoutId}`;
    } : undefined
  } : null;
  
  return {
    // State
    currentStep,
    isValidating,
    isSaving,
    progress,
    errors,
    stepResults,
    
    // Actions
    save,
    validateStep,
    retry,
    reset,
    
    // Status
    canProceed,
    getStepStatus,
    getErrorSummary,
    hasWarnings,
    hasErrors,
    
    // Modal
    successModalProps,
    isSuccessModalOpen,
    closeSuccessModal: () => setIsSuccessModalOpen(false)
  };
}