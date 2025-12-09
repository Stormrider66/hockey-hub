'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  FileText,
  Clock,
  Users,
  MapPin,
  Dumbbell,
  Heart,
  Zap,
  Timer,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ExerciseLibrary from './session-builder/ExerciseLibrary';
import SessionTimeline from './session-builder/SessionTimeline';
import SessionDetails from './session-builder/SessionDetails';
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';
import { SmartDefaultsIndicator } from './shared/SmartDefaultsIndicator';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import { useSmartDefaults } from '../hooks/useSmartDefaults';
import { useWorkoutBuilder } from '../hooks/useWorkoutBuilder';
import { usePhysicalTrainerData } from '../hooks/usePhysicalTrainerData';
import { WorkoutType } from '../types/session.types';
import { SmartDefaultsPreferencesManager } from '../utils/smartDefaultsPreferences';
import type { Exercise, SessionTemplate } from '../types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface SessionBuilderEnhancedProps {
  initialTemplate?: SessionTemplate;
  onSave?: (template: SessionTemplate) => void;
  onCancel?: () => void;
  playerRestrictions?: string[];
  calendarContext?: {
    selectedDate?: Date;
    selectedTimeSlot?: { start: string; end: string; duration: number };
    viewingTeamId?: string;
  };
}

export interface SessionExercise extends Exercise {
  id: string;
  tempId?: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  intensity?: string;
  notes?: string;
  orderIndex?: number;
}

interface SessionData {
  name: string;
  description: string;
  type: 'strength' | 'power' | 'endurance' | 'mixed';
  category: string;
  exercises: SessionExercise[];
  warmup: {
    duration: number;
    activities: string[];
  };
  cooldown: {
    duration: number;
    activities: string[];
  };
  estimatedDuration: number;
  equipment: string[];
  targetGroups: Record<string, boolean>;
  intensity: 'low' | 'medium' | 'high' | 'max';
  location: string;
  date?: string;
  time?: string;
  assignedPlayerIds?: string[];
  assignedTeamIds?: string[];
}

const SESSION_TYPES = [
  { value: 'strength', label: 'Strength', icon: Dumbbell },
  { value: 'power', label: 'Power', icon: Zap },
  { value: 'endurance', label: 'Endurance', icon: Timer },
  { value: 'mixed', label: 'Mixed', icon: TrendingUp }
];

