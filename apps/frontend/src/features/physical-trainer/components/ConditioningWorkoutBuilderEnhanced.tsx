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
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateConditioningWorkoutMutation } from '@/store/api/trainingApi';
import { useSaveWorkflow } from '../hooks/useSaveWorkflow';
import { useSmartDefaults } from '../hooks/useSmartDefaults';
import { usePhysicalTrainerData } from '../hooks/usePhysicalTrainerData';
import { SaveWorkflowProgress } from './SaveWorkflowProgress';
import { WorkoutSuccessModal } from './shared/WorkoutSuccessModal';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { SmartDefaultsIndicator } from './shared/SmartDefaultsIndicator';
import { SmartDefaultsPreferencesManager } from '../utils/smartDefaultsPreferences';
import { WorkoutType } from '../types';
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
import WorkoutBuilderErrorBoundary from './shared/WorkoutBuilderErrorBoundary';
import { useAutoSave } from '../hooks/useAutoSave';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConditioningWorkoutBuilderEnhancedProps {
  onSave?: (program: IntervalProgram) => void;
  onCancel: () => void;
  initialProgram?: IntervalProgram;
  playerTests?: PlayerTestResult[];
  selectedPlayers?: string[];
  teamId?: string;
  scheduledDate?: Date;
  location?: string;
  calendarContext?: {
    selectedDate?: Date;
    selectedTimeSlot?: { start: string; end: string; duration: number };
    viewingTeamId?: string;
  };
}

