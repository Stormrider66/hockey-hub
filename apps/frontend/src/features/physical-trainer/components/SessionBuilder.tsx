'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  X
} from 'lucide-react';
import ExerciseLibrary from './session-builder/ExerciseLibrary';
import SessionTimeline from './session-builder/SessionTimeline';
import SessionDetails from './session-builder/SessionDetails';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import type { Exercise, SessionTemplate } from '../types';
import { cn } from '@/lib/utils';

interface SessionBuilderProps {
  initialTemplate?: SessionTemplate;
  onSave?: (template: SessionTemplate) => void;
  onCancel?: () => void;
  playerRestrictions?: string[];
}

export interface SessionExercise extends Exercise {
  id: string;
  tempId?: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  intensity?: 'low' | 'medium' | 'high' | 'max';
  notes?: string;
}

export interface SessionData {
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'agility' | 'skill' | 'recovery' | 'mixed' | 'hybrid';
  category: string;
  exercises: SessionExercise[];
  warmup?: {
    duration: number;
    activities: string[];
  };
  cooldown?: {
    duration: number;
    activities: string[];
  };
  estimatedDuration: number;
  equipment: string[];
  targetGroups?: {
    positions?: string[];
    ageGroups?: string[];
    skillLevels?: string[];
  };
  intensity: 'low' | 'medium' | 'high' | 'max';
  location?: string;
}

const SESSION_TYPES = [
  { value: 'strength', label: 'Strength Training', icon: Dumbbell },
  { value: 'cardio', label: 'Cardio/Conditioning', icon: Heart },
  { value: 'agility', label: 'Agility Training', icon: Zap },
  { value: 'skill', label: 'Skills Training', icon: TrendingUp },
  { value: 'recovery', label: 'Recovery Session', icon: Heart },
  { value: 'mixed', label: 'Mixed Training', icon: Timer },
  { value: 'hybrid', label: 'Hybrid Workout', icon: Dumbbell },
];

export default function SessionBuilder({
  initialTemplate,
  onSave,
  onCancel,
  playerRestrictions = []
}: SessionBuilderProps) {
  // State management
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData>({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    type: initialTemplate?.type || 'mixed',
    category: initialTemplate?.category || 'custom',
    exercises: initialTemplate?.exercises || [],
    warmup: initialTemplate?.warmup || { duration: 10, activities: [] },
    cooldown: initialTemplate?.cooldown || { duration: 10, activities: [] },
    estimatedDuration: initialTemplate?.duration || 60,
    equipment: initialTemplate?.equipment || [],
    targetGroups: initialTemplate?.targetGroups || {},
    intensity: 'medium',
    location: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRestrictedWarning, setShowRestrictedWarning] = useState(false);

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
        // Estimate time based on sets and rest
        const setTime = 60; // Assume 60 seconds per set
        const totalSetTime = exercise.sets * setTime;
        const totalRestTime = (exercise.sets - 1) * exercise.restBetweenSets;
        return total + (totalSetTime + totalRestTime) / 60; // Convert to minutes
      }
      return total + 5; // Default 5 minutes per exercise
    }, 0);

    return Math.round(warmupTime + exerciseTime + cooldownTime);
  }, [sessionData]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveExerciseId(event.active.id as string);
  };

  // Handle drag end
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
        
        // Update order indices
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

  // Save session template
  const handleSave = async () => {
    // If onSave prop is provided, use it for legacy compatibility
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        warmup: sessionData.warmup,
        cooldown: sessionData.cooldown,
        targetGroups: sessionData.targetGroups
      };
      onSave(template);
      return;
    }
    
    // Use the new save workflow
    const result = await saveWorkflow.save();
    if (result?.success && onCancel) {
      onCancel(); // Close the builder on success
    }
  };

  // Check if any exercises are restricted
  const hasRestrictedExercises = useMemo(() => {
    return sessionData.exercises.some(exercise => 
      playerRestrictions.some(restriction => 
        exercise.name.toLowerCase().includes(restriction.toLowerCase())
      )
    );
  }, [sessionData.exercises, playerRestrictions]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-2xl font-bold">Session Builder</h2>
            <p className="text-muted-foreground">
              Drag exercises from the library to build your training session
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Clock className="h-4 w-4 mr-2" />
              {totalDuration} min
            </Badge>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!sessionData.name || sessionData.exercises.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
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
            <Card className="h-full">
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
          </div>
        </div>

        {/* Save Progress */}
        {(saveWorkflow.isSaving || saveWorkflow.isValidating) && (
          <div className="mx-4 mb-4">
            <SaveWorkflowProgress
              workflow={saveWorkflow}
              onRetry={saveWorkflow.retry}
              onCancel={() => saveWorkflow.reset()}
            />
          </div>
        )}

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

      {/* Success Modal */}
      {saveWorkflow.successModalProps && (
        <WorkoutSuccessModal
          isOpen={saveWorkflow.isSuccessModalOpen}
          onClose={saveWorkflow.closeSuccessModal}
          workoutType={WorkoutType.STRENGTH}
          workoutName={sessionData.name}
          playerCount={0}
          teamCount={0}
          duration={totalDuration}
          exerciseCount={sessionData.exercises.length}
          onSchedule={saveWorkflow.successModalProps.onSchedule}
          onCreateAnother={() => {
            saveWorkflow.reset();
            // Reset form state
            setSessionData({
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
              location: ''
            });
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeExerciseId && (
          <Card className="w-64 shadow-lg">
            <CardContent className="p-3">
              <div className="font-medium">Dragging Exercise</div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}