const SessionBuilderEnhanced: React.FC<SessionBuilderEnhancedProps> = ({
  initialTemplate,
  onSave,
  onCancel,
  playerRestrictions = [],
  calendarContext
}) => {
  const { teams, players, selectedTeamId, userId } = usePhysicalTrainerData();
  
  // Initialize with empty data, will be populated by smart defaults
  const [sessionData, setSessionData] = useState<SessionData>({
    name: '',
    description: '',
    type: 'mixed',
    category: 'custom',
    exercises: [],
    warmup: { duration: 10, activities: [] },
    cooldown: { duration: 10, activities: [] },
    estimatedDuration: 60,
    equipment: [],
    targetGroups: {},
    intensity: 'medium',
    location: '',
    date: '',
    time: '',
    assignedPlayerIds: [],
    assignedTeamIds: []
  });

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRestrictedWarning, setShowRestrictedWarning] = useState(false);
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
    workoutType: WorkoutType.STRENGTH,
    currentTeamId: selectedTeamId,
    teams,
    players,
    calendarContext,
    userPreferences: SmartDefaultsPreferencesManager.getPreferences(userId || 'default') || undefined
  });

  // Apply smart defaults when they're calculated
  useEffect(() => {
    if (defaults && !initialTemplate) {
      const enhancedData = applyDefaults({
        ...sessionData,
        type: defaults.type === WorkoutType.STRENGTH ? 'strength' : 
              defaults.type === WorkoutType.CONDITIONING ? 'endurance' : 'mixed',
        date: defaults.date,
        time: defaults.time,
        assignedPlayerIds: defaults.assignedPlayerIds,
        assignedTeamIds: defaults.assignedTeamIds
      });
      
      setSessionData(prev => ({
        ...prev,
        ...enhancedData,
        name: enhancedData.name || prev.name,
        estimatedDuration: enhancedData.duration || prev.estimatedDuration,
        intensity: enhancedData.intensity || prev.intensity,
        equipment: enhancedData.equipment || prev.equipment
      }));
    }
  }, [defaults, initialTemplate, applyDefaults]);

  // Initialize from template if provided
  useEffect(() => {
    if (initialTemplate) {
      setSessionData({
        name: initialTemplate.name || '',
        description: initialTemplate.description || '',
        type: initialTemplate.type || 'mixed',
        category: initialTemplate.category || 'custom',
        exercises: initialTemplate.exercises || [],
        warmup: initialTemplate.warmup || { duration: 10, activities: [] },
        cooldown: initialTemplate.cooldown || { duration: 10, activities: [] },
        estimatedDuration: initialTemplate.duration || 60,
        equipment: initialTemplate.equipment || [],
        targetGroups: initialTemplate.targetGroups || {},
        intensity: 'medium',
        location: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        assignedPlayerIds: [],
        assignedTeamIds: []
      });
    }
  }, [initialTemplate]);

  // Fetch exercises from API
  const { data: exercisesData, isLoading: exercisesLoading } = useGetExercisesQuery({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery
  });

  const exercises = Array.isArray(exercisesData) ? exercisesData : exercisesData?.data || [];

  // Calculate total duration including warmup, exercises, and cooldown
  const totalDuration = useMemo(() => {
    const warmupTime = sessionData.warmup?.duration || 0;
    const cooldownTime = sessionData.cooldown?.duration || 0;
    
    const exerciseTime = sessionData.exercises.reduce((total, exercise) => {
      if (exercise.duration) {
        return total + exercise.duration;
      } else if (exercise.sets && exercise.restBetweenSets) {
        const setTime = 60; // Assume 60 seconds per set
        const totalSetTime = exercise.sets * setTime;
        const totalRestTime = (exercise.sets - 1) * exercise.restBetweenSets;
        return total + (totalSetTime + totalRestTime) / 60; // Convert to minutes
      }
      return total + 5; // Default 5 minutes per exercise
    }, 0);

    return Math.round(warmupTime + exerciseTime + cooldownTime);
  }, [sessionData]);

  // Update session data
  const updateSessionData = useCallback(<K extends keyof SessionData>(
    field: K,
    value: SessionData[K]
  ) => {
    setSessionData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update exercise in timeline
  const updateExercise = useCallback((exerciseId: string, updates: Partial<SessionExercise>) => {
    setSessionData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    }));
  }, []);

  // Remove exercise from timeline
  const removeExercise = useCallback((exerciseId: string) => {
    setSessionData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  }, []);

  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveExerciseId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    // Check if dropping from library to timeline
    if (active.data.current?.type === 'library-exercise' && over.id === 'timeline-dropzone') {
      const exercise = active.data.current.exercise;
      const newExercise: SessionExercise = {
        ...exercise,
        tempId: `temp-${Date.now()}`,
        id: exercise.id || `temp-${Date.now()}`,
        sets: exercise.defaultParameters?.sets || 3,
        reps: exercise.defaultParameters?.reps || 10,
        duration: exercise.defaultParameters?.duration,
        restBetweenSets: exercise.defaultParameters?.restDuration || 60,
        intensity: sessionData.intensity,
        orderIndex: sessionData.exercises.length
      };

      setSessionData(prev => ({
        ...prev,
        exercises: [...prev.exercises, newExercise]
      }));
    }
    
    // Handle reordering within timeline
    if (active.data.current?.type === 'timeline-exercise' && over.data.current?.type === 'timeline-exercise') {
      const oldIndex = sessionData.exercises.findIndex(ex => ex.id === active.id);
      const newIndex = sessionData.exercises.findIndex(ex => ex.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newExercises = [...sessionData.exercises];
        const [movedExercise] = newExercises.splice(oldIndex, 1);
        newExercises.splice(newIndex, 0, movedExercise);
        
        const reorderedExercises = newExercises.map((ex, index) => ({
          ...ex,
          orderIndex: index
        }));
        
        setSessionData(prev => ({
          ...prev,
          exercises: reorderedExercises
        }));
      }
    }

    setActiveExerciseId(null);
  };

  // Save session
  const handleSave = async () => {
    // Learn from this save for future smart defaults
    if (userId) {
      SmartDefaultsPreferencesManager.learnFromSave(userId, {
        type: sessionData.type === 'strength' ? WorkoutType.STRENGTH :
              sessionData.type === 'endurance' ? WorkoutType.CONDITIONING :
              WorkoutType.HYBRID,
        duration: totalDuration,
        intensity: sessionData.intensity,
        teamId: sessionData.assignedTeamIds?.[0],
        time: sessionData.time,
        dayOfWeek: sessionData.date ? new Date(sessionData.date).getDay() : undefined,
        equipment: sessionData.equipment
      });
    }

    if (onSave) {
      const template: SessionTemplate = {
        id: initialTemplate?.id || '',
        name: sessionData.name,
        description: sessionData.description,
        type: sessionData.type,
        category: sessionData.category,
        duration: totalDuration,
        exercises: sessionData.exercises,
        equipment: sessionData.equipment,
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: [],
        usageCount: 0,
        warmup: sessionData.warmup,
        cooldown: sessionData.cooldown,
        targetGroups: sessionData.targetGroups
      };
      onSave(template);
    }
  };

  const hasRestrictedExercises = sessionData.exercises.some(
    ex => playerRestrictions.includes(ex.category || '')
  );

  // Check if active exercise exists
  const activeExercise = activeExerciseId
    ? [...exercises, ...sessionData.exercises].find(ex => ex.id === activeExerciseId)
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
            title="Session Builder"
            workoutType="strength"
            onSave={handleSave}
            onCancel={onCancel || (() => {})}
            showAutoSave={true}
            lastSaved={undefined}
            progress={sessionData.exercises.length > 0 ? 50 : 10}
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
                  {defaults.assignedPlayerIds.length} players auto-selected
                </Badge>
                {defaults.equipment.length > 0 && (
                  <Badge variant="secondary">
                    {defaults.equipment.length} equipment items ready
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
          {/* Exercise Library - Left Panel */}
          <div className="col-span-3 space-y-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Exercise Library</CardTitle>
              </CardHeader>
              <CardContent>
                <ExerciseLibrary
                  exercises={exercises}
                  loading={exercisesLoading}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  restrictedExercises={playerRestrictions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Session Timeline - Center */}
          <div className="col-span-6 space-y-4">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session Timeline</CardTitle>
                  <div className="flex items-center gap-2">
                    {SESSION_TYPES.map(type => (
                      <Button
                        key={type.value}
                        size="sm"
                        variant={sessionData.type === type.value ? 'default' : 'outline'}
                        onClick={() => updateSessionData('type', type.value as SessionData['type'])}
                      >
                        <type.icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SessionTimeline
                  exercises={sessionData.exercises}
                  warmup={sessionData.warmup}
                  cooldown={sessionData.cooldown}
                  onUpdateExercise={updateExercise}
                  onRemoveExercise={removeExercise}
                  onUpdateWarmup={(warmup) => updateSessionData('warmup', warmup)}
                  onUpdateCooldown={(cooldown) => updateSessionData('cooldown', cooldown)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Session Details - Right Panel */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionDetails
                  sessionData={sessionData}
                  onUpdateSessionData={updateSessionData}
                  totalDuration={totalDuration}
                />
              </CardContent>
            </Card>

            {/* Player Assignment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerTeamAssignment
                  selectedPlayerIds={sessionData.assignedPlayerIds || []}
                  selectedTeamIds={sessionData.assignedTeamIds || []}
                  onPlayerToggle={(playerId) => {
                    const current = sessionData.assignedPlayerIds || [];
                    const updated = current.includes(playerId)
                      ? current.filter(id => id !== playerId)
                      : [...current, playerId];
                    updateSessionData('assignedPlayerIds', updated);
                  }}
                  onTeamToggle={(teamId) => {
                    const current = sessionData.assignedTeamIds || [];
                    const updated = current.includes(teamId)
                      ? current.filter(id => id !== teamId)
                      : [...current, teamId];
                    updateSessionData('assignedTeamIds', updated);
                  }}
                  players={players}
                  teams={teams}
                  showMedicalStatus={true}
                  maxHeight="300px"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Warnings */}
        {hasRestrictedExercises && (
          <Alert className="mx-4 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some exercises in this session may be restricted for certain players based on their medical conditions.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeExercise ? (
          <Card className="w-64 shadow-lg">
            <CardContent className="p-3">
              <div className="font-medium">{activeExercise.name}</div>
              <div className="text-sm text-muted-foreground">{activeExercise.category}</div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SessionBuilderEnhanced;