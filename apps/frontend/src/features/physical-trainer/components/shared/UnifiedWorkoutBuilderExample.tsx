/**
 * Example implementation of the unified workout builder layout
 * This demonstrates how to integrate the new layout with existing workout builders
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  WorkoutBuilderLayout, 
  WorkoutTabContent,
  ExerciseLibrarySidebar 
} from './index';
import { 
  WorkoutBuilderTab,
  ExerciseLibraryItem,
  ExerciseLibraryFilters,
  WorkoutDetailsFormData,
  ExerciseAssignment,
  ExercisePhase
} from '../../types/workout-builder.types';
import { WorkoutType } from '../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit, Clock } from '@/components/icons';

// Mock exercise library data
const mockExercises: ExerciseLibraryItem[] = [
  {
    id: '1',
    name: 'Back Squat',
    category: 'strength',
    phase: 'main',
    description: 'Fundamental lower body strength exercise',
    equipment: ['barbell', 'squat rack'],
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: 8,
    restBetweenSets: 120,
    isFavorite: true,
    usageCount: 45
  },
  {
    id: '2',
    name: 'Dynamic Stretching',
    category: 'mobility',
    phase: 'warmup',
    description: 'Full body dynamic warm-up routine',
    equipment: [],
    difficulty: 'beginner',
    duration: 300,
    isFavorite: false,
    usageCount: 120
  },
  {
    id: '3',
    name: 'Foam Rolling',
    category: 'recovery',
    phase: 'cooldown',
    description: 'Self-myofascial release',
    equipment: ['foam roller'],
    difficulty: 'beginner',
    duration: 600,
    isFavorite: true,
    usageCount: 85
  }
];

interface UnifiedWorkoutBuilderExampleProps {
  workoutType: WorkoutType;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const UnifiedWorkoutBuilderExample: React.FC<UnifiedWorkoutBuilderExampleProps> = ({
  workoutType,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [currentTab, setCurrentTab] = useState<WorkoutBuilderTab>('details');
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [selectedExercises, setSelectedExercises] = useState<ExerciseAssignment[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Form state
  const [details, setDetails] = useState<WorkoutDetailsFormData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    location: 'Main Gym',
    intensity: 'medium'
  });

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exercise: ExerciseLibraryItem) => {
    const newAssignment: ExerciseAssignment = {
      exerciseId: exercise.id,
      phase: exercise.phase,
      orderIndex: selectedExercises.filter(e => e.phase === exercise.phase).length,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      duration: exercise.duration,
      restBetweenSets: exercise.restBetweenSets
    };
    setSelectedExercises([...selectedExercises, newAssignment]);
  }, [selectedExercises]);

  // Handle exercise deletion
  const handleExerciseDelete = useCallback((exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter(e => e.exerciseId !== exerciseId));
  }, [selectedExercises]);

  // Group exercises by phase
  const exercisesByPhase = selectedExercises.reduce((acc, exercise) => {
    if (!acc[exercise.phase]) {
      acc[exercise.phase] = [];
    }
    acc[exercise.phase].push(exercise);
    return acc;
  }, {} as Record<ExercisePhase, ExerciseAssignment[]>);

  return (
    <div className="flex h-full">
      {/* Exercise Library Sidebar */}
      {showSidebar && currentTab === 'exercises' && (
        <ExerciseLibrarySidebar
          exercises={mockExercises}
          filters={filters}
          onFiltersChange={setFilters}
          onExerciseSelect={handleExerciseSelect}
          workoutType={workoutType}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        <WorkoutBuilderLayout
          workoutType={workoutType}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onSave={onSave}
          onCancel={onCancel}
          title={details.title || t('physicalTrainer:workoutBuilder.newWorkout')}
        >
          {/* Details Tab */}
          <WorkoutTabContent value="details">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('physicalTrainer:workoutBuilder.title')}</Label>
                  <Input
                    id="title"
                    value={details.title}
                    onChange={(e) => setDetails({ ...details, title: e.target.value })}
                    placeholder={t('physicalTrainer:workoutBuilder.titlePlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('physicalTrainer:workoutBuilder.duration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={details.duration}
                    onChange={(e) => setDetails({ ...details, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('physicalTrainer:workoutBuilder.description')}</Label>
                <Textarea
                  id="description"
                  value={details.description}
                  onChange={(e) => setDetails({ ...details, description: e.target.value })}
                  placeholder={t('physicalTrainer:workoutBuilder.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">{t('physicalTrainer:workoutBuilder.location')}</Label>
                  <Input
                    id="location"
                    value={details.location}
                    onChange={(e) => setDetails({ ...details, location: e.target.value })}
                    placeholder={t('physicalTrainer:workoutBuilder.locationPlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensity</Label>
                  <Select
                    value={details.intensity}
                    onValueChange={(value: any) => setDetails({ ...details, intensity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Exercises Tab */}
          <WorkoutTabContent value="exercises">
            <div className="flex h-full">
              <div className="flex-1 p-6">
                {!showSidebar && (
                  <Button
                    onClick={() => setShowSidebar(true)}
                    variant="outline"
                    className="mb-4"
                  >
                    Show Exercise Library
                  </Button>
                )}
                
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {(['warmup', 'main', 'cooldown'] as ExercisePhase[]).map(phase => (
                      <div key={phase}>
                        <h3 className="text-lg font-semibold mb-3 capitalize">{phase} Phase</h3>
                        <div className="space-y-2">
                          {exercisesByPhase[phase]?.map((exercise, index) => {
                            const exerciseDetails = mockExercises.find(e => e.id === exercise.exerciseId);
                            if (!exerciseDetails) return null;
                            
                            return (
                              <Card key={exercise.exerciseId}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{exerciseDetails.name}</h4>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        {exercise.sets && exercise.reps && (
                                          <span>{exercise.sets} x {exercise.reps}</span>
                                        )}
                                        {exercise.duration && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="ghost">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => handleExerciseDelete(exercise.exerciseId)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {(!exercisesByPhase[phase] || exercisesByPhase[phase].length === 0) && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                              <p className="text-sm">No exercises in {phase} phase</p>
                              <p className="text-xs mt-1">Select exercises from the library</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </WorkoutTabContent>

          {/* Assignment Tab */}
          <WorkoutTabContent value="assignment">
            <div className="p-6">
              <p className="text-gray-500">Player and team assignment interface goes here</p>
            </div>
          </WorkoutTabContent>

          {/* Preview Tab */}
          <WorkoutTabContent value="preview">
            <div className="p-6">
              <p className="text-gray-500">Workout preview and summary goes here</p>
            </div>
          </WorkoutTabContent>

          {/* Templates Tab */}
          <WorkoutTabContent value="templates">
            <div className="p-6">
              <p className="text-gray-500">Workout templates interface goes here</p>
            </div>
          </WorkoutTabContent>
        </WorkoutBuilderLayout>
      </div>
    </div>
  );
};