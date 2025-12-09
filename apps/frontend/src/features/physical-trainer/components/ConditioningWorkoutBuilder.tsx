'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Plus,
  Save,
  X,
  Activity,
  Zap,
  Heart,
  Timer,
  TrendingUp,
  AlertTriangle,
  Copy,
  Trash2,
  Users
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useCreateConditioningWorkoutMutation } from '@/store/api/trainingApi';
import { useSaveWorkflow } from '../hooks/useSaveWorkflow';
import { useBulkSession, type BulkSessionConfig } from '../hooks/useBulkSession';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import { WorkoutSuccessModal } from './shared/WorkoutSuccessModal';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { BulkConfigurationPanel } from './shared/BulkConfigurationPanel';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { WorkoutType } from '../types';
import type { 
  IntervalProgram, 
  IntervalSet, 
  WorkoutTemplate,
  PlayerTestResult,
  ConditioningMode
} from '../types/conditioning.types';
import { 
  WorkoutEquipmentType, 
  EQUIPMENT_CONFIGS,
  CONDITIONING_MODE_CONFIGS,
  getEquipmentForMode,
  getModeConfig,
  getDefaultEquipmentForMode,
  isEquipmentValidForMode
} from '../types/conditioning.types';
import EnhancedIntervalForm from './conditioning/EnhancedIntervalForm';
import IntervalTimeline from './conditioning/IntervalTimeline';
import EquipmentSelector from './conditioning/EquipmentSelector';
import WorkoutTemplateLibrary from './conditioning/WorkoutTemplateLibrary';
import TestBasedTargets from './conditioning/TestBasedTargets';
import WorkoutSummary from './conditioning/WorkoutSummary';
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../hooks/useAutoSave';

interface ConditioningWorkoutBuilderProps {
  onSave?: (program: IntervalProgram) => void;
  onCancel: () => void;
  initialProgram?: IntervalProgram;
  playerTests?: PlayerTestResult[];
  selectedPlayers?: string[];
  teamId?: string;
  scheduledDate?: Date;
  location?: string;
}

