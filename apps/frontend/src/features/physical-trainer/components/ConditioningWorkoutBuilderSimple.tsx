'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Clock, Calendar, MapPin, Users, Heart, 
  Activity, Target, Save, X, ChevronRight, Info, AlertCircle, Copy,
  FileText, Dumbbell, Eye, FolderOpen, Repeat, Timer, Flame, Zap, RotateCw, Loader2
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { IntervalProgram, IntervalSet, WorkoutCreationContext, Exercise, WorkoutTemplate } from '../types';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../types/conditioning.types';
import { WorkoutBuilderLayout, WorkoutTabContent } from './shared/WorkoutBuilderLayout';
import { ExerciseLibrarySidebar } from './shared/ExerciseLibrarySidebar';
import { UnifiedScheduler, UnifiedSchedule } from './shared/UnifiedScheduler';
import EquipmentAvailabilityWidget from './equipment/EquipmentAvailabilityWidget';
import EnhancedEquipmentSelector from './equipment/EnhancedEquipmentSelector';
import EquipmentConflictWarning from './equipment/EquipmentConflictWarning';
import EnhancedIntervalForm from './conditioning/EnhancedIntervalForm';
import IntervalTimelineEnhanced from './conditioning/IntervalTimelineEnhanced';
import IntervalTemplates, { type IntervalTemplate } from './conditioning/IntervalTemplates';
import ExerciseSectionNavigation, { type ExerciseSection } from './conditioning/ExerciseSectionNavigation';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { ExerciseEditModal } from './conditioning/ExerciseEditModal';
import CollapsibleIntervalPreview from './CollapsibleIntervalPreview';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGetPlayersQuery, useGetTeamsQuery } from '@/store/api/playerApi';
import { useGetMedicalReportsQuery } from '@/store/api/medicalApi';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import { useCheckEquipmentConflictsQuery, useCreateEquipmentReservationMutation, useGetRealTimeAvailabilityQuery } from '@/store/api/equipmentApi';
import { WorkoutBuilderTab, ExerciseLibraryItem, ExercisePhase, ExerciseLibraryFilters, ExerciseAssignment } from '../types/workout-builder.types';
import { expandIntervals } from '../utils/conditioning.utils';
import SaveAsTemplateModal from './conditioning/SaveAsTemplateModal';
import { TeamPlayerSelector } from './shared/TeamPlayerSelector';
import { EquipmentCapacityBar } from './shared/EquipmentCapacityBar';
import { createRotationGroups, calculateRotationTiming, generateRotationSummary } from '../utils/rotationUtils';
// Lazy load rotation components to avoid build errors
const RotationWorkoutBuilder = React.lazy(() => import('./rotation/RotationWorkoutBuilder'));
const GroupManagement = React.lazy(() => import('./rotation/GroupManagement'));
import type { RotationSchedule, RotationGroup, AutoGroupOptions, WorkoutStation } from '../types/rotation.types';
import { GROUP_COLORS, STATION_COLORS } from '../types/rotation.types';

