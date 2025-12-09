import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  WorkoutSession,
  WorkoutType,
  WorkoutSessionFormData
} from '../types/session.types';
import {
  validateWorkoutSession,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../utils/workoutValidation';
import { Player, Team } from '../types';

// Hook configuration interface
export interface UseWorkoutBuilderConfig {
  workoutType: WorkoutType;
  initialData?: Partial<WorkoutSessionFormData>;
  onSave: (data: WorkoutSessionFormData) => Promise<void>;
  onCancel: () => void;
  autoSaveEnabled?: boolean;
  autoSaveDelay?: number; // milliseconds
  maxHistorySize?: number;
  validateOnChange?: boolean;
  getMedicalReports?: (playerIds: string[]) => Promise<any[]>;
}

// Hook return interface
export interface UseWorkoutBuilderReturn {
  // Current state
  formData: WorkoutSessionFormData;
  isDirty: boolean;
  isValid: boolean;
  hasChanges: boolean;
  lastSaved: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  
  // Validation state
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validationResult: ValidationResult | null;
  
  // Actions
  updateFormData: (updates: Partial<WorkoutSessionFormData>) => void;
  setFormData: (data: WorkoutSessionFormData) => void;
  save: () => Promise<void>;
  cancel: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  markDirty: () => void;
  markClean: () => void;
  validate: () => Promise<ValidationResult>;
  
  // Auto-save
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  isAutoSaveEnabled: boolean;
  
  // Utilities
  getWorkoutData: () => any;
  setWorkoutData: (data: any) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  addTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
}

// History entry for undo/redo
interface HistoryEntry {
  data: WorkoutSessionFormData;
  timestamp: Date;
}

export function useWorkoutBuilder({
  workoutType,
  initialData,
  onSave,
  onCancel,
  autoSaveEnabled = true,
  autoSaveDelay = 3000,
  maxHistorySize = 20,
  validateOnChange = true,
  getMedicalReports
}: UseWorkoutBuilderConfig): UseWorkoutBuilderReturn {
  // Initialize form data with defaults
  const getInitialFormData = (): WorkoutSessionFormData => ({
    name: '',
    type: workoutType,
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    assignedPlayerIds: [],
    assignedTeamIds: [],
    ...initialData
  });

  // State management
  const [formData, setFormDataState] = useState<WorkoutSessionFormData>(getInitialFormData());
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isAutoSaveEnabledState, setIsAutoSaveEnabled] = useState(autoSaveEnabled);
  
  // Validation state
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // History management for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([
    { data: getInitialFormData(), timestamp: new Date() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Refs for cleanup and tracking
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef(getInitialFormData());
  
  // Debounced form data for auto-save
  const debouncedFormData = useDebounce(formData, autoSaveDelay);
  
  // Computed values
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const isValid = validationResult?.isValid ?? true;
  
  // Validation function
  const validate = useCallback(async (): Promise<ValidationResult> => {
    const players: Player[] = []; // In real implementation, fetch from store or props
    const teams: Team[] = []; // In real implementation, fetch from store or props
    
    const result = await validateWorkoutSession(
      formData as Partial<WorkoutSession>,
      players,
      teams,
      getMedicalReports
    );
    
    setErrors(result.errors);
    setWarnings(result.warnings);
    setValidationResult(result);
    
    return result;
  }, [formData, getMedicalReports]);
  
  // Update form data with history tracking
  const updateFormData = useCallback((updates: Partial<WorkoutSessionFormData>) => {
    setFormDataState(prev => {
      const newData = { ...prev, ...updates };
      
      // Add to history
      const newEntry: HistoryEntry = {
        data: newData,
        timestamp: new Date()
      };
      
      setHistory(prevHistory => {
        // Remove any redo history when making a new change
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        newHistory.push(newEntry);
        
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex(prev => Math.max(0, prev - 1));
        } else {
          setCurrentIndex(newHistory.length - 1);
        }
        
        return newHistory;
      });
      
      return newData;
    });
    
    setIsDirty(true);
  }, [currentIndex, maxHistorySize]);
  
  // Set entire form data
  const setFormData = useCallback((data: WorkoutSessionFormData) => {
    updateFormData(data);
  }, [updateFormData]);
  
  // Undo action
  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setFormDataState(history[newIndex].data);
      setIsDirty(true);
    }
  }, [canUndo, currentIndex, history]);
  
  // Redo action
  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setFormDataState(history[newIndex].data);
      setIsDirty(true);
    }
  }, [canRedo, currentIndex, history]);
  
  // Reset to initial state
  const reset = useCallback(() => {
    const initialData = getInitialFormData();
    setFormDataState(initialData);
    setHistory([{ data: initialData, timestamp: new Date() }]);
    setCurrentIndex(0);
    setIsDirty(false);
    setErrors([]);
    setWarnings([]);
    setValidationResult(null);
  }, [workoutType, initialData]);
  
  // Save function
  const save = useCallback(async () => {
    try {
      // Validate before saving
      const validationResult = await validate();
      if (!validationResult.isValid) {
        throw new Error('Validation failed');
      }
      
      // Call the save handler
      await onSave(formData);
      
      // Update state after successful save
      setLastSaved(new Date());
      setIsDirty(false);
      setAutoSaveStatus('saved');
      initialDataRef.current = formData;
      
      // Clear auto-save status after a delay
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      throw error;
    }
  }, [formData, onSave, validate]);
  
  // Cancel function
  const cancel = useCallback(() => {
    if (isDirty) {
      // In a real app, you might want to show a confirmation dialog
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);
  
  // Manual dirty state control
  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);
  
  // Auto-save control
  const enableAutoSave = useCallback(() => setIsAutoSaveEnabled(true), []);
  const disableAutoSave = useCallback(() => setIsAutoSaveEnabled(false), []);
  
  // Get/set workout-specific data
  const getWorkoutData = useCallback(() => {
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        return formData.strengthWorkout;
      case WorkoutType.CONDITIONING:
        return formData.intervalProgram;
      case WorkoutType.HYBRID:
        return formData.hybridWorkout;
      case WorkoutType.AGILITY:
        return formData.agilityWorkout;
      default:
        return null;
    }
  }, [formData, workoutType]);
  
  const setWorkoutData = useCallback((data: any) => {
    const update: Partial<WorkoutSessionFormData> = {};
    
    switch (workoutType) {
      case WorkoutType.STRENGTH:
        update.strengthWorkout = data;
        break;
      case WorkoutType.CONDITIONING:
        update.intervalProgram = data;
        break;
      case WorkoutType.HYBRID:
        update.hybridWorkout = data;
        break;
      case WorkoutType.AGILITY:
        update.agilityWorkout = data;
        break;
    }
    
    updateFormData(update);
  }, [workoutType, updateFormData]);
  
  // Player/team management utilities
  const addPlayer = useCallback((player: Player) => {
    updateFormData({
      assignedPlayerIds: [...formData.assignedPlayerIds, player.id]
    });
  }, [formData.assignedPlayerIds, updateFormData]);
  
  const removePlayer = useCallback((playerId: string) => {
    updateFormData({
      assignedPlayerIds: formData.assignedPlayerIds.filter(id => id !== playerId)
    });
  }, [formData.assignedPlayerIds, updateFormData]);
  
  const addTeam = useCallback((team: Team) => {
    updateFormData({
      assignedTeamIds: [...formData.assignedTeamIds, team.id]
    });
  }, [formData.assignedTeamIds, updateFormData]);
  
  const removeTeam = useCallback((teamId: string) => {
    updateFormData({
      assignedTeamIds: formData.assignedTeamIds.filter(id => id !== teamId)
    });
  }, [formData.assignedTeamIds, updateFormData]);
  
  // Auto-validation effect
  useEffect(() => {
    if (validateOnChange && isDirty) {
      validate();
    }
  }, [formData, validateOnChange, isDirty, validate]);
  
  // Auto-save effect
  useEffect(() => {
    if (isAutoSaveEnabledState && isDirty && hasChanges) {
      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set auto-save status
      setAutoSaveStatus('saving');
      
      // Perform auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await save();
        } catch (error) {
          console.error('Auto-save failed:', error);
          setAutoSaveStatus('error');
        }
      }, 500); // Small delay after debounce
    }
    
    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedFormData, isAutoSaveEnabledState, isDirty, hasChanges, save]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // State
    formData,
    isDirty,
    isValid,
    hasChanges,
    lastSaved,
    canUndo,
    canRedo,
    
    // Validation
    errors,
    warnings,
    validationResult,
    
    // Actions
    updateFormData,
    setFormData,
    save,
    cancel,
    undo,
    redo,
    reset,
    markDirty,
    markClean,
    validate,
    
    // Auto-save
    autoSaveStatus,
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled: isAutoSaveEnabledState,
    
    // Utilities
    getWorkoutData,
    setWorkoutData,
    addPlayer,
    removePlayer,
    addTeam,
    removeTeam
  };
}