function ConditioningWorkoutBuilderEnhancedInternal({
  onSave,
  onCancel,
  initialProgram,
  playerTests = [],
  selectedPlayers: initialSelectedPlayers = [],
  teamId: initialTeamId,
  scheduledDate: initialScheduledDate,
  location: initialLocation,
  calendarContext
}: ConditioningWorkoutBuilderEnhancedProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const { teams, players, selectedTeamId, userId } = usePhysicalTrainerData();
  const [createConditioningWorkout, { isLoading }] = useCreateConditioningWorkoutMutation();

  // State management
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentType>(
    initialProgram?.equipment || 'rowing-machine'
  );
  const [intervals, setIntervals] = useState<IntervalSet[]>(initialProgram?.intervals || []);
  const [activeIntervalId, setActiveIntervalId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(initialSelectedPlayers);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(initialTeamId ? [initialTeamId] : []);
  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate || new Date());
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState(initialLocation || '');
  const [showSmartDefaults, setShowSmartDefaults] = useState(true);

  // Use smart defaults hook
  const {
    defaults,
    isCalculating,
    confidence,
    reasoning,
    applyDefaults,
    refreshDefaults
  } = useSmartDefaults({
    workoutType: WorkoutType.CONDITIONING,
    currentTeamId: selectedTeamId,
    teams,
    players,
    calendarContext,
    userPreferences: SmartDefaultsPreferencesManager.getPreferences(userId || 'default') || undefined,
    historicalData: [
      {
        workoutType: WorkoutType.CONDITIONING,
        dayOfWeek: new Date().getDay(),
        timeOfDay: '16:00',
        duration: 45,
        equipment: ['rowing-machine', 'bike'],
        teamId: selectedTeamId || undefined,
        frequency: 3
      }
    ]
  });

  // Apply smart defaults when calculated
  useEffect(() => {
    if (defaults && !initialProgram) {
      setProgramName(defaults.name);
      setScheduledDate(new Date(defaults.date));
      setScheduledTime(defaults.time);
      setSelectedPlayers(defaults.assignedPlayerIds);
      setSelectedTeams(defaults.assignedTeamIds);
      
      // Set equipment if available
      const conditioningEquipment = defaults.equipment.find(eq => 
        Object.keys(EQUIPMENT_CONFIGS).includes(eq)
      );
      if (conditioningEquipment) {
        setSelectedEquipment(conditioningEquipment as WorkoutEquipmentType);
      }

      // Create default intervals based on intensity
      if (intervals.length === 0) {
        const defaultIntervals = createDefaultIntervals(defaults.intensity, defaults.duration);
        setIntervals(defaultIntervals);
      }
    }
  }, [defaults, initialProgram, intervals.length]);

  // Create default intervals based on intensity and duration
  const createDefaultIntervals = (intensity: string, duration: number): IntervalSet[] => {
    const baseIntervals: IntervalSet[] = [];
    
    if (intensity === 'high' || intensity === 'max') {
      // HIIT pattern
      const workTime = 30;
      const restTime = 30;
      const rounds = Math.floor((duration * 60) / (workTime + restTime));
      
      for (let i = 0; i < rounds; i++) {
        baseIntervals.push({
          id: `interval-${i}`,
          name: `Sprint ${i + 1}`,
          duration: workTime,
          intensity: 'high',
          targetHeartRate: { min: 160, max: 180 },
          targetPower: { min: 250, max: 350 },
          targetPace: { min: 120, max: 150 },
          orderIndex: i
        });
        
        if (i < rounds - 1) {
          baseIntervals.push({
            id: `rest-${i}`,
            name: `Recovery ${i + 1}`,
            duration: restTime,
            intensity: 'low',
            targetHeartRate: { min: 100, max: 120 },
            orderIndex: i + 0.5
          });
        }
      }
    } else {
      // Steady state
      baseIntervals.push({
        id: 'warmup',
        name: 'Warm-up',
        duration: 300,
        intensity: 'low',
        targetHeartRate: { min: 100, max: 130 },
        orderIndex: 0
      });
      
      baseIntervals.push({
        id: 'main',
        name: 'Main Set',
        duration: (duration - 10) * 60,
        intensity: 'medium',
        targetHeartRate: { min: 130, max: 150 },
        targetPower: { min: 150, max: 200 },
        orderIndex: 1
      });
      
      baseIntervals.push({
        id: 'cooldown',
        name: 'Cool-down',
        duration: 300,
        intensity: 'low',
        targetHeartRate: { min: 90, max: 110 },
        orderIndex: 2
      });
    }
    
    return baseIntervals;
  };

  // Auto-save functionality
  const { lastSaved, isAutoSaving } = useAutoSave({
    data: { programName, programDescription, selectedEquipment, intervals },
    onSave: async (data) => {
      console.log('Auto-saving conditioning workout:', data);
    },
    enabled: true,
    delay: 3000
  });

  // Calculate totals and analytics
  const totalDuration = useMemo(() => 
    intervals.reduce((sum, interval) => sum + interval.duration, 0),
    [intervals]
  );

  const estimatedCalories = useMemo(() => {
    const equipment = EQUIPMENT_CONFIGS[selectedEquipment];
    return intervals.reduce((sum, interval) => {
      const minutes = interval.duration / 60;
      const intensityMultiplier = {
        low: 0.7,
        medium: 1.0,
        high: 1.3,
        max: 1.5
      }[interval.intensity];
      return sum + (equipment.caloriesPerMinute * minutes * intensityMultiplier);
    }, 0);
  }, [intervals, selectedEquipment]);

  const zoneDistribution = useMemo(() => {
    const zones = { low: 0, medium: 0, high: 0, max: 0 };
    intervals.forEach(interval => {
      zones[interval.intensity] += interval.duration;
    });
    const total = totalDuration || 1;
    return {
      low: Math.round((zones.low / total) * 100),
      medium: Math.round((zones.medium / total) * 100),
      high: Math.round((zones.high / total) * 100),
      max: Math.round((zones.max / total) * 100)
    };
  }, [intervals, totalDuration]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveIntervalId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = intervals.findIndex(i => i.id === active.id);
      const newIndex = intervals.findIndex(i => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newIntervals = arrayMove(intervals, oldIndex, newIndex);
        setIntervals(newIntervals.map((interval, index) => ({
          ...interval,
          orderIndex: index
        })));
      }
    }
    
    setActiveIntervalId(null);
  };

  // Interval management
  const addInterval = (interval: IntervalSet) => {
    setIntervals([...intervals, { ...interval, orderIndex: intervals.length }]);
  };

  const updateInterval = (id: string, updates: Partial<IntervalSet>) => {
    setIntervals(intervals.map(interval => 
      interval.id === id ? { ...interval, ...updates } : interval
    ));
  };

  const deleteInterval = (id: string) => {
    setIntervals(intervals.filter(interval => interval.id !== id));
  };

  const duplicateInterval = (id: string) => {
    const intervalToDuplicate = intervals.find(i => i.id === id);
    if (intervalToDuplicate) {
      const newInterval = {
        ...intervalToDuplicate,
        id: `interval-${Date.now()}`,
        name: `${intervalToDuplicate.name} (Copy)`,
        orderIndex: intervals.length
      };
      setIntervals([...intervals, newInterval]);
    }
  };

  // Template handling
  const applyTemplate = (template: WorkoutTemplate) => {
    setProgramName(template.name);
    setProgramDescription(template.description || '');
    setSelectedEquipment(template.equipment);
    setIntervals(template.intervals.map((interval, index) => ({
      ...interval,
      orderIndex: index
    })));
    setSelectedTemplate(template);
    toast.success(`Template "${template.name}" applied`);
  };

  // Save functionality
  const handleSave = async () => {
    // Learn from this save
    if (userId) {
      SmartDefaultsPreferencesManager.learnFromSave(userId, {
        type: WorkoutType.CONDITIONING,
        duration: Math.round(totalDuration / 60),
        intensity: intervals.length > 0 ? intervals[0].intensity : 'medium',
        teamId: selectedTeams[0],
        time: scheduledTime,
        dayOfWeek: scheduledDate.getDay(),
        equipment: [selectedEquipment]
      });
    }

    try {
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
        difficulty: 'intermediate'
      };

      if (onSave) {
        onSave(program);
      } else {
        const result = await createConditioningWorkout({
          name: programName,
          description: programDescription,
          type: WorkoutType.CONDITIONING,
          intervalProgram: program,
          date: scheduledDate.toISOString(),
          location,
          duration: Math.round(totalDuration / 60),
          assignedPlayerIds: selectedPlayers,
          assignedTeamIds: selectedTeams
        }).unwrap();

        setSavedWorkoutId(result.id);
        setShowSuccessModal(true);
        toast.success('Conditioning workout created successfully!');
      }
    } catch (error) {
      console.error('Failed to save workout:', error);
      toast.error('Failed to save workout');
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const activeInterval = activeIntervalId 
    ? intervals.find(i => i.id === activeIntervalId)
    : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background">
        {/* Header with Smart Defaults */}
        <div className="space-y-4">
          <WorkoutBuilderHeader
            title="Conditioning Workout Builder"
            workoutType="conditioning"
            onSave={handleSave}
            onCancel={onCancel}
            isSaving={isLoading}
            showAutoSave={true}
            lastSaved={lastSaved}
            progress={intervals.length > 0 ? 60 : 20}
          />

          {/* Smart Defaults Indicator */}
          {showSmartDefaults && defaults && (
            <div className="px-4">
              <SmartDefaultsIndicator
                confidence={confidence}
                reasoning={reasoning}
                isCalculating={isCalculating}
                onDismiss={() => setShowSmartDefaults(false)}
              />
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="px-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDefaults}
              disabled={isCalculating}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isCalculating && "animate-spin")} />
              Refresh Defaults
            </Button>
            
            {defaults && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {totalDuration > 0 ? `${Math.round(totalDuration / 60)} min workout` : 'No intervals'}
                </Badge>
                {selectedPlayers.length > 0 && (
                  <Badge variant="secondary">
                    {selectedPlayers.length} players selected
                  </Badge>
                )}
                <Badge variant="secondary" className={cn(
                  "capitalize",
                  defaults.intensity === 'high' && "bg-orange-100 text-orange-700",
                  defaults.intensity === 'medium' && "bg-blue-100 text-blue-700",
                  defaults.intensity === 'low' && "bg-green-100 text-green-700"
                )}>
                  {defaults.intensity} intensity
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="builder" className="flex-1">
          <TabsList className="mx-4">
            <TabsTrigger value="builder">Workout Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="flex-1 px-4">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Left Panel - Interval Builder */}
              <div className="col-span-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Workout Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Workout Name</label>
                      <input
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        placeholder="e.g., Tuesday HIIT Session"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={programDescription}
                        onChange={(e) => setProgramDescription(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        rows={3}
                        placeholder="Describe the workout goals and focus..."
                      />
                    </div>

                    <EquipmentSelector
                      selected={selectedEquipment}
                      onChange={setSelectedEquipment}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add Interval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IntervalForm
                      onAdd={addInterval}
                      equipment={selectedEquipment}
                      existingIntervals={intervals}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Center Panel - Timeline */}
              <div className="col-span-5">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Interval Timeline</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IntervalTimeline
                      intervals={intervals}
                      equipment={selectedEquipment}
                      onUpdate={updateInterval}
                      onDelete={deleteInterval}
                      onDuplicate={duplicateInterval}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Summary & Test Targets */}
              <div className="col-span-3 space-y-4">
                <WorkoutSummary
                  totalDuration={totalDuration}
                  estimatedCalories={estimatedCalories}
                  zoneDistribution={zoneDistribution}
                  equipment={selectedEquipment}
                />

                {playerTests.length > 0 && (
                  <TestBasedTargets
                    playerTests={playerTests}
                    equipment={selectedEquipment}
                    intervals={intervals}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="px-4">
            <WorkoutTemplateLibrary
              equipment={selectedEquipment}
              onSelectTemplate={applyTemplate}
              selectedTemplate={selectedTemplate}
            />
          </TabsContent>

          <TabsContent value="players" className="px-4">
            <Card>
              <CardHeader>
                <CardTitle>Player Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerTeamAssignment
                  selectedPlayerIds={selectedPlayers}
                  selectedTeamIds={selectedTeams}
                  onPlayerToggle={handlePlayerToggle}
                  onTeamToggle={handleTeamToggle}
                  players={players}
                  teams={teams}
                  showMedicalStatus={true}
                  maxHeight="500px"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="px-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workout Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Intensity Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(zoneDistribution).map(([zone, percentage]) => (
                          <div key={zone} className="flex items-center gap-2">
                            <span className="w-16 text-sm capitalize">{zone}</span>
                            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-full",
                                  zone === 'low' && "bg-green-500",
                                  zone === 'medium' && "bg-blue-500",
                                  zone === 'high' && "bg-orange-500",
                                  zone === 'max' && "bg-red-500"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-sm w-12 text-right">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Estimated Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(estimatedCalories)}
                          </div>
                          <div className="text-sm text-gray-600">Calories</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(totalDuration / 60)}
                          </div>
                          <div className="text-sm text-gray-600">Minutes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      value={format(scheduledDate, 'yyyy-MM-dd')}
                      onChange={(e) => setScheduledDate(new Date(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      placeholder="e.g., Training Center"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Success Modal */}
        {showSuccessModal && savedWorkoutId && (
          <WorkoutSuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            workoutId={savedWorkoutId}
            workoutType={WorkoutType.CONDITIONING}
            workoutName={programName}
            assignedCount={selectedPlayers.length}
            scheduledDate={scheduledDate}
          />
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeInterval && (
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="font-medium">{activeInterval.name}</div>
              <div className="text-sm text-muted-foreground">
                {Math.floor(activeInterval.duration / 60)}:{(activeInterval.duration % 60).toString().padStart(2, '0')} - {activeInterval.intensity}
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

const ConditioningWorkoutBuilderEnhanced: React.FC<ConditioningWorkoutBuilderEnhancedProps> = (props) => {
  return (
    <WorkoutBuilderErrorBoundary>
      <ConditioningWorkoutBuilderEnhancedInternal {...props} />
    </WorkoutBuilderErrorBoundary>
  );
};

export default ConditioningWorkoutBuilderEnhanced;