interface ConditioningWorkoutBuilderProps {
  onSave: (program: IntervalProgram, playerIds?: string[], teamIds?: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: IntervalProgram;
  workoutId?: string;
  workoutContext?: WorkoutCreationContext | null;
}

// Facility configuration
const FACILITY_OPTIONS = [
  { id: 'default-facility', name: 'Training Center (Default)' },
  { id: 'training-center-main', name: 'Training Center - Main' },
  { id: 'training-center-west', name: 'Training Center - West' },
  { id: 'youth-facility', name: 'Youth Facility' }
];

function ConditioningWorkoutBuilderSimpleInternal({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
  workoutId,
  workoutContext
}: ConditioningWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // Session Context State - properly formatted date
  const sessionDate = workoutContext?.sessionDate ? 
    (typeof workoutContext.sessionDate === 'string' ? new Date(workoutContext.sessionDate) : workoutContext.sessionDate) : 
    new Date();
  
  // Ensure sessionDate is valid
  const validSessionDate = sessionDate instanceof Date && !isNaN(sessionDate.getTime()) ? sessionDate : new Date();
    
  const [sessionInfo] = useState({
    sessionId: workoutContext?.sessionId || null,
    sessionType: workoutContext?.sessionType || 'conditioning',
    date: validSessionDate,
    time: workoutContext?.sessionTime || '09:00',
    location: workoutContext?.sessionLocation || 'default-facility',
    teamId: workoutContext?.teamId || '',
    teamName: workoutContext?.teamName || ''
  });

  // Workout Details State
  const [workoutName, setWorkoutName] = useState(
    initialData?.name || 
    (workoutContext ? `${workoutContext.sessionType} - ${workoutContext.playerName}` : '')
  );
  const [description, setDescription] = useState(
    initialData?.description || 
    (workoutContext ? `Personalized conditioning workout for ${workoutContext.playerName}` : '')
  );
  const [estimatedDuration, setEstimatedDuration] = useState(60); // minutes
  
  // Intervals State
  const [intervals, setIntervals] = useState<IntervalSet[]>(initialData?.intervals || []);
  const [activeIntervalId, setActiveIntervalId] = useState<string | null>(null);
  
  // Use a ref to track interval counter to prevent duplicate names
  const intervalCounterRef = useRef(1);
  
  // Initialize counter based on existing intervals
  useEffect(() => {
    if (intervals.length > 0) {
      // Find the highest interval number
      const maxNumber = intervals.reduce((max, interval) => {
        const match = interval.name?.match(/Interval (\d+)/);
        if (match) {
          return Math.max(max, parseInt(match[1]));
        }
        return max;
      }, 0);
      intervalCounterRef.current = maxNumber + 1;
    }
  }, []); // Only run on mount
  
  // Extract unique equipment types from all intervals
  const getUniqueEquipmentFromIntervals = useMemo(() => {
    const uniqueEquipment = new Set<WorkoutEquipmentType>();
    intervals.forEach(interval => {
      if (interval.equipment) {
        uniqueEquipment.add(interval.equipment);
      }
    });
    return Array.from(uniqueEquipment);
  }, [intervals]);
  
  // Unified Schedule State
  const [schedule, setSchedule] = useState<UnifiedSchedule>({
    startDate: validSessionDate,
    startTime: sessionInfo.time,
    location: sessionInfo.location || 'default-facility',
    participants: {
      playerIds: workoutContext ? [workoutContext.playerId] : [],
      teamIds: []
    }
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState<WorkoutBuilderTab>('details');
  const [showValidation, setShowValidation] = useState(false);
  const [showExerciseSidebar, setShowExerciseSidebar] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ExercisePhase>('warmup');
  const [activeSection, setActiveSection] = useState<ExerciseSection>('intervals');
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  
  // Rotation Mode State
  const [rotationMode, setRotationMode] = useState(false);
  const [rotationSchedule, setRotationSchedule] = useState<RotationSchedule | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Exercise selection state
  const [warmupExercises, setWarmupExercises] = useState<ExerciseAssignment[]>([]);
  const [cooldownExercises, setCooldownExercises] = useState<ExerciseAssignment[]>([]);
  const [exerciseFilters, setExerciseFilters] = useState<ExerciseLibraryFilters>({});
  const [editingExercise, setEditingExercise] = useState<{exercise: ExerciseAssignment, phase: 'warmup' | 'cooldown', index: number} | null>(null);
  
  // Equipment management state
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(WorkoutEquipmentType.ROWING);
  const [equipmentConflicts, setEquipmentConflicts] = useState<any[]>([]);
  const [showEquipmentConflicts, setShowEquipmentConflicts] = useState(false);
  
  // Equipment capacity state
  const [equipmentCapacity, setEquipmentCapacity] = useState({
    totalCapacity: 6, // Default value, will be updated from API
    availableCapacity: 6,
    facilityId: schedule.location || 'default-facility'
  });
  
  // Fetch real-time equipment availability
  const { data: equipmentAvailability, refetch: refetchEquipment } = useGetRealTimeAvailabilityQuery(
    schedule.location || 'default-facility',
    {
      skip: false,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );
  
  // Force refetch when facility changes
  React.useEffect(() => {
    if (schedule.location) {
      refetchEquipment();
    }
  }, [schedule.location, refetchEquipment]);
  
  // Update equipment capacity when availability data changes
  React.useEffect(() => {
    if (equipmentAvailability && selectedEquipment) {
      const equipmentData = equipmentAvailability[selectedEquipment];
      if (equipmentData) {
        setEquipmentCapacity({
          totalCapacity: equipmentData.totalCount || 0,
          availableCapacity: equipmentData.availableCount || 0,
          facilityId: schedule.location || 'default-facility'
        });
      } else {
        // If no data for this equipment type, set to 0
        setEquipmentCapacity({
          totalCapacity: 0,
          availableCapacity: 0,
          facilityId: schedule.location || 'default-facility'
        });
      }
    }
  }, [equipmentAvailability, selectedEquipment, schedule.location]);
  
  // Calculate the bottleneck equipment (minimum capacity across all interval equipment types)
  const bottleneckEquipment = useMemo(() => {
    const uniqueEquipment = getUniqueEquipmentFromIntervals;
    
    if (uniqueEquipment.length === 0 || !equipmentAvailability) {
      return {
        equipmentType: selectedEquipment,
        totalCapacity: 0,
        availableCapacity: 0,
        facilityId: schedule.location || 'default-facility'
      };
    }
    
    // Find equipment with minimum capacity
    let minCapacity = Infinity;
    let bottleneck = {
      equipmentType: uniqueEquipment[0],
      totalCapacity: 0,
      availableCapacity: 0,
      facilityId: schedule.location || 'default-facility'
    };
    
    uniqueEquipment.forEach(equipmentType => {
      const data = equipmentAvailability[equipmentType];
      if (data) {
        const available = data.availableCount || 0;
        if (available < minCapacity) {
          minCapacity = available;
          bottleneck = {
            equipmentType,
            totalCapacity: data.totalCount || 0,
            availableCapacity: available,
            facilityId: schedule.location || 'default-facility'
          };
        }
      }
    });
    
    
    return bottleneck;
  }, [getUniqueEquipmentFromIntervals, equipmentAvailability, selectedEquipment, schedule.location]);
  
  // Auto-hide exercise library when switching to intervals section
  React.useEffect(() => {
    if (activeSection === 'intervals') {
      setShowExerciseSidebar(false);
    }
  }, [activeSection]);
  
  // Fetch players, teams and medical data
  // In rotation mode or when teams are selected, fetch all players
  const shouldFetchAllPlayers = rotationMode || schedule.participants.teamIds.length > 0;
  const { data: playersData } = useGetPlayersQuery(
    sessionInfo.teamId && !shouldFetchAllPlayers ? { teamId: sessionInfo.teamId } : undefined,
    { skip: false } // Always fetch players
  );
  
  const { data: teamsData } = useGetTeamsQuery();
  
  const { data: medicalReports } = useGetMedicalReportsQuery(
    { playerIds: schedule.participants.playerIds },
    { skip: schedule.participants.playerIds.length === 0 }
  );
  
  // Fetch exercises for library
  const { data: exercisesData, isLoading: isLoadingExercises } = useGetExercisesQuery();
  
  // Equipment reservation mutation
  const [createEquipmentReservation] = useCreateEquipmentReservationMutation();
  
  // Transform exercises to library format with proper phase mapping
  const libraryExercises = useMemo<ExerciseLibraryItem[]>(() => {
    if (!exercisesData?.exercises) return [];
    
    return exercisesData.exercises.map((exercise: any) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category || 'conditioning',
      phase: exercise.phase || 'main' as ExercisePhase,
      description: exercise.description || exercise.notes,
      videoUrl: exercise.videoUrl,
      equipment: exercise.equipment || [],
      muscleGroups: exercise.muscleGroups || [],
      difficulty: exercise.difficulty || 'intermediate',
      duration: exercise.duration,
      defaultSets: exercise.sets,
      defaultReps: exercise.reps,
      restBetweenSets: exercise.restBetweenSets,
      tags: exercise.tags || [],
      isFavorite: false,
      usageCount: 0
    }));
  }, [exercisesData]);

  // Auto-save functionality
  const autoSaveKey = `conditioning_workout_enhanced_${workoutId || Date.now()}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: {
      workoutName,
      description,
      intervals,
      schedule,
      estimatedDuration
    },
    enabled: true,
    delay: 3000,
    onRestore: (data) => {
      setWorkoutName(data.workoutName || '');
      setDescription(data.description || '');
      setIntervals(data.intervals || []);
      if (data.schedule) {
        setSchedule(data.schedule);
      }
      setEstimatedDuration(data.estimatedDuration || 60);
      toast.success('Auto-save restored');
    }
  });

  // Calculate durations including warmup, intervals, and cooldown
  const calculateDurations = useMemo(() => {
    // Calculate warmup duration
    const warmupDuration = (warmupExercises || []).reduce((sum, exercise) => {
      const exerciseDuration = exercise.duration || 30; // Default 30s per exercise if no duration
      const totalSets = exercise.sets || 1;
      const restTime = exercise.restBetweenSets || 0;
      return sum + (exerciseDuration * totalSets) + (restTime * (totalSets - 1));
    }, 0);

    // Calculate intervals duration
    const intervalsDuration = (intervals || []).reduce((sum, interval: any) => {
      if (interval.setConfig && interval.setConfig.numberOfSets > 1) {
        const { numberOfSets, intervalsPerSet, restBetweenSets, restBetweenIntervals } = interval.setConfig;
        const workDuration = interval.duration * intervalsPerSet * numberOfSets;
        const restWithinSets = restBetweenIntervals * (intervalsPerSet - 1) * numberOfSets;
        const restBetweenSetsTotal = restBetweenSets * (numberOfSets - 1);
        return sum + workDuration + restWithinSets + restBetweenSetsTotal;
      }
      return sum + interval.duration;
    }, 0);

    // Calculate cooldown duration
    const cooldownDuration = (cooldownExercises || []).reduce((sum, exercise) => {
      const exerciseDuration = exercise.duration || 30; // Default 30s per exercise if no duration
      const totalSets = exercise.sets || 1;
      const restTime = exercise.restBetweenSets || 0;
      return sum + (exerciseDuration * totalSets) + (restTime * (totalSets - 1));
    }, 0);

    // Total session duration
    const totalSessionDuration = warmupDuration + intervalsDuration + cooldownDuration;

    return {
      warmupMinutes: Math.ceil(warmupDuration / 60),
      intervalsMinutes: Math.ceil(intervalsDuration / 60),
      cooldownMinutes: Math.ceil(cooldownDuration / 60),
      totalMinutes: Math.ceil(totalSessionDuration / 60),
      // Raw seconds for more precise calculations
      warmupSeconds: warmupDuration,
      intervalsSeconds: intervalsDuration,
      cooldownSeconds: cooldownDuration,
      totalSeconds: totalSessionDuration
    };
  }, [warmupExercises, intervals, cooldownExercises]);

  // Update estimated duration when calculations change
  useEffect(() => {
    setEstimatedDuration(calculateDurations.totalMinutes);
  }, [calculateDurations]);
  
  // Equipment conflict checking
  const endTime = useMemo(() => {
    return new Date(schedule.startDate.getTime() + estimatedDuration * 60000).toISOString();
  }, [schedule.startDate, estimatedDuration]);
  
  const { data: conflictData } = useCheckEquipmentConflictsQuery({
    equipmentType: selectedEquipment,
    facilityId: sessionInfo.location || 'default-facility',
    startTime: schedule.startDate.toISOString(),
    endTime: endTime,
    requiredCount: schedule.participants.playerIds.length
  }, {
    skip: !schedule.startDate || schedule.participants.playerIds.length === 0
  });
  
  // Monitor equipment conflicts
  React.useEffect(() => {
    if (conflictData?.success && conflictData?.data?.length > 0) {
      setEquipmentConflicts(conflictData.data);
      setShowEquipmentConflicts(true);
    } else {
      setEquipmentConflicts([]);
      setShowEquipmentConflicts(false);
    }
  }, [conflictData]);

  // Calculate total session timing including rotations
  const sessionTiming = useMemo(() => {
    if (!rotationSchedule) {
      return {
        totalSessionTime: calculateDurations.totalMinutes,
        workoutTime: calculateDurations.totalMinutes,
        rotationTime: 0,
        setupTime: 0,
        buffer: 0,
        requiresRotation: false
      };
    }

    const timing = calculateRotationTiming(rotationSchedule, calculateDurations.totalMinutes);
    return {
      ...timing,
      requiresRotation: true
    };
  }, [rotationSchedule, calculateDurations.totalMinutes]);

  // Interval Management
  const addInterval = () => {
    // Use the selected equipment from the equipment selector
    const equipmentToUse = selectedEquipment;
    
    // Generate a more unique ID using timestamp + counter + random string + performance.now()
    const uniqueId = `interval-${Date.now()}-${intervalCounterRef.current}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
    
    // Check for duplicate IDs (should never happen, but let's be safe)
    const existingIds = intervals.map(i => i.id);
    if (existingIds.includes(uniqueId)) {
      console.error('Duplicate interval ID detected! This should not happen.');
      return;
    }
    
      
    const newInterval: any = {
      id: uniqueId,
      type: 'work',
      name: `Interval ${intervalCounterRef.current}`,
      duration: 60, // Default duration, will be overridden for distance-based
      equipment: equipmentToUse,
      primaryMetric: 'time', // Default to time-based
      targetValue: 60,
      targetMetrics: {
        heartRate: { value: 150, type: 'absolute' },
        watts: { value: 200, type: 'absolute' }
      },
      // Don't add setConfig by default - let user enable it when needed
      color: (intervals || []).length % 2 === 0 ? '#3b82f6' : '#10b981'
    };
    intervalCounterRef.current++; // Increment counter for next interval
    setIntervals([...intervals, newInterval]);
    setActiveIntervalId(newInterval.id);
    
    // Switch to exercises tab and intervals section
    setActiveTab('exercises');
    setActiveSection('intervals');
  };

  const updateInterval = (intervalId: string, updatedInterval: any) => {
    
    // Merge the updated properties with the existing interval to preserve all data
    const updatedIntervals = intervals.map(i => 
      i.id === intervalId 
        ? { ...i, ...updatedInterval }  // Merge instead of replace
        : i
    );
    
    setIntervals(updatedIntervals);
    
    // Clear the active interval after successful save
    setActiveIntervalId(null);
  };

  const removeInterval = (intervalId: string) => {
    // Simply remove the interval by ID
    setIntervals(intervals.filter(i => i.id !== intervalId));
    
    if (activeIntervalId === intervalId) {
      setActiveIntervalId(null);
    }
  };

  const duplicateInterval = (intervalId: string) => {
    const intervalToDuplicate = intervals.find(i => i.id === intervalId);
    if (intervalToDuplicate) {
      // Add a small delay to ensure unique timestamp
      const timestamp = Date.now() + Math.floor(Math.random() * 1000);
      const uniqueId = `interval-${timestamp}-copy-${Math.random().toString(36).substr(2, 9)}`;
      const newInterval: IntervalSet = {
        ...intervalToDuplicate,
        id: uniqueId,
        name: `${intervalToDuplicate.name} (Copy)`
      };
      setIntervals([...intervals, newInterval]);
    }
  };

  // Validation
  const validateWorkout = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!workoutName.trim()) {
      errors.push('Workout name is required');
    }
    
