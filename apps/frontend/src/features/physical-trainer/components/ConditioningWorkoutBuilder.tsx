'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useCreateConditioningWorkoutMutation } from '@/store/api/trainingApi';
import type { 
  IntervalProgram, 
  IntervalSet, 
  WorkoutEquipmentType,
  WorkoutTemplate,
  PlayerTestResult
} from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';
import IntervalForm from './conditioning/IntervalForm';
import IntervalTimeline from './conditioning/IntervalTimeline';
import EquipmentSelector from './conditioning/EquipmentSelector';
import WorkoutTemplateLibrary from './conditioning/WorkoutTemplateLibrary';
import TestBasedTargets from './conditioning/TestBasedTargets';
import WorkoutSummary from './conditioning/WorkoutSummary';

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

export default function ConditioningWorkoutBuilder({
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
  
  // State management
  const [activeTab, setActiveTab] = useState<'build' | 'templates' | 'personalize'>('build');
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(
    initialProgram?.equipment || WorkoutEquipmentType.ROWING
  );
  const [intervals, setIntervals] = useState<IntervalSet[]>(
    initialProgram?.intervals || []
  );
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [editingInterval, setEditingInterval] = useState<IntervalSet | null>(null);
  const [activeIntervalId, setActiveIntervalId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  // Calculate total duration and metrics
  const totalDuration = useMemo(() => {
    return intervals.reduce((sum, interval) => sum + interval.duration, 0);
  }, [intervals]);

  const estimatedCalories = useMemo(() => {
    // Simple estimation based on duration and intensity
    return intervals.reduce((sum, interval) => {
      const minuteDuration = interval.duration / 60;
      const baseCaloriesPerMinute = interval.type === 'work' ? 12 : 
                                   interval.type === 'rest' ? 4 : 
                                   interval.type === 'warmup' || interval.type === 'cooldown' ? 6 : 5;
      return sum + (minuteDuration * baseCaloriesPerMinute);
    }, 0);
  }, [intervals]);

  const zoneDistribution = useMemo(() => {
    // Calculate approximate time in each heart rate zone
    const zoneTime = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    intervals.forEach(interval => {
      if (interval.targetMetrics.heartRate?.type === 'percentage') {
        const percentage = interval.targetMetrics.heartRate.value;
        if (percentage < 60) zoneTime.zone1 += interval.duration;
        else if (percentage < 70) zoneTime.zone2 += interval.duration;
        else if (percentage < 80) zoneTime.zone3 += interval.duration;
        else if (percentage < 90) zoneTime.zone4 += interval.duration;
        else zoneTime.zone5 += interval.duration;
      }
    });
    
    const total = totalDuration || 1; // Avoid division by zero
    return {
      zone1: Math.round((zoneTime.zone1 / total) * 100),
      zone2: Math.round((zoneTime.zone2 / total) * 100),
      zone3: Math.round((zoneTime.zone3 / total) * 100),
      zone4: Math.round((zoneTime.zone4 / total) * 100),
      zone5: Math.round((zoneTime.zone5 / total) * 100),
    };
  }, [intervals, totalDuration]);

  // Handlers
  const handleAddInterval = useCallback(() => {
    const newInterval: IntervalSet = {
      id: `interval-${Date.now()}`,
      type: 'work',
      duration: 60,
      equipment: selectedEquipment,
      targetMetrics: {},
      color: '#3b82f6'
    };
    setIntervals([...intervals, newInterval]);
    setEditingInterval(newInterval);
  }, [intervals, selectedEquipment]);

  const handleUpdateInterval = useCallback((interval: IntervalSet) => {
    setIntervals(intervals.map(i => i.id === interval.id ? interval : i));
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
    setSelectedEquipment(template.intervalProgram.equipment);
    setActiveTab('build');
  };

  const handleSave = async () => {
    const program: IntervalProgram = {
      id: initialProgram?.id || `program-${Date.now()}`,
      name: programName,
      description: programDescription,
      equipment: selectedEquipment,
      intervals,
      totalDuration,
      estimatedCalories: Math.round(estimatedCalories),
      targetZones: zoneDistribution,
      tags: [],
      difficulty: 'intermediate' // Could be calculated based on intervals
    };
    
    // If onSave prop is provided, use it
    if (onSave) {
      onSave(program);
      return;
    }
    
    // Otherwise, save directly via API
    try {
      const workoutData = {
        title: programName,
        description: programDescription,
        type: 'conditioning' as const,
        scheduledDate: scheduledDate.toISOString(),
        location,
        teamId,
        playerIds: selectedPlayers,
        intervalProgram: program,
        personalizeForPlayers: selectedPlayers.length > 0
      };
      
      await createConditioningWorkout(workoutData).unwrap();
      toast.success(t('physicalTrainer:conditioning.createSuccess'));
      onCancel(); // Close the builder
    } catch (error) {
      console.error('Failed to save conditioning workout:', error);
      toast.error(t('physicalTrainer:conditioning.saveError'));
    }
  };

  const isValid = programName && intervals.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">{t('physicalTrainer:conditioning.builder.title')}</h2>
          <p className="text-muted-foreground">
            {t('physicalTrainer:conditioning.builder.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Zap className="h-4 w-4 mr-2" />
            ~{Math.round(estimatedCalories)} cal
          </Badge>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {t('common:cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common:saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common:save')}
              </>
            )}
          </Button>
        </div>
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
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Left Panel - Workout Details */}
              <div className="col-span-3 space-y-4">
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

                    <EquipmentSelector
                      selected={selectedEquipment}
                      onChange={setSelectedEquipment}
                    />
                  </CardContent>
                </Card>

                <WorkoutSummary
                  totalDuration={totalDuration}
                  estimatedCalories={Math.round(estimatedCalories)}
                  zoneDistribution={zoneDistribution}
                  intervals={intervals}
                />
              </div>

              {/* Center Panel - Timeline */}
              <div className="col-span-6">
                <Card className="h-full">
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
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={intervals.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <IntervalTimeline
                          intervals={intervals}
                          onEdit={setEditingInterval}
                          onDelete={handleDeleteInterval}
                          onDuplicate={handleDuplicateInterval}
                          equipment={selectedEquipment}
                        />
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
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Interval Editor */}
              <div className="col-span-3">
                {editingInterval ? (
                  <IntervalForm
                    interval={editingInterval}
                    equipment={selectedEquipment}
                    onSave={handleUpdateInterval}
                    onCancel={() => setEditingInterval(null)}
                    playerTests={playerTests}
                  />
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('physicalTrainer:conditioning.editor.selectInterval')}</p>
                      </div>
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

      {/* Warnings */}
      {intervals.length === 0 && (
        <Alert className="mx-4 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:conditioning.warnings.noIntervals')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}