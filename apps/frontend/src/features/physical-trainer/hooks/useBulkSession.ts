'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { WorkoutEquipmentType } from '../types/conditioning.types';

// Generic types for bulk sessions that can work with any workout type
export interface BulkSessionConfig<TWorkout = any> {
  // Basic configuration
  numberOfSessions: number;
  sessionDate: string;
  sessionTime: string;
  duration: number; // minutes
  facilityId: string;
  
  // Session-specific configurations
  sessions: SessionConfiguration<TWorkout>[];
  
  // Global settings
  allowEquipmentConflicts: boolean;
  staggerStartTimes: boolean;
  staggerInterval: number; // minutes between session starts
  
  // Workout type specific data
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'mixed';
  baseWorkout?: TWorkout; // The template workout to duplicate
  enableMixedTypes?: boolean; // Allow different workout types per session
  transitionBuffers?: number[]; // Custom transition times between sessions
}

export interface SessionConfiguration<TWorkout = any> {
  id: string;
  name: string;
  workoutType?: 'strength' | 'conditioning' | 'hybrid' | 'agility'; // Per-session workout type for mixed bulk sessions
  equipment?: WorkoutEquipmentType[]; // For conditioning/hybrid workouts
  playerIds: string[];
  teamIds: string[];
  startTime?: string; // override global start time if staggered
  endTime?: string; // calculated end time
  duration?: number; // session-specific duration override
  facilityArea?: string; // assigned facility area
  transitionTime?: number; // buffer time after this session
  notes?: string;
  workoutData?: TWorkout; // Customized workout data for this session
}

export interface EquipmentAvailability {
  type: WorkoutEquipmentType;
  total: number;
  available: number;
  reserved: number;
  facilityId: string;
}

export interface FacilityInfo {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  availability: 'available' | 'partially_booked' | 'unavailable';
}

export interface BulkSessionValidation {
  isValid: boolean;
  errors: Record<string, string[]>; // step -> errors mapping
  warnings: string[];
}

export interface BulkSessionState<TWorkout = any> {
  config: BulkSessionConfig<TWorkout>;
  equipmentAvailability: EquipmentAvailability[];
  facilities: FacilityInfo[];
  validation: BulkSessionValidation;
  isLoading: boolean;
  currentStep: string;
}

interface UseBulkSessionOptions<TWorkout = any> {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'mixed';
  baseWorkout?: TWorkout;
  onComplete?: (config: BulkSessionConfig<TWorkout>) => Promise<void>;
  initialConfig?: Partial<BulkSessionConfig<TWorkout>>;
  enableMixedTypes?: boolean;
}