    if (intervals.length === 0) {
      errors.push('At least one interval is required');
    }
    
    if (schedule.participants.playerIds.length === 0 && schedule.participants.teamIds.length === 0) {
      errors.push('Select at least one player or team');
    }
    
    if (estimatedDuration > 120) {
      errors.push('Workout duration exceeds session time (max 120 minutes)');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Rotation Mode Handlers
  const handleToggleRotationMode = useCallback(() => {
    setRotationMode(!rotationMode);
    if (!rotationMode) {
      // Initialize with basic rotation schedule
      const basicSchedule: RotationSchedule = {
        id: `rotation-${Date.now()}`,
        name: `${workoutName} - Multi-Station`,
        stations: [],
        groups: [],
        rotationDuration: 15,
        transitionTime: 2,
        totalDuration: 0,
        rotationOrder: [],
        startTime: schedule.startDate,
        strategy: 'sequential'
      };
      setRotationSchedule(basicSchedule);
      toast.success('Rotation mode enabled - configure stations and groups');
    } else {
      setRotationSchedule(null);
      toast.success('Rotation mode disabled');
    }
  }, [rotationMode, workoutName, schedule.startDate]);

  // Group Management Functions for rotation mode
  const addGroup = useCallback(() => {
    if (!rotationSchedule) return;
    
    const newGroup: RotationGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${(rotationSchedule?.groups?.length || 0) + 1}`,
      players: [],
      color: GROUP_COLORS[(rotationSchedule?.groups?.length || 0) % GROUP_COLORS.length],
      startingStation: rotationSchedule.stations[0]?.id || '',
      rotationOrder: 'sequential'
    };

    setRotationSchedule(prev => prev ? {
      ...prev,
      groups: [...prev.groups, newGroup]
    } : null);
  }, [rotationSchedule]);

  const updateGroup = useCallback((groupId: string, updates: Partial<RotationGroup>) => {
    setRotationSchedule(prev => prev ? {
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    } : null);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setRotationSchedule(prev => prev ? {
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId)
    } : null);
  }, []);

  const autoGroupPlayers = useCallback((options: AutoGroupOptions) => {
    if (!rotationSchedule) return;
    
    const players = schedule.participants.playerIds.map(id => {
      const player = playersData?.players?.find((p: any) => p.id === id) || playersData?.find((p: any) => p.id === id);
      return player || { id, name: 'Unknown Player', position: 'Unknown' };
    });

    const groupSize = Math.ceil(players.length / (options.numberOfGroups || 4));
    const groups: RotationGroup[] = [];

    for (let i = 0; i < (options.numberOfGroups || 4); i++) {
      const groupPlayers = players.slice(i * groupSize, (i + 1) * groupSize);
      groups.push({
        id: `group-${Date.now()}-${i}`,
        name: `Group ${i + 1}`,
        players: groupPlayers.map(p => p.id),
        color: GROUP_COLORS[i % GROUP_COLORS.length],
        startingStation: rotationSchedule?.stations?.[i % (rotationSchedule?.stations?.length || 1)]?.id || '',
        rotationOrder: 'sequential'
      });
    }

    setRotationSchedule(prev => prev ? { ...prev, groups } : null);
    toast.success(`Created ${groups.length} groups automatically`);
  }, [rotationSchedule, schedule.participants.playerIds, playersData]);

  // Station Management Functions for rotation mode
  const addStation = useCallback((equipment: WorkoutEquipmentType) => {
    if (!rotationSchedule) return;
    
    const stationNumber = (rotationSchedule?.stations?.length || 0) + 1;
    // Calculate total duration from intervals
    const intervalsTotalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
    
    const newStation: WorkoutStation = {
      id: `station-${Date.now()}`,
      name: `Station ${stationNumber} - ${EQUIPMENT_CONFIGS[equipment].label}`,
      equipment: equipment,
      capacity: 6, // Default capacity
      workout: {
        type: 'intervals',
        data: {
          id: `workout-${Date.now()}`,
          name: `${EQUIPMENT_CONFIGS[equipment].label} Intervals`,
          description: `Conditioning workout on ${EQUIPMENT_CONFIGS[equipment].label}`,
          equipment: equipment,
          intervals: [...intervals], // Copy current intervals
          totalDuration: intervalsTotalDuration,
          tags: ['conditioning'],
          difficulty: 'intermediate'
        }
      },
      duration: rotationSchedule.rotationDuration,
      color: STATION_COLORS[stationNumber % STATION_COLORS.length],
      position: { x: 0, y: 0 },
      notes: ''
    };

    setRotationSchedule(prev => prev ? {
      ...prev,
      stations: [...prev.stations, newStation]
    } : null);
    
    toast.success(`Added ${EQUIPMENT_CONFIGS[equipment].label} station`);
  }, [rotationSchedule, intervals]);

  const removeStation = useCallback((stationId: string) => {
    setRotationSchedule(prev => prev ? {
      ...prev,
      stations: prev.stations.filter(s => s.id !== stationId)
    } : null);
  }, []);

  const updateStation = useCallback((stationId: string, updates: Partial<WorkoutStation>) => {
    setRotationSchedule(prev => prev ? {
      ...prev,
      stations: prev.stations.map(s => s.id === stationId ? { ...s, ...updates } : s)
    } : null);
  }, []);

  const handleSaveRotationSchedule = useCallback((rotationSchedule: RotationSchedule) => {
    // Convert rotation schedule to conditioning program
    // This would create individual programs for each station
    toast.success('Multi-station rotation workout saved successfully!');
    onSave({
      id: rotationSchedule.id,
      name: rotationSchedule.name,
      description: `Multi-station rotation workout with ${rotationSchedule?.stations?.length || 0} stations`,
      equipment: selectedEquipment,
      intervals: intervals,
      totalDuration: rotationSchedule.totalDuration * 60,
      estimatedCalories: Math.round(rotationSchedule.totalDuration * 8), // Rough estimate
      tags: ['conditioning', 'rotation', 'multi-station'],
      difficulty: 'intermediate',
      metadata: {
        rotationSchedule: rotationSchedule,
        isRotationWorkout: true
      }
    }, schedule.participants.playerIds, schedule.participants.teamIds);
  }, [selectedEquipment, intervals, schedule.participants, onSave]);

  // Save Handler
  const handleSave = async () => {
    const validation = validateWorkout();
    if (!validation.isValid) {
      setShowValidation(true);
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Check for equipment conflicts before saving
    if (equipmentConflicts.length > 0) {
      toast.error(t('physicalTrainer:training.equipment.conflicts.saveBlocked'));
      setShowEquipmentConflicts(true);
      return;
    }

    const totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
    
    // Determine the most common equipment from intervals
    const equipmentCounts = intervals.reduce((acc, interval) => {
      const eq = interval.equipment || WorkoutEquipmentType.ROWING;
      acc[eq] = (acc[eq] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryEquipment = Object.entries(equipmentCounts).reduce((a, b) => 
      equipmentCounts[a[0]] > equipmentCounts[b[0]] ? a : b, 
      [WorkoutEquipmentType.ROWING, 0]
    )[0] as WorkoutEquipmentType;
    
    const program: IntervalProgram = {
      id: workoutId || `program-${Date.now()}`,
      name: workoutName,
      description: description,
      equipment: primaryEquipment,
      intervals: intervals,
      totalDuration: totalDuration,
      estimatedCalories: Math.round(totalDuration / 60 * 12), // More accurate calculation
      tags: ['conditioning', primaryEquipment.toLowerCase()],
      difficulty: getWorkoutDifficulty(intervals),
      // Link to session if context provided
      metadata: workoutContext ? {
        sessionId: workoutContext.sessionId,
        sessionType: workoutContext.sessionType,
        sessionDate: workoutContext.sessionDate instanceof Date ? 
          workoutContext.sessionDate.toISOString() : 
          workoutContext.sessionDate,
        sessionTime: workoutContext.sessionTime,
        sessionLocation: workoutContext.sessionLocation
      } : undefined
    };
    
    // Handle rotation mode save differently
    if (rotationMode && rotationSchedule) {
      // Validate rotation schedule
      if (rotationSchedule.stations.length === 0) {
        toast.error('Please add at least one station');
        return;
      }
      if (rotationSchedule.groups.length === 0) {
        toast.error('Please create groups and assign players');
        return;
      }
      
      // Save the rotation schedule with embedded interval program
      handleSaveRotationSchedule(rotationSchedule);
      return;
    }
    
    try {
      // Create equipment reservation if participants are assigned
      if (schedule.participants.playerIds.length > 0) {
        await createEquipmentReservation({
          equipmentType: primaryEquipment,
          facilityId: schedule.location || 'default-facility',
          workoutSessionId: workoutId || `temp-${Date.now()}`,
          startTime: schedule.startDate.toISOString(),
          endTime: new Date(schedule.startDate.getTime() + estimatedDuration * 60000).toISOString(),
          requiredCount: schedule.participants.playerIds.length,
          playerIds: schedule.participants.playerIds,
          priority: 'normal',
          notes: `Conditioning workout: ${workoutName}`
        }).unwrap();
        
        toast.success(t('physicalTrainer:training.equipment.reservationCreated'));
      }
    } catch (error) {
      console.error('Equipment reservation failed:', error);
      toast.error(t('physicalTrainer:training.equipment.reservationFailed'));
      // Continue with workout save even if reservation fails
    }
    
    clearSavedData();
    onSave(program, schedule.participants.playerIds, schedule.participants.teamIds);
  };

  const getWorkoutDifficulty = (intervals: IntervalSet[]): 'beginner' | 'intermediate' | 'advanced' => {
    const totalWork = intervals.filter(i => i.type === 'work').reduce((sum, i) => sum + i.duration, 0);
    const totalRest = intervals.filter(i => i.type === 'rest').reduce((sum, i) => sum + i.duration, 0);
    const workRestRatio = totalWork / (totalRest || 1);
    
    if (workRestRatio > 3) return 'advanced';
    if (workRestRatio > 1.5) return 'intermediate';
    return 'beginner';
  };

  const totalDuration = intervals.reduce((sum, i) => sum + i.duration, 0);
  const workDuration = intervals.filter(i => i.type === 'work').reduce((sum, i) => sum + i.duration, 0);
  const restDuration = intervals.filter(i => i.type === 'rest').reduce((sum, i) => sum + i.duration, 0);

  // Handle exercise selection
  const handleExerciseSelect = (exercise: ExerciseLibraryItem) => {
    const newAssignment: ExerciseAssignment = {
      exerciseId: exercise.id,
      phase: currentPhase,
      orderIndex: currentPhase === 'warmup' ? (warmupExercises?.length || 0) : (cooldownExercises?.length || 0),
      sets: exercise.defaultSets || 3,
      reps: exercise.defaultReps || 10,
      duration: exercise.duration,
      restBetweenSets: exercise.restBetweenSets || 60
    };
    
    if (currentPhase === 'warmup') {
      setWarmupExercises([...warmupExercises, newAssignment]);
    } else if (currentPhase === 'cooldown') {
      setCooldownExercises([...cooldownExercises, newAssignment]);
    }
    
    setShowExerciseSidebar(false);
  };
  
  // Remove exercise
  const removeExercise = (phase: 'warmup' | 'cooldown', index: number) => {
    if (phase === 'warmup') {
      setWarmupExercises(warmupExercises.filter((_, i) => i !== index));
    } else {
      setCooldownExercises(cooldownExercises.filter((_, i) => i !== index));
    }
  };


  // Handle saving as template
  const handleSaveAsTemplate = (template: Omit<WorkoutTemplate, 'id' | 'createdBy'>) => {
    // Here you would typically save to your backend
    // For now, just show a success message
    toast.success(`Template "${template.name}" saved successfully!`);
    setShowSaveAsTemplateModal(false);
    
    // TODO: Implement actual save to backend
    // await saveTemplateToBackend(template);
  };

  // Handle template selection
  const handleTemplateSelect = (template: IntervalTemplate) => {
    // Use a default equipment (rowing) for all intervals in the template
    const defaultEquipment = WorkoutEquipmentType.ROWING;
    
    // Convert template intervals to our interval format
    const newIntervals = template.intervals.map((interval, index) => {
      // Add a delay to ensure unique timestamps for each interval
      const timestamp = Date.now() + index * 10;
      const uniqueId = `interval-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: uniqueId,
        type: interval.type,
        name: interval.name,
        duration: interval.duration,
        equipment: defaultEquipment,
        primaryMetric: interval.primaryMetric,
        targetValue: interval.targetValue,
        targetMetrics: {},
        // Only include setConfig if it exists in the template
        ...(interval.setConfig ? { setConfig: interval.setConfig } : {}),
        color: interval.type === 'work' ? '#ef4444' : 
               interval.type === 'rest' ? '#3b82f6' : 
               interval.type === 'warmup' ? '#10b981' : 
               interval.type === 'cooldown' ? '#6366f1' : '#f59e0b'
      };
    });
    