function ConditioningWorkoutBuilderInternal({
  onSave,
  onCancel,
  initialProgram,
  playerTests = [],
  selectedPlayers = [],
  teamId = 'team-001',
  scheduledDate = new Date(),
  location = 'Training Center'
}: ConditioningWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [createConditioningWorkout, { isLoading }] = useCreateConditioningWorkoutMutation();
  
  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  
  // State management - declare all state first
  const [activeTab, setActiveTab] = useState<'build' | 'templates' | 'personalize'>('build');
  const [selectedMode, setSelectedMode] = useState<ConditioningMode>(
    initialProgram?.mode || 'conditioning'
  );
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(
    initialProgram?.equipment || getDefaultEquipmentForMode(initialProgram?.mode || 'conditioning')
  );
  const [intervals, setIntervals] = useState<IntervalSet[]>(
    initialProgram?.intervals || []
  );
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [editingInterval, setEditingInterval] = useState<IntervalSet | null>(null);
  const [activeIntervalId, setActiveIntervalId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  
  // Player/Team state for both single and bulk modes
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>(selectedPlayers);
  const [assignedTeamIds, setAssignedTeamIds] = useState<string[]>(teamId ? [teamId] : []);

  // Calculate total duration and metrics
  const totalDuration = useMemo(() => {
    return intervals.reduce((sum, interval) => sum + interval.duration, 0);
  }, [intervals]);

  const estimatedCalories = useMemo(() => {
    return intervals.reduce((sum, interval) => {
      const minuteDuration = interval.duration / 60;
      const baseCaloriesPerMinute = interval.type === 'work' ? 12 : 
                                   interval.type === 'rest' ? 4 : 
                                   interval.type === 'warmup' || interval.type === 'cooldown' ? 6 : 5;
      return sum + (minuteDuration * baseCaloriesPerMinute);
    }, 0);
  }, [intervals]);

  const zoneDistribution = useMemo(() => {
    const zoneTime = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    const modeConfig = getModeConfig(selectedMode);
    
    intervals.forEach(interval => {
      if (interval.targetMetrics.heartRate?.type === 'percentage') {
        const percentage = typeof interval.targetMetrics.heartRate.value === 'number' 
          ? interval.targetMetrics.heartRate.value 
          : interval.targetMetrics.heartRate.value.min;
        
        // Use Garmin zone boundaries
        if (percentage < 60) zoneTime.zone1 += interval.duration;
        else if (percentage < 70) zoneTime.zone2 += interval.duration;
        else if (percentage < 80) zoneTime.zone3 += interval.duration;
        else if (percentage < 90) zoneTime.zone4 += interval.duration;
        else zoneTime.zone5 += interval.duration;
      } else if (interval.targetMetrics.heartRateZone) {
        // Direct zone assignment
        const zone = interval.targetMetrics.heartRateZone;
        if (zone === 1) zoneTime.zone1 += interval.duration;
        else if (zone === 2) zoneTime.zone2 += interval.duration;
        else if (zone === 3) zoneTime.zone3 += interval.duration;
        else if (zone === 4) zoneTime.zone4 += interval.duration;
        else if (zone === 5) zoneTime.zone5 += interval.duration;
      } else {
        // Default distribution based on interval type and mode
        if (interval.type === 'rest' || interval.type === 'cooldown') {
          if (selectedMode === 'recovery') zoneTime.zone1 += interval.duration;
          else zoneTime.zone2 += interval.duration;
        } else if (interval.type === 'warmup') {
          if (selectedMode === 'recovery') zoneTime.zone1 += interval.duration;
          else zoneTime.zone2 += interval.duration;
        } else if (interval.type === 'work') {
          // Default work zones based on mode
          if (selectedMode === 'recovery') zoneTime.zone2 += interval.duration;
          else if (selectedMode === 'sprint') zoneTime.zone5 += interval.duration;
          else zoneTime.zone4 += interval.duration; // conditioning default
        }
      }
    });
    
    const total = totalDuration || 1;
    return {
      zone1: Math.round((zoneTime.zone1 / total) * 100),
      zone2: Math.round((zoneTime.zone2 / total) * 100),
      zone3: Math.round((zoneTime.zone3 / total) * 100),
      zone4: Math.round((zoneTime.zone4 / total) * 100),
      zone5: Math.round((zoneTime.zone5 / total) * 100),
    };
  }, [intervals, totalDuration, selectedMode]);

  // Create the current interval program for bulk sessions
  const currentIntervalProgram: IntervalProgram = useMemo(() => ({
    id: initialProgram?.id || `program-${Date.now()}`,
    name: programName,
    description: programDescription,
    mode: selectedMode,
    equipment: selectedEquipment,
    intervals,
    totalDuration,
    estimatedCalories: Math.round(estimatedCalories),
    targetZones: zoneDistribution,
    tags: [],
    difficulty: 'intermediate'
  }), [programName, programDescription, selectedMode, selectedEquipment, intervals, totalDuration, estimatedCalories, zoneDistribution, initialProgram?.id]);

  // Bulk session hook
  const bulkSession = useBulkSession({
    workoutType: 'conditioning',
    baseWorkout: currentIntervalProgram,
    onComplete: async (config: BulkSessionConfig<IntervalProgram>) => {
      // Handle bulk session creation
      await handleBulkSave(config);
    },
    initialConfig: {
      numberOfSessions: 2,
      sessionDate: scheduledDate.toISOString().split('T')[0],
      sessionTime: '10:00',
      duration: Math.round(totalDuration / 60) || 60,
    }
  });

  // Auto-save functionality
  const autoSaveKey = `workout_builder_autosave_conditioning_${teamId}_${scheduledDate.toISOString()}`;
  const { getSavedData, clearSavedData, hasAutoSave } = useAutoSave({
    key: autoSaveKey,
    data: {
      programName,
      programDescription,
      selectedMode,
      intervals,
      selectedEquipment,
      activeTab,
      selectedTemplate,
      bulkMode,
      assignedPlayerIds,
      assignedTeamIds
    },
    enabled: true,
    delay: 2000,
    onRestore: (data) => {
      setProgramName(data.programName || '');
      setProgramDescription(data.programDescription || '');
      setSelectedMode(data.selectedMode || 'conditioning');
      setIntervals(data.intervals || []);
      setSelectedEquipment(data.selectedEquipment || getDefaultEquipmentForMode(data.selectedMode || 'conditioning'));
      setActiveTab(data.activeTab || 'build');
      setSelectedTemplate(data.selectedTemplate || null);
      setBulkMode(data.bulkMode || false);
      setAssignedPlayerIds(data.assignedPlayerIds || selectedPlayers);
      setAssignedTeamIds(data.assignedTeamIds || (teamId ? [teamId] : []));
      toast.success(t('physicalTrainer:conditioning.autoSaveRestored'));
    }
  });

  // Save workflow integration - now all variables are defined
  const saveWorkflow = useSaveWorkflow({
    workoutType: WorkoutType.CONDITIONING,
    workoutData: {
      name: programName,
      description: programDescription,
      intervalProgram: {
        id: initialProgram?.id || `program-${Date.now()}`,
        name: programName,
        description: programDescription,
        mode: selectedMode,
        equipment: selectedEquipment,
        intervals,
        totalDuration,
        estimatedCalories: Math.round(estimatedCalories),
        targetZones: zoneDistribution,
        tags: [],
        difficulty: 'intermediate'
      },
      date: scheduledDate.toISOString(),
      location,
      duration: Math.round(totalDuration / 60)
    },
    playerAssignments: {
      players: assignedPlayerIds,
      teams: assignedTeamIds
    },
    onSaveSuccess: (result) => {
      clearSavedData();
      toast.success(t('physicalTrainer:conditioning.createSuccess'));
    },
    onSaveError: (error) => {
      console.error('Failed to save conditioning workout:', error);
      toast.error(t('physicalTrainer:conditioning.saveError'));
    }
  });

  // Function to expand intervals based on set configuration
  const expandIntervalsFromSetConfig = (baseInterval: IntervalSet): IntervalSet[] => {
    if (!baseInterval.setConfig) return [baseInterval];
    
    const { numberOfSets, intervalsPerSet, restBetweenIntervals, restBetweenSets } = baseInterval.setConfig;
    const expandedIntervals: IntervalSet[] = [];
    
    for (let setIndex = 0; setIndex < numberOfSets; setIndex++) {
      for (let intervalIndex = 0; intervalIndex < intervalsPerSet; intervalIndex++) {
        // Add the work interval
        expandedIntervals.push({
          ...baseInterval,
          id: `${baseInterval.id}-set${setIndex + 1}-interval${intervalIndex + 1}`,
          name: `${baseInterval.name || 'Interval'} - Set ${setIndex + 1}/${numberOfSets} - Rep ${intervalIndex + 1}/${intervalsPerSet}`,
          sourceIntervalId: baseInterval.id,
          setConfig: undefined // Remove set config from expanded intervals
        });
        
        // Add rest between intervals (except after last interval in set)
        if (intervalIndex < intervalsPerSet - 1 && restBetweenIntervals > 0) {
          expandedIntervals.push({
            id: `${baseInterval.id}-set${setIndex + 1}-rest${intervalIndex + 1}`,
            type: 'rest',
            name: `Rest between intervals`,
            duration: restBetweenIntervals,
            targetType: 'time',
            equipment: baseInterval.equipment,
            targetMetrics: {},
            color: '#3b82f6',
            sourceIntervalId: baseInterval.id
          });
        }
      }
      
      // Add rest between sets (except after last set)
      if (setIndex < numberOfSets - 1 && restBetweenSets > 0) {
        expandedIntervals.push({
          id: `${baseInterval.id}-set${setIndex + 1}-setrest`,
          type: 'rest',
          name: `Rest between sets`,
          duration: restBetweenSets,
          targetType: 'time',
          equipment: baseInterval.equipment,
          targetMetrics: {},
          color: '#6366f1',
          sourceIntervalId: baseInterval.id
        });
      }
    }
    
    return expandedIntervals;
  };

  // Check for auto-save on mount
  useEffect(() => {
    const handleRestoreEvent = (event: CustomEvent) => {
      if (event.detail?.workoutType === 'conditioning') {
        const data = event.detail.data;
        if (data) {
          setProgramName(data.programName || '');
          setProgramDescription(data.programDescription || '');
          setIntervals(data.intervals || []);
          setSelectedEquipment(data.selectedEquipment || WorkoutEquipmentType.ROWING);
          setActiveTab(data.activeTab || 'build');
          setSelectedTemplate(data.selectedTemplate || null);
        }
      }
    };

    window.addEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    return () => {
      window.removeEventListener('restoreAutoSave', handleRestoreEvent as EventListener);
    };
  }, []);


  // Handlers
  const handleAddInterval = useCallback(() => {
    const modeConfig = getModeConfig(selectedMode);
    
    // Mode-specific defaults
    let defaultDuration, defaultTargetMetrics, defaultType: IntervalType;
    
    if (selectedMode === 'recovery') {
      defaultDuration = 600; // 10 minutes
      defaultType = 'work';
      defaultTargetMetrics = {
        heartRateZone: 2, // Zone 2 - Easy
        rpe: 3
      };
    } else if (selectedMode === 'sprint') {
      defaultDuration = 20; // 20 seconds
      defaultType = 'work';
      defaultTargetMetrics = {
        heartRateZone: 5, // Zone 5 - Maximum
        speed: { type: 'percentage' as const, value: 90, reference: 'max_speed' as const }
      };
    } else {
      // conditioning default
      defaultDuration = 60; // 1 minute
      defaultType = 'work';
      defaultTargetMetrics = {
        heartRateZone: 4, // Zone 4 - Threshold
        pace: { type: 'percentage' as const, value: 75, reference: 'threshold_hr' as const }
      };
    }
    
    const newInterval: IntervalSet = {
      id: `interval-${Date.now()}`,
      type: defaultType,
      duration: defaultDuration,
      equipment: selectedEquipment,
      targetMetrics: defaultTargetMetrics,
      color: modeConfig.color
    };
    setIntervals([...intervals, newInterval]);
    setEditingInterval(newInterval);
  }, [intervals, selectedEquipment, selectedMode]);

  const handleUpdateInterval = useCallback((interval: IntervalSet) => {
    // If interval has set configuration, expand it into multiple intervals
    if (interval.setConfig) {
      const expandedIntervals = expandIntervalsFromSetConfig(interval);
      // Replace the original interval with expanded intervals
      const intervalIndex = intervals.findIndex(i => i.id === interval.id);
      const newIntervals = [...intervals];
      newIntervals.splice(intervalIndex, 1, ...expandedIntervals);
      setIntervals(newIntervals);
    } else {
      setIntervals(intervals.map(i => i.id === interval.id ? interval : i));
    }
    setEditingInterval(null);
  }, [intervals]);

  const handleDeleteInterval = useCallback((intervalId: string) => {
    setIntervals(intervals.filter(i => i.id !== intervalId));
  }, [intervals]);

  const handleDuplicateInterval = useCallback((interval: IntervalSet) => {
    const newInterval = {
      ...interval,
      id: `interval-${Date.now()}`
    };
    const index = intervals.findIndex(i => i.id === interval.id);
    const newIntervals = [...intervals];
    newIntervals.splice(index + 1, 0, newInterval);
    setIntervals(newIntervals);
  }, [intervals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIntervalId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = intervals.findIndex(i => i.id === active.id);
      const newIndex = intervals.findIndex(i => i.id === over.id);
      setIntervals(arrayMove(intervals, oldIndex, newIndex));
    }
    
    setActiveIntervalId(null);
  };

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setIntervals(template.intervalProgram.intervals);
    setProgramName(template.name);
    setProgramDescription(template.description);
    if (template.mode) {
      setSelectedMode(template.mode);
    }
    setSelectedEquipment(template.intervalProgram.equipment);
    setActiveTab('build');
  };

  // Handle mode changes and update equipment accordingly
  const handleModeChange = useCallback((mode: ConditioningMode) => {
    setSelectedMode(mode);
    
    // Check if current equipment is valid for new mode
    if (!isEquipmentValidForMode(selectedEquipment, mode)) {
      // Switch to default equipment for this mode
      setSelectedEquipment(getDefaultEquipmentForMode(mode));
      toast.info(t('physicalTrainer:conditioning.modeChanged', { mode: getModeConfig(mode).name }));
    }
    
    // Clear intervals when switching modes as they may not be appropriate
    if (intervals.length > 0) {
      setIntervals([]);
      toast.info(t('physicalTrainer:conditioning.intervalsCleared'));
    }
  }, [selectedEquipment, intervals.length, t]);

  // Handle bulk save
  const handleBulkSave = async (config: BulkSessionConfig<IntervalProgram>) => {
    try {
      // Create multiple sessions based on the bulk configuration
      const results = [];
      
      for (const session of config.sessions) {
        // Create individual conditioning workout for each session
        const sessionProgram: IntervalProgram = {
          ...currentIntervalProgram,
          id: `${currentIntervalProgram.id}-${session.id}`,
          name: session.name || `${programName} - Session ${results.length + 1}`,
          description: session.notes ? `${programDescription}\n\n${session.notes}` : programDescription
        };
        
        // Mock API call - in real implementation, would call actual API
        const result = await createConditioningWorkout({
          program: sessionProgram,
          playerIds: session.playerIds,
          teamIds: session.teamIds,
          date: config.sessionDate,
          time: session.startTime || config.sessionTime,
          location: config.facilityId,
          duration: config.duration
        }).unwrap();
        
        results.push(result);
      }
      
      clearSavedData();
      toast.success(`Successfully created ${results.length} conditioning sessions!`);
      return results;
    } catch (error) {
      console.error('Failed to create bulk sessions:', error);
      toast.error('Failed to create bulk sessions. Please try again.');
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      // Check if we're in bulk mode
      if (bulkMode && bulkSession.canProceed) {
        await bulkSession.complete();
        return;
      }
      
      // If onSave prop is provided, use it for legacy compatibility
      if (onSave) {
        onSave(currentIntervalProgram);
        return;
      }
      
      // Use the new save workflow for single sessions
      const result = await saveWorkflow.save();
      if (result?.success) {
        // Clear auto-save data on successful save
        clearSavedData();
        
        // Show success message
        toast.success(t('physicalTrainer:conditioning.saveSuccess'));
        
        // Close the builder on success
        onCancel();
      }
    } catch (error) {
      console.error('Failed to save conditioning workout:', error);
      toast.error(t('physicalTrainer:conditioning.saveError'));
    }
  };
  
  // Handle bulk mode toggle
  const handleBulkToggle = useCallback((enabled: boolean) => {
    setBulkMode(enabled);
    if (enabled) {
      setShowBulkPanel(true);
      // When enabling bulk mode, ensure we have some basic configuration
      if (!bulkSession.config.facilityId) {
        bulkSession.updateConfig({
          facilityId: 'default-facility',
          sessionDate: scheduledDate.toISOString().split('T')[0],
          sessionTime: '10:00',
          duration: Math.round(totalDuration / 60) || 60
        });
      }
    } else {
      setShowBulkPanel(false);
      // Reset bulk session when disabling
      bulkSession.reset();
    }
  }, [bulkSession, scheduledDate, totalDuration]);

  // Validation logic
  const isValid = useMemo(() => {
    const basicValid = programName && intervals.length > 0;
    
    if (bulkMode) {
      // In bulk mode, also check if bulk configuration is valid
      return basicValid && bulkSession.canProceed;
    }
    
    return basicValid;
  }, [programName, intervals.length, bulkMode, bulkSession.canProceed]);
  
  const isSaving = isLoading || saveWorkflow.isSaving || bulkSession.isLoading;
  const showProgress = saveWorkflow.isSaving || saveWorkflow.isValidating || bulkSession.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Header with Bulk Mode Support */}
      <WorkoutBuilderHeader
        title={t('physicalTrainer:conditioning.builder.title')}
        workoutType="conditioning"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        supportsBulkMode={true}
        bulkMode={bulkMode}
        onBulkToggle={handleBulkToggle}
        bulkConfig={bulkSession.config}
        showAutoSave={hasAutoSave}
      />
      
      {/* Workout Metrics Bar */}
      <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 border-b">
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Clock className="h-4 w-4 mr-2" />
          {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
        </Badge>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Zap className="h-4 w-4 mr-2" />
          ~{Math.round(estimatedCalories)} cal
        </Badge>
        {bulkMode && bulkSession.config && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Copy className="h-4 w-4 mr-2" />
            {bulkSession.config.numberOfSessions} sessions
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.build')}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.templates')}
            </TabsTrigger>
            <TabsTrigger value="personalize" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('physicalTrainer:conditioning.tabs.personalize')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="h-full p-4">
            <div className="grid grid-cols-5 gap-6 h-full">
              {/* Left Column - Workout Details & Timeline (40%) */}
              <div className="col-span-2 space-y-4 h-full overflow-y-auto pr-2">
                {/* Bulk Configuration Panel */}
                {bulkMode && (
                  <BulkConfigurationPanel
                    workoutType="conditioning"
                    baseWorkout={currentIntervalProgram}
                    onComplete={bulkSession.complete}
                    onCancel={() => setBulkMode(false)}
                    isOpen={showBulkPanel}
                    onToggle={setShowBulkPanel}
                    enablePlayerDistribution={true}
                    showAdvancedOptions={true}
                    maxSessions={6}
                    minSessions={2}
                  />
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:conditioning.details.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('physicalTrainer:conditioning.details.name')}
                      </label>
                      <input
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder={t('physicalTrainer:conditioning.details.namePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('physicalTrainer:conditioning.details.description')}
                      </label>
                      <textarea
                        value={programDescription}
                        onChange={(e) => setProgramDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        placeholder={t('physicalTrainer:conditioning.details.descriptionPlaceholder')}
                      />
                    </div>

                    {/* Mode Selector */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('physicalTrainer:conditioning.details.mode')}
                      </label>
                      <Select value={selectedMode} onValueChange={handleModeChange}>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span style={{ color: getModeConfig(selectedMode).color }}>
                                {getModeConfig(selectedMode).icon}
                              </span>
                              {t(`physicalTrainer:conditioning.modes.${selectedMode}.name`)}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CONDITIONING_MODE_CONFIGS).map((config) => (
                            <SelectItem key={config.mode} value={config.mode}>
                              <div className="flex items-center gap-3 p-2">
                                <span style={{ color: config.color }} className="text-lg">{config.icon}</span>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{t(`physicalTrainer:conditioning.modes.${config.mode}.name`)}</span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs"
                                      style={{ borderColor: config.color, color: config.color }}
                                    >
                                      {t(`physicalTrainer:conditioning.modes.${config.mode}.intensityRange`)}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {t(`physicalTrainer:conditioning.modes.${config.mode}.longDescription`)}
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-1">
                                    {t(`physicalTrainer:conditioning.modes.${config.mode}.preferredZones`)}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <EquipmentSelector
                      selected={selectedEquipment}
                      onChange={setSelectedEquipment}
                      mode={selectedMode}
                    />
                  </CardContent>
                </Card>
                
                {/* Player/Team Assignment Section */}
                {!bulkMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Player Assignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PlayerTeamAssignment
                        selectedPlayers={assignedPlayerIds}
                        selectedTeams={assignedTeamIds}
                        onPlayersChange={setAssignedPlayerIds}
                        onTeamsChange={setAssignedTeamIds}
                        showTeams={true}
                        showMedical={true}
                        showFilters={true}
                        showSummary={true}
                        title="Assign to Players & Teams"
                        description="Select individual players or entire teams for this conditioning session."
                        inline={true}
                        maxHeight={300}
                      />
                    </CardContent>
                  </Card>
                )}

                <WorkoutSummary
                  totalDuration={totalDuration}
                  estimatedCalories={Math.round(estimatedCalories)}
                  zoneDistribution={zoneDistribution}
                  intervals={intervals}
                />

                {/* Timeline - Now in left column */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t('physicalTrainer:conditioning.timeline.title')}</CardTitle>
                      <Button size="sm" onClick={handleAddInterval}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('physicalTrainer:conditioning.timeline.addInterval')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {intervals.length > 0 ? (
                      <DndContext
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={intervals.map(i => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <ScrollArea className="h-[400px] pr-2">
                            <IntervalTimeline
                              intervals={intervals}
                              onEdit={setEditingInterval}
                              onDelete={handleDeleteInterval}
                              onDuplicate={handleDuplicateInterval}
                              equipment={selectedEquipment}
                            />
                          </ScrollArea>
                        </SortableContext>
                        <DragOverlay>
                          {activeIntervalId && (
                            <Card className="shadow-lg">
                              <CardContent className="p-2">
                                <div className="text-sm font-medium">
                                  {intervals.find(i => i.id === activeIntervalId)?.name || 'Interval'}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </DragOverlay>
                      </DndContext>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Timer className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">
                          No intervals yet
                        </p>
                        <Button size="sm" variant="outline" onClick={handleAddInterval}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Interval
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Interval Editor (60%) */}
              <div className="col-span-3 h-full">
                {editingInterval ? (
                  <EnhancedIntervalForm
                    interval={editingInterval}
                    equipment={selectedEquipment}
                    mode={selectedMode}
                    onSave={handleUpdateInterval}
                    onCancel={() => setEditingInterval(null)}
                    playerTests={playerTests}
                    selectedPlayers={selectedPlayers}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center space-y-4 p-8">
                      <div className="rounded-full bg-muted p-6 w-24 h-24 mx-auto flex items-center justify-center">
                        <Activity className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">No Interval Selected</h3>
                        <p className="text-muted-foreground">
                          {t('physicalTrainer:conditioning.editor.selectInterval')}
                        </p>
                      </div>
                      {intervals.length === 0 && (
                        <div className="pt-4">
                          <Button onClick={handleAddInterval} size="lg">
                            <Plus className="h-5 w-5 mr-2" />
                            Add Your First Interval
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="h-full p-4">
            <WorkoutTemplateLibrary
              onSelect={handleTemplateSelect}
              equipment={selectedEquipment}
              mode={selectedMode}
            />
          </TabsContent>

          <TabsContent value="personalize" className="h-full p-4">
            <TestBasedTargets
              intervals={intervals}
              playerTests={playerTests}
              selectedPlayers={selectedPlayers}
              onUpdateIntervals={setIntervals}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Progress */}
      {showProgress && (
        <div className="mx-4 mb-4">
          <SaveWorkflowProgress
            workflow={saveWorkflow}
            onRetry={saveWorkflow.retry}
            onCancel={() => saveWorkflow.reset()}
          />
        </div>
      )}

      {/* Warnings */}
      {intervals.length === 0 && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:conditioning.warnings.noIntervals')}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Modal */}
      {saveWorkflow.successModalProps && (
        <WorkoutSuccessModal
          isOpen={saveWorkflow.isSuccessModalOpen}
          onClose={saveWorkflow.closeSuccessModal}
          workoutType={WorkoutType.CONDITIONING}
          workoutName={programName}
          playerCount={assignedPlayerIds.length}
          teamCount={assignedTeamIds.length}
          duration={Math.round(totalDuration / 60)}
          exerciseCount={intervals.length}
          onSchedule={saveWorkflow.successModalProps.onSchedule}
          onCreateAnother={() => {
            saveWorkflow.reset();
            // Reset form state
            setProgramName('');
            setProgramDescription('');
            setIntervals([]);
            setSelectedMode('conditioning');
            setSelectedEquipment(WorkoutEquipmentType.ROWING);
            setAssignedPlayerIds([]);
            setAssignedTeamIds([]);
            setBulkMode(false);
            setShowBulkPanel(false);
            if (bulkSession) {
              bulkSession.reset();
            }
          }}
          onCreateTemplate={() => {
            toast.success('Template creation feature coming soon!');
          }}
          onViewWorkout={saveWorkflow.successModalProps.onViewDetails}
          onNotifyPlayers={() => {
            toast.success('Player notification sent!');
          }}
        />
      )}
    </div>
  );
}

// Export with error boundary wrapper
export default function ConditioningWorkoutBuilder(props: ConditioningWorkoutBuilderProps) {
  return (
    <WorkoutBuilderErrorBoundary 
      workoutType="conditioning"
      sessionId={props.initialProgram?.id}
      onReset={() => {
        // Optional: Add any cleanup logic here
        console.log('Conditioning workout builder reset after error');
      }}
    >
      <ConditioningWorkoutBuilderInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}