export const useBulkSession = <TWorkout = any>(options: UseBulkSessionOptions<TWorkout>) => {
  const { toast } = useToast();
  const { workoutType, baseWorkout, onComplete, initialConfig, enableMixedTypes = false } = options;

  // State management
  const [state, setState] = useState<BulkSessionState<TWorkout>>(() => ({
    config: {
      numberOfSessions: 2,
      sessionDate: new Date().toISOString().split('T')[0],
      sessionTime: '10:00',
      duration: 60,
      facilityId: '',
      sessions: [],
      allowEquipmentConflicts: false,
      staggerStartTimes: false,
      staggerInterval: 15,
      workoutType,
      baseWorkout,
      enableMixedTypes,
      transitionBuffers: [],
      ...initialConfig
    },
    equipmentAvailability: [],
    facilities: [],
    validation: {
      isValid: false,
      errors: {},
      warnings: []
    },
    isLoading: false,
    currentStep: 'basic'
  }));

  // Generate unique session ID
  const generateSessionId = useCallback((index: number) => {
    return `${workoutType}-session-${index + 1}-${Date.now()}`;
  }, [workoutType]);

  // Calculate staggered start times
  const calculateStaggeredTime = useCallback((baseTime: string, sessionIndex: number, intervalMinutes: number): string => {
    const [hours, minutes] = baseTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (sessionIndex * intervalMinutes);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }, []);

  // Initialize sessions when numberOfSessions changes
  const initializeSessions = useCallback((numberOfSessions: number, config: BulkSessionConfig<TWorkout>) => {
    const newSessions: SessionConfiguration<TWorkout>[] = Array.from(
      { length: numberOfSessions },
      (_, index) => {
        // For mixed type sessions, allow individual workout types
        const sessionWorkoutType = config.enableMixedTypes ? undefined : workoutType;
        const defaultDuration = 60; // Default duration, can be overridden
        
        const session: SessionConfiguration<TWorkout> = {
          id: generateSessionId(index),
          name: `${workoutType === 'mixed' ? 'Mixed' : workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session ${index + 1}`,
          workoutType: sessionWorkoutType,
          equipment: (workoutType === 'conditioning' || workoutType === 'hybrid') ? [] : undefined,
          playerIds: [],
          teamIds: [],
          duration: defaultDuration,
          transitionTime: config.transitionBuffers?.[index] || config.staggerInterval || 15,
          workoutData: baseWorkout ? JSON.parse(JSON.stringify(baseWorkout)) : undefined // Deep copy
        };

        // Calculate start and end times
        if (config.staggerStartTimes || workoutType === 'mixed') {
          session.startTime = calculateStaggeredTime(config.sessionTime, index, session.transitionTime);
          session.endTime = calculateStaggeredTime(session.startTime!, 0, session.duration!);
        }

        return session;
      }
    );
    return newSessions;
  }, [workoutType, baseWorkout, generateSessionId, calculateStaggeredTime]);

  // Update sessions when configuration changes
  useEffect(() => {
    setState(prevState => {
      const { config } = prevState;
      if (config.numberOfSessions > 0 && config.sessions.length !== config.numberOfSessions) {
        const newSessions = initializeSessions(config.numberOfSessions, config);
        return {
          ...prevState,
          config: {
            ...config,
            sessions: newSessions
          }
        };
      }
      return prevState;
    });
  }, [state.config.numberOfSessions, state.config.sessionTime, state.config.staggerStartTimes, state.config.staggerInterval, initializeSessions]);

  // Load equipment availability when facility changes
  const loadEquipmentAvailability = useCallback(async (facilityId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Mock API call - replace with actual API
      const mockAvailability: EquipmentAvailability[] = [
        { type: 'bike_erg' as WorkoutEquipmentType, total: 12, available: 10, reserved: 2, facilityId },
        { type: 'rowing' as WorkoutEquipmentType, total: 8, available: 6, reserved: 2, facilityId },
        { type: 'treadmill' as WorkoutEquipmentType, total: 6, available: 4, reserved: 2, facilityId },
        { type: 'airbike' as WorkoutEquipmentType, total: 4, available: 4, reserved: 0, facilityId },
        { type: 'wattbike' as WorkoutEquipmentType, total: 3, available: 2, reserved: 1, facilityId },
        { type: 'skierg' as WorkoutEquipmentType, total: 2, available: 2, reserved: 0, facilityId },
        { type: 'rope_jump' as WorkoutEquipmentType, total: 20, available: 20, reserved: 0, facilityId },
        { type: 'running' as WorkoutEquipmentType, total: 50, available: 50, reserved: 0, facilityId }
      ];
      
      setState(prev => ({
        ...prev,
        equipmentAvailability: mockAvailability,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load equipment availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load equipment availability',
        variant: 'destructive'
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Load facilities
  const loadFacilities = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Mock facilities data - replace with actual API call
      const mockFacilities: FacilityInfo[] = [
        {
          id: 'facility-001',
          name: 'Main Training Center',
          location: 'Building A, Floor 2',
          capacity: 50,
          equipment: ['dumbbells', 'barbells', 'squat-racks', 'benches', 'cardio-machines'],
          availability: 'available'
        },
        {
          id: 'facility-002',
          name: 'Cardio Center',
          location: 'Building B, Floor 1',
          capacity: 30,
          equipment: ['bikes', 'treadmills', 'rowing-machines', 'ellipticals'],
          availability: 'available'
        },
        {
          id: 'facility-003',
          name: 'Athletic Performance Lab',
          location: 'Building C, Floor 3',
          capacity: 40,
          equipment: ['power-racks', 'platforms', 'specialty-equipment', 'testing-equipment'],
          availability: 'partially_booked'
        }
      ];
      
      setState(prev => ({
        ...prev,
        facilities: mockFacilities,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load facilities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load facilities',
        variant: 'destructive'
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Load equipment availability when facility changes
  useEffect(() => {
    if (state.config.facilityId) {
      loadEquipmentAvailability(state.config.facilityId);
    }
  }, [state.config.facilityId, state.config.sessionDate, state.config.sessionTime, loadEquipmentAvailability]);

  // Load facilities on mount
  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  // Validation logic
  const validateConfiguration = useCallback((step: string, config: BulkSessionConfig<TWorkout>): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 'basic':
        if (!config.facilityId) errors.push('Please select a facility');
        if (config.numberOfSessions < 2) errors.push('Minimum 2 sessions required');
        if (config.numberOfSessions > 8) errors.push('Maximum 8 sessions allowed');
        if (config.duration < 15) errors.push('Minimum duration is 15 minutes');
        if (config.duration > 180) errors.push('Maximum duration is 180 minutes');
        break;
        
      case 'setup':
        config.sessions.forEach((session, index) => {
          const sessionWorkoutType = session.workoutType || workoutType;
          
          // Equipment validation for conditioning and hybrid workouts
          if ((sessionWorkoutType === 'conditioning' || sessionWorkoutType === 'hybrid') && 
              (!session.equipment || session.equipment.length === 0)) {
            errors.push(`Session ${index + 1}: Select at least one equipment type for ${sessionWorkoutType} workout`);
          }
          
          // Player assignment validation
          if (session.playerIds.length === 0 && session.teamIds.length === 0) {
            errors.push(`Session ${index + 1}: Assign at least one player or team`);
          }

          // Mixed type specific validations
          if (config.enableMixedTypes && !session.workoutType) {
            errors.push(`Session ${index + 1}: Select a workout type for mixed bulk sessions`);
          }

          // Transition time validation for mixed types
          if (config.enableMixedTypes && index > 0) {
            const prevSession = config.sessions[index - 1];
            const prevType = prevSession.workoutType;
            const currentType = session.workoutType;
            
            if (prevType && currentType && prevType !== currentType) {
              const minTransitionTime = this.getMinTransitionTime(prevType, currentType);
              const actualTransition = session.transitionTime || config.staggerInterval;
              
              if (actualTransition < minTransitionTime) {
                errors.push(`Session ${index + 1}: Needs at least ${minTransitionTime} minutes transition from ${prevType} to ${currentType}`);
              }
            }
          }
        });
        
        // Check equipment conflicts if not allowed
        if (!config.allowEquipmentConflicts) {
          const equipmentUsage = new Map<WorkoutEquipmentType, number>();
          config.sessions.forEach(session => {
            const sessionWorkoutType = session.workoutType || workoutType;
            if (sessionWorkoutType === 'conditioning' || sessionWorkoutType === 'hybrid') {
              session.equipment?.forEach(equipment => {
                equipmentUsage.set(equipment, (equipmentUsage.get(equipment) || 0) + 1);
              });
            }
          });
          
          equipmentUsage.forEach((usage, equipment) => {
            const availability = state.equipmentAvailability.find(a => a.type === equipment);
            if (availability && usage > availability.available) {
              errors.push(`${equipment}: ${usage} sessions need this equipment but only ${availability.available} available`);
            }
          });
        }
        break;
        
      case 'review':
        // Final validation - all previous validations should pass
        break;
    }
    
    return errors;
  }, [workoutType, state.equipmentAvailability]);

  // Helper method to get minimum transition time between workout types
  const getMinTransitionTime = useCallback((fromType: string, toType: string): number => {
    const transitionTimes: Record<string, number> = {
      'strength-conditioning': 10,
      'conditioning-strength': 8,
      'strength-agility': 5,
      'agility-strength': 7,
      'conditioning-agility': 6,
      'agility-conditioning': 8,
      'hybrid-strength': 4,
      'strength-hybrid': 6,
      'hybrid-conditioning': 3,
      'conditioning-hybrid': 5,
      'hybrid-agility': 7,
      'agility-hybrid': 9
    };
    
    const key = `${fromType}-${toType}`;
    return transitionTimes[key] || 10; // Default 10 minutes
  }, []);

  // Update validation when config or step changes
  useEffect(() => {
    const errors = validateConfiguration(state.currentStep, state.config);
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        errors: {
          ...prev.validation.errors,
          [state.currentStep]: errors
        },
        isValid: errors.length === 0
      }
    }));
  }, [state.currentStep, state.config, validateConfiguration]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<BulkSessionConfig<TWorkout>>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  }, []);

  // Update specific session
  const updateSession = useCallback((sessionId: string, updates: Partial<SessionConfiguration<TWorkout>>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sessions: prev.config.sessions.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      }
    }));
  }, []);

  // Duplicate session
  const duplicateSession = useCallback((sourceSessionId: string) => {
    setState(prev => {
      const sourceSession = prev.config.sessions.find(s => s.id === sourceSessionId);
      if (!sourceSession) return prev;

      const duplicatedSession: SessionConfiguration<TWorkout> = {
        ...sourceSession,
        id: generateSessionId(prev.config.sessions.length),
        name: `${sourceSession.name} (Copy)`,
        workoutData: sourceSession.workoutData ? JSON.parse(JSON.stringify(sourceSession.workoutData)) : undefined
      };

      return {
        ...prev,
        config: {
          ...prev.config,
          sessions: [...prev.config.sessions, duplicatedSession],
          numberOfSessions: prev.config.numberOfSessions + 1
        }
      };
    });
  }, [generateSessionId]);

  // Remove session
  const removeSession = useCallback((sessionId: string) => {
    setState(prev => {
      if (prev.config.sessions.length <= 2) {
        toast({
          title: 'Cannot Remove Session',
          description: 'Minimum 2 sessions required for bulk operations',
          variant: 'destructive'
        });
        return prev;
      }

      return {
        ...prev,
        config: {
          ...prev.config,
          sessions: prev.config.sessions.filter(s => s.id !== sessionId),
          numberOfSessions: prev.config.numberOfSessions - 1
        }
      };
    });
  }, [toast]);

  // Distribute players evenly across sessions
  const distributePlayersEvenly = useCallback((playerIds: string[]) => {
    setState(prev => {
      const sessionsPerPlayer = Math.ceil(playerIds.length / prev.config.sessions.length);
      const updatedSessions = prev.config.sessions.map((session, index) => {
        const startIndex = index * sessionsPerPlayer;
        const endIndex = Math.min(startIndex + sessionsPerPlayer, playerIds.length);
        return {
          ...session,
          playerIds: playerIds.slice(startIndex, endIndex)
        };
      });

      return {
        ...prev,
        config: {
          ...prev.config,
          sessions: updatedSessions
        }
      };
    });
  }, []);

  // Apply smart allocation results to sessions
  const applySmartAllocation = useCallback((allocationResult: any) => {
    setState(prev => {
      const updatedSessions = prev.config.sessions.map(session => {
        const allocation = allocationResult.allocations.find((a: any) => a.sessionId === session.id);
        if (allocation) {
          return {
            ...session,
            startTime: allocation.startTime,
            endTime: allocation.endTime,
            facilityArea: allocation.facilityArea,
            transitionTime: allocation.transitionBuffer,
            workoutType: prev.config.enableMixedTypes ? allocation.workoutType : session.workoutType
          };
        }
        return session;
      });

      return {
        ...prev,
        config: {
          ...prev.config,
          sessions: updatedSessions
        }
      };
    });
  }, []);

  // Update session workout type (for mixed bulk sessions)
  const updateSessionWorkoutType = useCallback((sessionId: string, newWorkoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility') => {
    setState(prev => {
      if (!prev.config.enableMixedTypes) {
        toast({
          title: 'Mixed Types Disabled',
          description: 'Enable mixed types to change individual session workout types',
          variant: 'destructive'
        });
        return prev;
      }

      const updatedSessions = prev.config.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            workoutType: newWorkoutType,
            // Reset equipment selection when workout type changes
            equipment: (newWorkoutType === 'conditioning' || newWorkoutType === 'hybrid') ? [] : undefined
          };
        }
        return session;
      });

      return {
        ...prev,
        config: {
          ...prev.config,
          sessions: updatedSessions
        }
      };
    });
  }, [toast]);

  // Optimize session order using smart algorithms
  const optimizeSessionOrder = useCallback(() => {
    setState(prev => {
      // Only optimize if we have mixed types or multiple different session types
      const hasMultipleTypes = new Set(prev.config.sessions.map(s => s.workoutType)).size > 1;
      if (!hasMultipleTypes && !prev.config.enableMixedTypes) {
        return prev;
      }

      // Use smart allocation algorithms to reorder sessions
      const facility = prev.facilities.find(f => f.id === prev.config.facilityId);
      if (!facility) return prev;

      const constraints = {
        facilityCapacity: facility.capacity,
        equipmentAvailability: prev.equipmentAvailability,
        transitionTimeMinutes: prev.config.staggerInterval,
        maxConcurrentSessions: 4,
        prioritizeGrouping: true,
        minimizeTransitions: true
      };

      try {
        const SmartAllocationAlgorithms = require('../services/SmartAllocationAlgorithms').SmartAllocationAlgorithms;
        const result = SmartAllocationAlgorithms.allocateOptimalSessions(
          prev.config.sessions,
          constraints,
          facility
        );

        // Apply the optimized order
        const optimizedSessions = result.allocations.map((allocation: any) => {
          const originalSession = prev.config.sessions.find(s => s.id === allocation.sessionId);
          return {
            ...originalSession,
            startTime: allocation.startTime,
            endTime: allocation.endTime,
            facilityArea: allocation.facilityArea,
            transitionTime: allocation.transitionBuffer
          };
        });

        toast({
          title: 'Sessions Optimized',
          description: `Reordered ${optimizedSessions.length} sessions for optimal flow and equipment usage`
        });

        return {
          ...prev,
          config: {
            ...prev.config,
            sessions: optimizedSessions
          }
        };
      } catch (error) {
        console.error('Failed to optimize session order:', error);
        toast({
          title: 'Optimization Failed',
          description: 'Unable to optimize session order. Please check your configuration.',
          variant: 'destructive'
        });
        return prev;
      }
    });
  }, [toast]);

  // Set current step
  const setCurrentStep = useCallback((step: string) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  // Complete bulk session creation
  const complete = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (onComplete) {
        await onComplete(state.config);
      }
      
      toast({
        title: 'Bulk Sessions Created',
        description: `Successfully created ${state.config.numberOfSessions} ${workoutType} sessions`,
      });
    } catch (error) {
      console.error('Failed to create bulk sessions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create sessions. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.config, onComplete, toast, workoutType]);

  // Reset configuration
  const reset = useCallback(() => {
    setState({
      config: {
        numberOfSessions: 2,
        sessionDate: new Date().toISOString().split('T')[0],
        sessionTime: '10:00',
        duration: 60,
        facilityId: '',
        sessions: [],
        allowEquipmentConflicts: false,
        staggerStartTimes: false,
        staggerInterval: 15,
        workoutType,
        baseWorkout,
        enableMixedTypes,
        transitionBuffers: [],
        ...initialConfig
      },
      equipmentAvailability: [],
      facilities: [],
      validation: {
        isValid: false,
        errors: {},
        warnings: []
      },
      isLoading: false,
      currentStep: 'basic'
    });
  }, [workoutType, baseWorkout, initialConfig]);

  return {
    // State
    config: state.config,
    equipmentAvailability: state.equipmentAvailability,
    facilities: state.facilities,
    validation: state.validation,
    isLoading: state.isLoading,
    currentStep: state.currentStep,
    
    // Actions
    updateConfig,
    updateSession,
    duplicateSession,
    removeSession,
    distributePlayersEvenly,
    applySmartAllocation,
    updateSessionWorkoutType,
    optimizeSessionOrder,
    setCurrentStep,
    complete,
    reset,
    
    // Utilities
    calculateStaggeredTime,
    validateConfiguration,
    
    // Derived state
    canProceed: state.validation.isValid && !state.isLoading,
    totalParticipants: state.config.sessions.reduce((total, session) => 
      total + session.playerIds.length, 0
    ),
    equipmentConflicts: state.validation.errors.setup?.filter(error => 
      error.includes('equipment')) || []
  };
};

export default useBulkSession;