    setIntervals(newIntervals);
    setWorkoutName(template.name);
    setDescription(template.description);
    setActiveTab('exercises');
    setActiveSection('intervals');
    toast.success(`Template "${template.name}" loaded successfully`);
  };

  // Handle equipment capacity exceeded
  const handleCapacityExceeded = (selectedCount: number, maxCapacity: number) => {
    const excessCount = selectedCount - maxCapacity;
    const groupCount = Math.ceil(selectedCount / maxCapacity);
    
    toast.error(
      `Selected ${selectedCount} players exceed equipment capacity (${maxCapacity}). ` +
      `Consider using ${groupCount} rotation groups with ~${Math.ceil(selectedCount / groupCount)} players each.`,
      { duration: 6000 }
    );
  };

  // Calculate validation errors
  const validationErrors = useMemo(() => {
    const errors: any[] = [];
    if (!workoutName.trim()) {
      errors.push({ field: 'details.name', message: 'Workout name is required' });
    }
    if (intervals.length === 0) {
      errors.push({ field: 'exercises.intervals', message: 'At least one interval is required' });
    }
    if (schedule.participants.playerIds.length === 0 && schedule.participants.teamIds.length === 0) {
      errors.push({ field: 'assignment.participants', message: 'Select at least one player or team' });
    }
    return errors;
  }, [workoutName, intervals, schedule.participants]);

  // Removed: Previously showed RotationWorkoutBuilder when rotation mode was enabled
  // Now we handle rotation within the main UI using context-aware assignment

  return (
    <div className="flex h-full">
      {/* Exercise Library Sidebar */}
      {showExerciseSidebar && (
        <ExerciseLibrarySidebar
          exercises={libraryExercises}
          filters={exerciseFilters}
          onFiltersChange={setExerciseFilters}
          onExerciseSelect={handleExerciseSelect}
          selectedPhase={currentPhase}
          workoutType="conditioning"
          isLoading={isLoadingExercises}
          onClose={() => setShowExerciseSidebar(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1">
        <WorkoutBuilderLayout
          workoutType="conditioning"
          currentTab={activeTab}
          onTabChange={setActiveTab}
          onSave={handleSave}
          onCancel={onCancel}
          isDirty={workoutName !== '' || intervals.length > 0}
          isSaving={isLoading}
          validationErrors={validationErrors}
          title="Conditioning Workout Builder"
        >

          {/* Session Context Banner */}
          {workoutContext && (
            <Card className="border-blue-200 bg-blue-50/50 m-6 mb-0">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Creating workout for training session
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{workoutContext.playerName} ({workoutContext.teamName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(validSessionDate, 'MMM d')} at {workoutContext.sessionTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{workoutContext.sessionLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>{workoutContext.sessionType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rotation Mode Toggle */}
          <div className="border-b bg-gradient-to-r from-orange-50 to-red-50 p-4 m-6 mb-0 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <RotateCw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Multi-Station Rotation</h3>
                  <p className="text-sm text-orange-700">
                    Create a workout with multiple stations for equipment rotation
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleRotationMode}
                variant={rotationMode ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  rotationMode && "bg-orange-600 hover:bg-orange-700"
                )}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                {rotationMode ? 'Disable Rotation' : 'Enable Rotation Mode'}
              </Button>
            </div>
            {!rotationMode && (
              <div className="mt-3 text-xs text-orange-600">
                Perfect for scenarios like: 18 players with 3 different workouts (6 rowers, 6 bikes, 6 skiergs)
              </div>
            )}
            {rotationMode && intervals.length === 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-sm mb-2">Quick Setup Options:</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose rotation mode (groups switch stations) or parallel mode (groups stay on same equipment)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Create 3-station ROTATION setup for 18 players
                      const stations = [
                        { equipment: WorkoutEquipmentType.ROWING, name: 'Rowing Station' },
                        { equipment: WorkoutEquipmentType.BIKE_ERG, name: 'Bike Erg Station' },
                        { equipment: WorkoutEquipmentType.SKIERG, name: 'Ski Erg Station' }
                      ];
                      
                      // Create intervals for each station
                      const newIntervals = stations.map((station, idx) => ({
                        id: `interval-${Date.now()}-${idx}`,
                        type: 'work' as const,
                        name: `${station.name} Interval`,
                        duration: 180, // 3 minutes default
                        equipment: station.equipment,
                        primaryMetric: 'time',
                        targetValue: 180,
                        targetMetrics: {
                          heartRate: { value: 150, type: 'absolute' as const }
                        },
                        color: ['#ef4444', '#3b82f6', '#10b981'][idx]
                      }));
                      
                      setIntervals(newIntervals);
                      
                      // Set up rotation schedule - groups rotate through stations
                      const rotationSchedule: RotationSchedule = {
                        id: `rotation-${Date.now()}`,
                        name: '3-Station Rotation (18 players)',
                        stations: stations.map((station, idx) => ({
                          id: `station-${idx}`,
                          name: station.name,
                          equipment: station.equipment,
                          equipmentCount: 6,
                          interval: newIntervals[idx]
                        })),
                        groups: [],
                        rotationDuration: 20, // 20 minutes per station
                        restBetweenRotations: 120, // 2 min transition
                        totalRounds: 3 // 3 rounds = 60 minutes total
                      };
                      
                      setRotationSchedule(rotationSchedule);
                      toast.success('Created 3-station ROTATION setup (groups switch every 20 min)');
                    }}
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Rotation Mode (3×20min)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // For parallel sessions (no rotation), need to create separate workouts
                      toast.info(
                        'For parallel 60-min sessions:\n' +
                        '1. Create this workout for Group A (Rowing)\n' +
                        '2. Save and duplicate for Group B (change to Bike)\n' +
                        '3. Duplicate again for Group C (change to Ski Erg)\n' +
                        '4. Schedule all 3 at the same time',
                        { duration: 8000 }
                      );
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Parallel Mode (1×60min)
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Details Tab */}
          <WorkoutTabContent value="details">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workout-name" className="text-base font-medium">
                      Workout Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="workout-name"
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      placeholder="e.g., High-Intensity Rowing Intervals"
                      className={cn(
                        "mt-2",
                        showValidation && !workoutName.trim() && "border-red-500"
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-base font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the workout goals and structure..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      Estimated Duration
                    </Label>
                    <div className="mt-2 space-y-3">
                      {/* Total Session Duration */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold">
                              {calculateDurations.totalMinutes} min
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total Session Duration
                            </p>
                          </div>
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {/* Breakdown */}
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1 text-sm">
                          {calculateDurations.warmupMinutes > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Warm-up</span>
                              <span>{calculateDurations.warmupMinutes} min</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="font-medium">Intervals</span>
                            <span className="font-medium">{calculateDurations.intervalsMinutes} min</span>
                          </div>
                          {calculateDurations.cooldownMinutes > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Cooldown</span>
                              <span>{calculateDurations.cooldownMinutes} min</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Intervals Only Duration */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-semibold text-blue-700">
                              {calculateDurations.intervalsMinutes} min
                            </span>
                            <p className="text-sm text-blue-600 mt-0.5">
                              Intervals Duration Only
                            </p>
                          </div>
                          <Timer className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-blue-600/80 mt-2">
                          Including all work, rest, and set structure
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-700">
                        {intervals.filter(i => i.type === 'work').length}
                      </div>
                      <div className="text-xs text-blue-600">Work Intervals</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-700">
                        {intervals.filter(i => i.type === 'rest').length}
                      </div>
                      <div className="text-xs text-green-600">Rest Intervals</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">
                        {workDuration > 0 ? (workDuration / (restDuration || 1)).toFixed(1) : '0'}:1
                      </div>
                      <div className="text-xs text-purple-600">Work:Rest Ratio</div>
                    </div>
                  </div>

                  {/* Rotation Mode Indicator */}
                  {rotationMode && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-orange-600" />
                        <div>
                          <h4 className="text-sm font-medium text-orange-700">Rotation Mode Active</h4>
                          <p className="text-xs text-orange-600 mt-1">
                            {rotationSchedule?.stations?.length || 0} stations • {rotationSchedule?.groups?.length || 0} groups
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Exercises Tab - Contains warm-up, intervals, and cooldown */}
          <WorkoutTabContent value="exercises">
            <div className="p-6">
              <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div className="w-64 flex-shrink-0 space-y-4">
                  <ExerciseSectionNavigation
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    counts={{
                      warmup: warmupExercises?.length || 0,
                      intervals: intervals?.length || 0,
                      cooldown: cooldownExercises?.length || 0
                    }}
                    onAddClick={(section) => {
                      if (section === 'intervals') {
                        addInterval();
                      } else {
                        setCurrentPhase(section as ExercisePhase);
                        setExerciseFilters({ phase: [section as ExercisePhase] });
                        setShowExerciseSidebar(true);
                      }
                    }}
                  />
                  
                  {/* Equipment Selection */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">Equipment Type</h4>
                    <div className="space-y-3">
                      <EnhancedEquipmentSelector
                        selected={selectedEquipment}
                        onChange={setSelectedEquipment}
                        facilityId={schedule.location || 'default-facility'}
                        participantCount={schedule.participants.playerIds.length}
                        startTime={schedule.startDate}
                        endTime={new Date(schedule.startDate.getTime() + estimatedDuration * 60000)}
                      />
                      <EquipmentAvailabilityWidget
                        facilityId={schedule.location || 'default-facility'}
                        compact
                        filterTypes={[selectedEquipment]}
                      />
                    </div>
                    
                    {/* Equipment Conflicts Warning */}
                    {showEquipmentConflicts && equipmentConflicts.length > 0 && (
                      <div className="mt-3">
                        <EquipmentConflictWarning
                          conflicts={equipmentConflicts}
                          onAcceptSuggestion={(suggestion) => {
                            if (suggestion.type === 'alternative_equipment' && suggestion.alternativeEquipment) {
                              setSelectedEquipment(suggestion.alternativeEquipment as WorkoutEquipmentType);
                              toast.success(t('physicalTrainer:training.equipment.suggestions.applied'));
                            } else if (suggestion.type === 'alternative_time' && suggestion.timeSlot) {
                              setSchedule(prev => ({
                                ...prev,
                                startDate: suggestion.timeSlot!.start,
                                startTime: format(suggestion.timeSlot!.start, 'HH:mm')
                              }));
                              toast.success(t('physicalTrainer:training.equipment.suggestions.applied'));
                            }
                            setShowEquipmentConflicts(false);
                          }}
                          onDismiss={() => setShowEquipmentConflicts(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                  {/* Station Configuration for Rotation Mode */}
                  {rotationMode && activeSection === 'intervals' && (
                    <div className="mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <RotateCw className="h-5 w-5 text-orange-600" />
                            Station Configuration
                          </CardTitle>
                          <CardDescription>
                            Create workout stations with different equipment. Each group will rotate through all stations.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Current Stations */}
                          {rotationSchedule?.stations && rotationSchedule.stations.length > 0 ? (
                            <div className="space-y-3">
                              {rotationSchedule.stations.map((station, index) => (
                                <div key={station.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: station.color }}>
                                    <span className="font-semibold text-sm">{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">{station.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {EQUIPMENT_CONFIGS[station.equipment].icon} {EQUIPMENT_CONFIGS[station.equipment].label} • 
                                      Capacity: {station.capacity} players
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStation(station.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No stations configured yet. Add stations with different equipment types.
                            </div>
                          )}
                          
                          {/* Add Station Buttons */}
                          <div className="pt-4 border-t">
                            <Label className="text-sm font-medium mb-3 block">Add Station with Equipment:</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {Object.entries(EQUIPMENT_CONFIGS).slice(0, 8).map(([key, config]) => (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addStation(key as WorkoutEquipmentType)}
                                  disabled={rotationSchedule?.stations?.some(s => s.equipment === key)}
                                  className="flex flex-col items-center gap-1 h-auto py-3"
                                >
                                  <span className="text-lg">{config.icon}</span>
                                  <span className="text-xs">{config.label}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Station Timing Info */}
                          {rotationSchedule?.stations && rotationSchedule.stations.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                              <div className="text-sm space-y-1">
                                <div className="font-medium text-blue-900">Rotation Schedule:</div>
                                <div className="text-blue-700">
                                  • Each group spends {rotationSchedule.rotationDuration} min at each station
                                </div>
                                <div className="text-blue-700">
                                  • {rotationSchedule.transitionTime} min transition between stations
                                </div>
                                <div className="text-blue-700 font-medium">
                                  • Total session: {sessionTiming.totalSessionTime} minutes
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Warm-up Section */}
                  {activeSection === 'warmup' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Warm-up Exercises</h3>
                        <Button
                          onClick={() => {
                            setCurrentPhase('warmup');
                            setExerciseFilters({ phase: ['warmup'] });
                            setShowExerciseSidebar(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </Button>
                      </div>
                      {warmupExercises.length === 0 ? (
                        <div className="text-center py-8 bg-yellow-50/50 rounded-lg border-2 border-dashed border-yellow-200">
                          <p className="text-sm text-muted-foreground">
                            No warm-up exercises added yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {warmupExercises.map((exercise, index) => {
                            const exerciseData = libraryExercises.find(e => e.id === exercise.exerciseId);
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div>
                                  <h5 className="font-medium">{exerciseData?.name || 'Unknown Exercise'}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.sets} sets × {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration}s`}
                                    {exercise.restBetweenSets ? ` • ${exercise.restBetweenSets}s rest` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingExercise({exercise, phase: 'warmup', index})}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExercise('warmup', index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Intervals Section */}
                  {activeSection === 'intervals' && (
                    <div className="space-y-4">
                      {/* Show intervals below stations in rotation mode */}
                      {rotationMode && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold mb-2">Interval Configuration</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            These intervals will be used at each station. Configure your interval structure once, and it will apply to all equipment types.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{rotationMode ? 'Base Interval Structure' : 'Conditioning Intervals'}</h3>
                        <div className="flex gap-2">
                          <Button onClick={addInterval} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Interval
                          </Button>
                          <Button
                            onClick={() => setActiveTab('templates')}
                            size="sm"
                            variant="outline"
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Use Template
                          </Button>
                          <Button
                            onClick={() => setShowSaveAsTemplateModal(true)}
                            size="sm"
                            variant="outline"
                            disabled={intervals.length === 0}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save as Template
                          </Button>
                        </div>
                      </div>
                  
                  {/* Quick Add Buttons */}
                  {intervals.length === 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const defaultEquipment = intervals.length > 0 
                            ? intervals[intervals.length - 1].equipment 
                            : WorkoutEquipmentType.ROWING;
                          const workInterval: any = {
                            id: `interval-${Date.now()}-work-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'work',
                            name: '30s Work',
                            duration: 30,
                            equipment: defaultEquipment,
                            primaryMetric: 'time',
                            targetValue: 30,
                            targetMetrics: {},
                            color: '#ef4444'
                          };
                          const restInterval: any = {
                            id: `interval-${Date.now() + 1}-rest-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'rest',
                            name: '30s Rest',
                            duration: 30,
                            equipment: defaultEquipment,
                            primaryMetric: 'time',
                            targetValue: 30,
                            targetMetrics: {},
                            color: '#3b82f6'
                          };
                          setIntervals([workInterval, restInterval]);
                          toast.success('Added 30/30 intervals');
                        }}
                      >
                        <Timer className="h-4 w-4 mr-1" />
                        30/30
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const defaultEquipment = intervals.length > 0 
                            ? intervals[intervals.length - 1].equipment 
                            : WorkoutEquipmentType.ROWING;
                          const tabataWork: any = {
                            id: `interval-${Date.now()}-tabata-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'work',
                            name: 'Tabata Work',
                            duration: 20,
                            equipment: defaultEquipment,
                            primaryMetric: 'time',
                            targetValue: 20,
                            targetMetrics: {},
                            // Don't add setConfig by default
                            color: '#ef4444'
                          };
                          setIntervals([tabataWork]);
                          toast.success('Added Tabata structure');
                        }}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Tabata
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const defaultEquipment = intervals.length > 0 
                            ? intervals[intervals.length - 1].equipment 
                            : WorkoutEquipmentType.ROWING;
                          const distanceInterval: any = {
                            id: `interval-${Date.now()}-distance-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'work',
                            name: '500m Interval',
                            duration: 120, // estimated
                            equipment: defaultEquipment,
                            primaryMetric: 'distance',
                            targetValue: 500,
                            targetMetrics: {},
                            color: '#ef4444'
                          };
                          setIntervals([distanceInterval]);
                          setActiveIntervalId(distanceInterval.id);
                          setActiveTab('exercises');
                          setActiveSection('intervals');
                        }}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        500m
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const defaultEquipment = intervals.length > 0 
                            ? intervals[intervals.length - 1].equipment 
                            : WorkoutEquipmentType.ROWING;
                          const calorieInterval: any = {
                            id: `interval-${Date.now()}-calories-${Math.random().toString(36).substr(2, 9)}`,
                            type: 'work',
                            name: 'Calorie Target',
                            duration: 300, // estimated 5 min
                            equipment: defaultEquipment,
                            primaryMetric: 'calories',
                            targetValue: 50,
                            targetMetrics: {},
                            color: '#ef4444'
                          };
                          setIntervals([calorieInterval]);
                          setActiveIntervalId(calorieInterval.id);
                          setActiveTab('exercises');
                          setActiveSection('intervals');
                        }}
                      >
                        <Flame className="h-4 w-4 mr-1" />
                        50 Cal
                      </Button>
                    </div>
                  )}

                {intervals.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No intervals yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your conditioning workout by adding intervals
                    </p>
                    <Button onClick={addInterval}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Interval
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Interval List</h4>
                      {intervals.map((interval: any, index) => {
                        const getMetricDisplay = () => {
                          if (!interval.primaryMetric || interval.primaryMetric === 'time') {
                            return `${interval.duration}s`;
                          }
                          const units: Record<string, string> = {
                            distance: 'm',
                            calories: 'cal',
                            watts: 'W',
                            heartRate: 'bpm'
                          };
                          return `${interval.targetValue} ${units[interval.primaryMetric] || ''}`;
                        };

                        return (
                          <div
                            key={interval.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              activeIntervalId === interval.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setActiveIntervalId(interval.id)}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: interval.color }}
                                  />
                                  <span className="font-medium text-sm">
                                    {interval.name || `${interval.type} ${index + 1}`}
                                  </span>
                                  {interval.equipment && EQUIPMENT_CONFIGS[interval.equipment] && (
                                    <span className="text-xs" title={EQUIPMENT_CONFIGS[interval.equipment].label}>
                                      {EQUIPMENT_CONFIGS[interval.equipment].icon}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateInterval(interval.id);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeInterval(interval.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  {getMetricDisplay()}
                                </Badge>
                                {interval.setConfig && interval.setConfig.numberOfSets > 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Repeat className="h-3 w-3 mr-1" />
                                    {interval.setConfig.numberOfSets}×{interval.setConfig.intervalsPerSet}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="col-span-2">
                      {(() => {
                        const activeInterval = activeIntervalId ? intervals.find(i => i.id === activeIntervalId) : null;
                        
                        if (activeInterval) {
                          return (
                            <EnhancedIntervalForm
                              key={activeInterval.id} // Add key to force re-render when switching intervals
                              interval={activeInterval}
                              onSave={(updated) => updateInterval(activeIntervalId, updated)}
                              onCancel={() => setActiveIntervalId(null)}
                            />
                          );
                        } else {
                          return (
                            <div className="text-center py-12 text-muted-foreground">
                              <p>Select an interval to edit</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Timeline Preview */}
                {intervals.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4">Timeline Preview</h4>
                    <IntervalTimelineEnhanced intervals={intervals} />
                  </div>
                )}
                    </div>
                  )}

                  {/* Cooldown Section */}
                  {activeSection === 'cooldown' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Cooldown Exercises</h3>
                        <Button
                          onClick={() => {
                            setCurrentPhase('cooldown');
                            setExerciseFilters({ phase: ['cooldown'] });
                            setShowExerciseSidebar(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </Button>
                      </div>
                      {cooldownExercises.length === 0 ? (
                        <div className="text-center py-8 bg-green-50/50 rounded-lg border-2 border-dashed border-green-200">
                          <p className="text-sm text-muted-foreground">
                            No cooldown exercises added yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cooldownExercises.map((exercise, index) => {
                            const exerciseData = libraryExercises.find(e => e.id === exercise.exerciseId);
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div>
                                  <h5 className="font-medium">{exerciseData?.name || 'Unknown Exercise'}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.sets} sets × {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration}s`}
                                    {exercise.restBetweenSets ? ` • ${exercise.restBetweenSets}s rest` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingExercise({exercise, phase: 'cooldown', index})}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExercise('cooldown', index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Assignment Tab - Context Aware (Normal vs Rotation Mode) */}
          <WorkoutTabContent value="assignment">
            <div className="p-6 space-y-6">
              {!rotationMode ? (
                // Normal Assignment Mode
                <>
                  {/* Enhanced Player Assignment with Equipment Capacity */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">Player Assignment</h3>
                      <p className="text-sm text-muted-foreground">
                        Select players or teams for this workout. Equipment capacity will be automatically managed.
                      </p>
                    </div>
                    
                    {/* Show all equipment types being used */}
                    {getUniqueEquipmentFromIntervals.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Equipment Used in Intervals:</div>
                        <div className="space-y-2">
                          {getUniqueEquipmentFromIntervals.map(equipmentType => {
                            const data = equipmentAvailability?.[equipmentType];
                            const isBottleneck = bottleneckEquipment.equipmentType === equipmentType;
                            return (
                              <div 
                                key={equipmentType} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg border",
                                  isBottleneck ? "border-primary bg-primary/5" : "border-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{EQUIPMENT_CONFIGS[equipmentType]?.icon}</span>
                                  <span className="text-sm font-medium">{EQUIPMENT_CONFIGS[equipmentType]?.label}</span>
                                  {isBottleneck && (
                                    <Badge variant="destructive" className="text-xs">Limiting Factor</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {data ? `${data.availableCount || 0}/${data.totalCount || 0} available` : 'Loading...'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {getUniqueEquipmentFromIntervals.length > 1 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Player capacity limited by {EQUIPMENT_CONFIGS[bottleneckEquipment.equipmentType]?.label} ({bottleneckEquipment.availableCapacity} available)
                          </p>
                        )}
                      </div>
                    )}
                    
                    <TeamPlayerSelector
                      selectedPlayers={schedule.participants.playerIds}
                      selectedTeams={schedule.participants.teamIds}
                      onPlayersChange={(playerIds) => setSchedule(prev => ({
                        ...prev,
                        participants: { ...prev.participants, playerIds }
                      }))}
                      onTeamsChange={(teamIds) => setSchedule(prev => ({
                        ...prev,
                        participants: { ...prev.participants, teamIds }
                      }))}
                      equipmentCapacity={bottleneckEquipment}
                      onCapacityExceeded={handleCapacityExceeded}
                      showTeams={true}
                      showMedical={true}
                      showFilters={true}
                      showSummary={true}
                      inline={true}
                      maxHeight={350}
                    />
                  </div>
                </>
              ) : (
                // Rotation Mode - Group Management
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Rotation Group Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Organize players into groups for rotation through different stations. First select players/teams above, then assign them to rotation groups.
                    </p>
                  </div>
                  
                  {/* Player Selection for Rotation Mode */}
                  {schedule.participants.playerIds.length === 0 && schedule.participants.teamIds.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-2">No Players Selected</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            First select players or teams using the selector below
                          </p>
                          
                          {/* Show all equipment types being used */}
                          {getUniqueEquipmentFromIntervals.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm font-medium mb-2">Equipment Used in Intervals:</div>
                              <div className="space-y-2">
                                {getUniqueEquipmentFromIntervals.map(equipmentType => {
                                  const data = equipmentAvailability?.[equipmentType];
                                  const isBottleneck = bottleneckEquipment.equipmentType === equipmentType;
                                  return (
                                    <div 
                                      key={equipmentType} 
                                      className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border",
                                        isBottleneck ? "border-primary bg-primary/5" : "border-muted"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{EQUIPMENT_CONFIGS[equipmentType]?.icon}</span>
                                        <span className="text-sm font-medium">{EQUIPMENT_CONFIGS[equipmentType]?.label}</span>
                                        {isBottleneck && (
                                          <Badge variant="destructive" className="text-xs">Limiting Factor</Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {data ? `${data.availableCount || 0}/${data.totalCount || 0} available` : 'Loading...'}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {getUniqueEquipmentFromIntervals.length > 1 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Player capacity limited by {EQUIPMENT_CONFIGS[bottleneckEquipment.equipmentType]?.label} ({bottleneckEquipment.availableCapacity} available)
                                </p>
                              )}
                            </div>
                          )}
                          
                          <TeamPlayerSelector
                            selectedPlayers={schedule.participants.playerIds}
                            selectedTeams={schedule.participants.teamIds}
                            onPlayersChange={(playerIds) => setSchedule(prev => ({
                              ...prev,
                              participants: { ...prev.participants, playerIds }
                            }))}
                            onTeamsChange={(teamIds) => setSchedule(prev => ({
                              ...prev,
                              participants: { ...prev.participants, teamIds }
                            }))}
                            equipmentCapacity={bottleneckEquipment}
                            onCapacityExceeded={handleCapacityExceeded}
                            showTeams={true}
                            showMedical={true}
                            showFilters={true}
                            showSummary={true}
                            inline={true}
                            maxHeight={250}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <React.Suspense fallback={
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    }>
                      <GroupManagement
                        groups={rotationSchedule?.groups || []}
                        availablePlayers={(() => {
                          // Get all players from selected teams and individual players
                          const allPlayers = playersData?.players || [];
                          const selectedPlayers = [];
                          
                          // Add individually selected players
                          schedule.participants.playerIds.forEach(playerId => {
                            const player = allPlayers.find((p: any) => p.id === playerId);
                            if (player) selectedPlayers.push(player);
                          });
                          
                          // Add players from selected teams
                          schedule.participants.teamIds.forEach(teamId => {
                            const teamPlayers = allPlayers.filter((p: any) => p.teamId === teamId);
                            teamPlayers.forEach(player => {
                              // Avoid duplicates
                              if (!selectedPlayers.find(p => p.id === player.id)) {
                                selectedPlayers.push(player);
                              }
                            });
                          });
                          
                          return selectedPlayers;
                        })()}
                        stations={rotationSchedule?.stations || []}
                        onUpdateGroup={updateGroup}
                        onAddGroup={addGroup}
                        onRemoveGroup={removeGroup}
                        onAutoGroup={autoGroupPlayers}
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={setSelectedGroupId}
                      />
                    </React.Suspense>
                  )}
                </>
              )}

              {/* Assignment Summary */}
              {(schedule.participants.playerIds.length > 0 || schedule.participants.teamIds.length > 0) && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">Current Assignment</h4>
                        <p className="text-sm text-blue-700">
                          {schedule.participants.playerIds.length > 0 && `${schedule.participants.playerIds.length} player(s)`}
                          {schedule.participants.playerIds.length > 0 && schedule.participants.teamIds.length > 0 && ' and '}
                          {schedule.participants.teamIds.length > 0 && `${schedule.participants.teamIds.length} team(s)`}
                          {' selected'}
                          {rotationMode && rotationSchedule && ` • ${rotationSchedule?.groups?.length || 0} rotation groups`}
                        </p>
                      </div>
                    </div>
                    {!rotationMode && schedule.startDate && (
                      <div className="text-sm text-blue-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(schedule.startDate, 'MMM d, yyyy')} at {schedule.startTime}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule Settings - Only in Normal Mode */}
              {!rotationMode && (
                <div>
                  <div className="mb-4">
                  <h3 className="text-lg font-semibold">Schedule Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Set when and where this workout will take place
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Session Timing Summary */}
                  {sessionTiming.requiresRotation && (
                    <Card className="p-4 border-orange-200 bg-orange-50/50">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900 mb-2">
                            Rotation Schedule Required
                          </h4>
                          <div className="space-y-2 text-sm text-orange-700">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium">Workout Duration:</span>
                                <span className="ml-2">{sessionTiming.workoutTime} minutes</span>
                              </div>
                              <div>
                                <span className="font-medium">Rotation Time:</span>
                                <span className="ml-2">{sessionTiming.rotationTime} minutes</span>
                              </div>
                              <div>
                                <span className="font-medium">Setup & Buffer:</span>
                                <span className="ml-2">{sessionTiming.setupTime + sessionTiming.buffer} minutes</span>
                              </div>
                              <div>
                                <span className="font-medium">Total Session:</span>
                                <span className="ml-2 font-bold">{sessionTiming.totalSessionTime} minutes</span>
                              </div>
                            </div>
                            {rotationSchedule && (
                              <div className="mt-2 pt-2 border-t border-orange-200">
                                <p className="text-xs">
                                  {generateRotationSummary(rotationSchedule, sessionTiming)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                  
                  <UnifiedScheduler
                    schedule={schedule}
                    onScheduleUpdate={setSchedule}
                    duration={sessionTiming.totalSessionTime}
                    title=""
                    description=""
                    showLocation={false}
                    showRecurrence={true}
                    showReminders={true}
                    showConflictCheck={true}
                    defaultLocation={sessionInfo.location || 'default-facility'}
                    collapsible={false}
                    variant="inline"
                  />
                  
                  {/* Custom Location Selector */}
                  <div className="mt-4">
                    <Label>Location</Label>
                    <Select
                      value={schedule.location || 'default-facility'}
                      onValueChange={(value) => {
                        setSchedule(prev => ({ ...prev, location: value }));
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select training facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACILITY_OPTIONS.map(facility => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equipment availability updates based on selected facility
                    </p>
                  </div>
                </div>
                  )}
                </div>
              )}

              {/* Medical Warnings */}
              {medicalReports && medicalReports.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Medical Considerations</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Some selected players have medical restrictions. The workout will be automatically adjusted for their safety.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WorkoutTabContent>

          {/* Preview Tab */}
          <WorkoutTabContent value="preview">
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Workout Preview</h3>
                  <p className="text-muted-foreground text-sm">
                    This is how the workout will appear to players
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{workoutName || 'Untitled Conditioning Workout'}</h2>
                      {description && (
                        <p className="text-muted-foreground mt-2">{description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                      </Badge>
                      {/* Show unique equipment types used */}
                      {Array.from(new Set(intervals.map(i => i.equipment).filter(Boolean))).map(eq => (
                        eq && EQUIPMENT_CONFIGS[eq] && (
                          <Badge key={eq} variant="secondary" className="text-sm">
                            <span className="mr-1">{EQUIPMENT_CONFIGS[eq].icon}</span>
                            {EQUIPMENT_CONFIGS[eq].label}
                          </Badge>
                        )
                      ))}
                      <Badge variant="secondary" className="text-sm">
                        {intervals.length} Intervals
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-sm",
                          getWorkoutDifficulty(intervals) === 'beginner' && "bg-green-100 text-green-700",
                          getWorkoutDifficulty(intervals) === 'intermediate' && "bg-yellow-100 text-yellow-700",
                          getWorkoutDifficulty(intervals) === 'advanced' && "bg-red-100 text-red-700"
                        )}
                      >
                        {getWorkoutDifficulty(intervals)}
                      </Badge>
                    </div>

                    {/* Full Workout Structure Preview */}
                    <div className="mt-6 space-y-6">
                      {/* Warm-up Section */}
                      {warmupExercises.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-yellow-700">Warm-up</h3>
                          <div className="space-y-2">
                            {warmupExercises.map((exercise, index) => {
                              const exerciseData = libraryExercises.find(e => e.id === exercise.exerciseId);
                              return (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 shadow-sm text-sm font-medium text-yellow-700">
                                    W{index + 1}
                                  </div>
                                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{exerciseData?.name || 'Unknown Exercise'}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {exercise.sets} × {exercise.reps ? `${exercise.reps}` : `${exercise.duration}s`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Main Intervals Section */}
                      <div>
                        <h3 className="font-semibold mb-3 text-red-700">Conditioning Intervals</h3>
                        <CollapsibleIntervalPreview intervals={intervals} />
                      </div>

                      {/* Rotation Schedule Summary */}
                      {rotationMode && rotationSchedule && rotationSchedule.stations.length > 0 && rotationSchedule.groups.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold mb-3 text-orange-700 flex items-center gap-2">
                            <RotateCw className="h-5 w-5" />
                            Rotation Schedule Summary
                          </h3>
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 space-y-4">
                            {/* Session Overview */}
                            <div className="text-sm space-y-1">
                              <div className="font-medium text-orange-900">Session Overview:</div>
                              <div className="text-orange-700">
                                • {rotationSchedule.groups.length} groups × {rotationSchedule.stations.length} stations
                              </div>
                              <div className="text-orange-700">
                                • {rotationSchedule.rotationDuration} min per station + {rotationSchedule.transitionTime} min transitions
                              </div>
                              <div className="text-orange-700 font-medium">
                                • Total session: {sessionTiming.totalSessionTime} minutes
                              </div>
                            </div>

                            {/* Group Rotation Timeline */}
                            <div className="space-y-3">
                              <div className="font-medium text-orange-900">Group Rotation Timeline:</div>
                              {rotationSchedule.groups.map((group, groupIndex) => {
                                let currentTime = 0;
                                const timeline = [];
                                
                                // Calculate rotation order for this group
                                for (let rotation = 0; rotation < rotationSchedule.stations.length; rotation++) {
                                  const stationIndex = (groupIndex + rotation) % rotationSchedule.stations.length;
                                  const station = rotationSchedule.stations[stationIndex];
                                  
                                  if (station) {
                                    const startTime = currentTime;
                                    const endTime = currentTime + rotationSchedule.rotationDuration;
                                    
                                    timeline.push({
                                      station,
                                      startTime,
                                      endTime,
                                      isTransition: false
                                    });
                                    
                                    currentTime = endTime;
                                    
                                    // Add transition if not last rotation
                                    if (rotation < rotationSchedule.stations.length - 1) {
                                      timeline.push({
                                        station: null,
                                        startTime: currentTime,
                                        endTime: currentTime + rotationSchedule.transitionTime,
                                        isTransition: true
                                      });
                                      currentTime += rotationSchedule.transitionTime;
                                    }
                                  }
                                }
                                
                                return (
                                  <div key={group.id} className="bg-white rounded-lg p-3 border border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                        style={{ backgroundColor: group.color }}
                                      >
                                        {groupIndex + 1}
                                      </div>
                                      <span className="font-medium text-sm">{group.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({group.players.length} players)
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      {timeline.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <span className="text-muted-foreground w-16">
                                            {Math.floor(item.startTime)}:{(item.startTime % 1 * 60).toString().padStart(2, '0')} - 
                                            {Math.floor(item.endTime)}:{(item.endTime % 1 * 60).toString().padStart(2, '0')}
                                          </span>
                                          {item.isTransition ? (
                                            <span className="text-orange-600 italic">→ Transition</span>
                                          ) : (
                                            <span className="flex items-center gap-1">
                                              <span>{EQUIPMENT_CONFIGS[item.station.equipment].icon}</span>
                                              <span className="font-medium">{item.station.name}</span>
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Equipment Distribution */}
                            <div className="text-sm space-y-1 pt-2 border-t border-orange-200">
                              <div className="font-medium text-orange-900">Equipment Usage:</div>
                              {rotationSchedule.stations.map((station, index) => (
                                <div key={station.id} className="text-orange-700 flex items-center gap-2">
                                  <span>{EQUIPMENT_CONFIGS[station.equipment].icon}</span>
                                  <span>{station.name}: {station.capacity} players at a time</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cooldown Section */}
                      {cooldownExercises.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-green-700">Cooldown</h3>
                          <div className="space-y-2">
                            {cooldownExercises.map((exercise, index) => {
                              const exerciseData = libraryExercises.find(e => e.id === exercise.exerciseId);
                              return (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 shadow-sm text-sm font-medium text-green-700">
                                    C{index + 1}
                                  </div>
                                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-green-200">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{exerciseData?.name || 'Unknown Exercise'}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {exercise.sets} × {exercise.reps ? `${exercise.reps}` : `${exercise.duration}s`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Templates Tab */}
          <WorkoutTabContent value="templates">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Workout Templates</h3>
                <p className="text-muted-foreground text-sm">
                  Select a pre-built template to get started quickly
                </p>
              </div>
              <IntervalTemplates
                onSelectTemplate={handleTemplateSelect}
                currentEquipment={WorkoutEquipmentType.ROWING}
              />
            </div>
          </WorkoutTabContent>
        </WorkoutBuilderLayout>
      </div>

      {/* Exercise Edit Modal */}
      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise.exercise}
          exerciseName={libraryExercises.find(e => e.id === editingExercise.exercise.exerciseId)?.name || 'Unknown Exercise'}
          isOpen={true}
          onClose={() => setEditingExercise(null)}
          onSave={(updated) => {
            if (editingExercise.phase === 'warmup') {
              const newExercises = [...warmupExercises];
              newExercises[editingExercise.index] = updated;
              setWarmupExercises(newExercises);
            } else {
              const newExercises = [...cooldownExercises];
              newExercises[editingExercise.index] = updated;
              setCooldownExercises(newExercises);
            }
            setEditingExercise(null);
          }}
        />
      )}
      
      {/* Save as Template Modal */}
      <SaveAsTemplateModal
        isOpen={showSaveAsTemplateModal}
        onClose={() => setShowSaveAsTemplateModal(false)}
        onSave={handleSaveAsTemplate}
        intervalProgram={{
          id: workoutId || `program-${Date.now()}`,
          name: workoutName || 'Untitled Workout',
          description: description || '',
          equipment: intervals.length > 0 ? intervals[0].equipment : WorkoutEquipmentType.ROWING,
          intervals: intervals,
          totalDuration: intervals.reduce((sum, i) => sum + i.duration, 0),
          estimatedCalories: Math.round(intervals.reduce((sum, i) => sum + i.duration, 0) / 60 * 12),
          tags: ['conditioning'],
          difficulty: 'intermediate'
        }}
      />
    </div>
  );
}

export default function ConditioningWorkoutBuilderSimple(props: ConditioningWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="conditioning"
      onReset={() => {
        console.log('Enhanced conditioning workout builder reset after error');
      }}
    >
      <ConditioningWorkoutBuilderSimpleInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}