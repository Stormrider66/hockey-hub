'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dumbbell,
  Clock,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  Check,
  ChevronUp,
  ChevronDown,
  Repeat,
  Target,
  Activity,
  Users
} from 'lucide-react';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface WorkoutData {
  title: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
  templateId?: string;
  exercises: Exercise[];
  duration: number;
  location: string;
  equipment: string[];
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
  restPeriod?: number;
  instructions?: string;
  equipment?: string[];
  targetMuscles?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  exercises: Exercise[];
  duration: number;
  equipment: string[];
  difficulty?: string;
  usageCount?: number;
  averageRating?: number;
}

interface WorkoutBuilderProps {
  workoutData: WorkoutData;
  onWorkoutChange: (data: WorkoutData) => void;
  templates: Template[];
  playerCount: number;
  medicalRestrictions?: any[];
}

// Exercise library data
const EXERCISE_LIBRARY: Exercise[] = [
  // Strength exercises
  { id: 'squat', name: 'Back Squat', category: 'strength', targetMuscles: ['quadriceps', 'glutes'], difficulty: 'intermediate' },
  { id: 'deadlift', name: 'Deadlift', category: 'strength', targetMuscles: ['hamstrings', 'back'], difficulty: 'advanced' },
  { id: 'bench', name: 'Bench Press', category: 'strength', targetMuscles: ['chest', 'triceps'], difficulty: 'intermediate' },
  { id: 'pullup', name: 'Pull-ups', category: 'strength', targetMuscles: ['back', 'biceps'], difficulty: 'intermediate' },
  
  // Cardio exercises
  { id: 'bike', name: 'Stationary Bike', category: 'cardio', equipment: ['stationary bike'], difficulty: 'beginner' },
  { id: 'row', name: 'Rowing Machine', category: 'cardio', equipment: ['rowing machine'], difficulty: 'intermediate' },
  { id: 'sprint', name: 'Sprint Intervals', category: 'cardio', difficulty: 'advanced' },
  
  // Skill exercises
  { id: 'stickhandling', name: 'Stickhandling Drills', category: 'skill', equipment: ['pucks', 'cones'], difficulty: 'beginner' },
  { id: 'shooting', name: 'Shooting Practice', category: 'skill', equipment: ['pucks', 'net'], difficulty: 'intermediate' },
  
  // Recovery exercises
  { id: 'stretch', name: 'Dynamic Stretching', category: 'recovery', difficulty: 'beginner' },
  { id: 'foam', name: 'Foam Rolling', category: 'recovery', equipment: ['foam roller'], difficulty: 'beginner' },
  { id: 'yoga', name: 'Yoga Flow', category: 'recovery', difficulty: 'intermediate' }
];

export default function WorkoutBuilder({
  workoutData,
  onWorkoutChange,
  templates,
  playerCount,
  medicalRestrictions = []
}: WorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

  // Filter exercises based on medical restrictions
  const restrictedExercises = useMemo(() => {
    const restricted = new Set<string>();
    
    medicalRestrictions.forEach(restriction => {
      restriction.restrictions.forEach((r: string) => {
        // Map restrictions to exercise IDs
        if (r === 'no_sprinting') restricted.add('sprint');
        if (r === 'no_squats') restricted.add('squat');
        if (r === 'no_jumping') restricted.add('box_jump');
        if (r === 'no_heavy_lifting') {
          restricted.add('deadlift');
          restricted.add('squat');
        }
      });
    });
    
    return restricted;
  }, [medicalRestrictions]);

  // Filter exercise library
  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(exercise => {
      if (searchQuery && !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'all' && exercise.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    onWorkoutChange({
      ...workoutData,
      title: template.name,
      description: template.description,
      type: template.type as WorkoutData['type'],
      templateId: template.id,
      exercises: template.exercises,
      duration: template.duration,
      equipment: template.equipment
    });
  };

  // Handle exercise addition
  const handleAddExercise = (exercise: Exercise) => {
    const newExercise = {
      ...exercise,
      id: `${exercise.id}-${Date.now()}`, // Unique ID for each instance
      sets: 3,
      reps: 10,
      restPeriod: 60
    };
    
    onWorkoutChange({
      ...workoutData,
      exercises: [...workoutData.exercises, newExercise]
    });
  };

  // Handle exercise removal
  const handleRemoveExercise = (exerciseId: string) => {
    onWorkoutChange({
      ...workoutData,
      exercises: workoutData.exercises.filter(e => e.id !== exerciseId)
    });
  };

  // Handle exercise update
  const handleUpdateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    onWorkoutChange({
      ...workoutData,
      exercises: workoutData.exercises.map(e => 
        e.id === exerciseId ? { ...e, ...updates } : e
      )
    });
  };

  // Handle exercise reordering
  const moveExercise = (fromIndex: number, toIndex: number) => {
    const items = Array.from(workoutData.exercises);
    const [reorderedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, reorderedItem);

    onWorkoutChange({
      ...workoutData,
      exercises: items
    });
  };

  // Toggle exercise expansion
  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  // Calculate total workout metrics
  const workoutMetrics = useMemo(() => {
    const totalSets = workoutData.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const estimatedTime = workoutData.exercises.reduce((sum, ex) => {
      if (ex.sets && ex.restPeriod) {
        return sum + (ex.sets * 2) + ((ex.sets - 1) * ex.restPeriod / 60);
      }
      return sum + (ex.duration || 5);
    }, 0);
    
    return {
      totalExercises: workoutData.exercises.length,
      totalSets,
      estimatedTime: Math.round(estimatedTime)
    };
  }, [workoutData.exercises]);

  return (
    <div className="space-y-6">
      {/* Workout Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:workoutBuilder.details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('physicalTrainer:workoutBuilder.title')}</Label>
              <Input
                id="title"
                value={workoutData.title}
                onChange={(e) => onWorkoutChange({ ...workoutData, title: e.target.value })}
                placeholder={t('physicalTrainer:workoutBuilder.titlePlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">{t('physicalTrainer:workoutBuilder.type')}</Label>
              <Select 
                value={workoutData.type} 
                onValueChange={(value) => onWorkoutChange({ ...workoutData, type: value as WorkoutData['type'] })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">{t('physicalTrainer:workoutBuilder.types.strength')}</SelectItem>
                  <SelectItem value="cardio">{t('physicalTrainer:workoutBuilder.types.cardio')}</SelectItem>
                  <SelectItem value="skill">{t('physicalTrainer:workoutBuilder.types.skill')}</SelectItem>
                  <SelectItem value="recovery">{t('physicalTrainer:workoutBuilder.types.recovery')}</SelectItem>
                  <SelectItem value="mixed">{t('physicalTrainer:workoutBuilder.types.mixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('physicalTrainer:workoutBuilder.description')}</Label>
            <Textarea
              id="description"
              value={workoutData.description || ''}
              onChange={(e) => onWorkoutChange({ ...workoutData, description: e.target.value })}
              placeholder={t('physicalTrainer:workoutBuilder.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('physicalTrainer:workoutBuilder.duration')}
              </Label>
              <Input
                id="duration"
                type="number"
                value={workoutData.duration}
                onChange={(e) => onWorkoutChange({ ...workoutData, duration: parseInt(e.target.value) || 60 })}
                min={15}
                max={180}
                step={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('physicalTrainer:workoutBuilder.location')}
              </Label>
              <Input
                id="location"
                value={workoutData.location}
                onChange={(e) => onWorkoutChange({ ...workoutData, location: e.target.value })}
                placeholder={t('physicalTrainer:workoutBuilder.locationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('physicalTrainer:workoutBuilder.targetPlayers')}
              </Label>
              <div className="pt-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {playerCount} {t('physicalTrainer:workoutBuilder.players')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:workoutBuilder.exercises')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'template' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">
                <FileText className="h-4 w-4 mr-2" />
                {t('physicalTrainer:workoutBuilder.fromTemplate')}
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Dumbbell className="h-4 w-4 mr-2" />
                {t('physicalTrainer:workoutBuilder.customBuild')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('physicalTrainer:workoutBuilder.noTemplates')}
                    </div>
                  ) : (
                    templates.map(template => (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">{template.type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {template.exercises.length} exercises • {template.duration} min
                                </span>
                                {template.usageCount && (
                                  <span className="text-sm text-muted-foreground">
                                    Used {template.usageCount} times
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              {t('common:actions.select')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              {/* Exercise Search and Filters */}
              <div className="space-y-4 mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('physicalTrainer:workoutBuilder.searchExercises')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:workoutBuilder.allCategories')}</SelectItem>
                      <SelectItem value="strength">{t('physicalTrainer:workoutBuilder.strength')}</SelectItem>
                      <SelectItem value="cardio">{t('physicalTrainer:workoutBuilder.cardio')}</SelectItem>
                      <SelectItem value="skill">{t('physicalTrainer:workoutBuilder.skill')}</SelectItem>
                      <SelectItem value="recovery">{t('physicalTrainer:workoutBuilder.recovery')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exercise Library */}
              <ScrollArea className="h-[250px]">
                <div className="grid grid-cols-2 gap-2">
                  {filteredExercises.map(exercise => {
                    const isRestricted = restrictedExercises.has(exercise.id);
                    
                    return (
                      <Card 
                        key={exercise.id}
                        className={`cursor-pointer transition-colors ${
                          isRestricted ? 'opacity-50' : 'hover:bg-muted/50'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{exercise.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {exercise.category}
                                </Badge>
                                {exercise.difficulty && (
                                  <Badge variant="secondary" className="text-xs">
                                    {exercise.difficulty}
                                  </Badge>
                                )}
                                {isRestricted && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Restricted
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => !isRestricted && handleAddExercise(exercise)}
                              disabled={isRestricted}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Exercises */}
      {workoutData.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('physicalTrainer:workoutBuilder.selectedExercises')}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{workoutMetrics.totalExercises} exercises</span>
                <span>{workoutMetrics.totalSets} sets</span>
                <span>~{workoutMetrics.estimatedTime} min</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workoutData.exercises.map((exercise, index) => (
                <Card key={exercise.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col gap-1">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={() => moveExercise(index, index - 1)}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                          )}
                          {index < workoutData.exercises.length - 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={() => moveExercise(index, index + 1)}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium">{exercise.name}</h5>
                                        <Badge variant="outline" className="text-xs">
                                          {exercise.category}
                                        </Badge>
                                      </div>
                                      
                                      {/* Exercise Parameters */}
                                      <div className="flex items-center gap-4 mt-2">
                                        {exercise.sets && (
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              value={exercise.sets}
                                              onChange={(e) => handleUpdateExercise(exercise.id, { sets: parseInt(e.target.value) || 1 })}
                                              className="w-16 h-8"
                                              min={1}
                                            />
                                            <span className="text-sm text-muted-foreground">sets</span>
                                          </div>
                                        )}
                                        
                                        {exercise.reps && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-sm text-muted-foreground">×</span>
                                            <Input
                                              type="number"
                                              value={exercise.reps}
                                              onChange={(e) => handleUpdateExercise(exercise.id, { reps: parseInt(e.target.value) || 1 })}
                                              className="w-16 h-8"
                                              min={1}
                                            />
                                            <span className="text-sm text-muted-foreground">reps</span>
                                          </div>
                                        )}
                                        
                                        {exercise.duration && (
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              value={exercise.duration}
                                              onChange={(e) => handleUpdateExercise(exercise.id, { duration: parseInt(e.target.value) || 1 })}
                                              className="w-16 h-8"
                                              min={1}
                                            />
                                            <span className="text-sm text-muted-foreground">min</span>
                                          </div>
                                        )}
                                        
                                        {exercise.restPeriod && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <Input
                                              type="number"
                                              value={exercise.restPeriod}
                                              onChange={(e) => handleUpdateExercise(exercise.id, { restPeriod: parseInt(e.target.value) || 30 })}
                                              className="w-16 h-8"
                                              min={0}
                                              step={15}
                                            />
                                            <span className="text-sm text-muted-foreground">s rest</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => toggleExerciseExpansion(exercise.id)}
                                    >
                                      {expandedExercises.includes(exercise.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveExercise(exercise.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Expanded Details */}
                                {expandedExercises.includes(exercise.id) && (
                                  <div className="mt-4 pt-4 border-t space-y-3">
                                    <div className="space-y-2">
                                      <Label>{t('physicalTrainer:workoutBuilder.instructions')}</Label>
                                      <Textarea
                                        value={exercise.instructions || ''}
                                        onChange={(e) => handleUpdateExercise(exercise.id, { instructions: e.target.value })}
                                        placeholder={t('physicalTrainer:workoutBuilder.instructionsPlaceholder')}
                                        rows={2}
                                      />
                                    </div>
                                    
                                    {exercise.equipment && exercise.equipment.length > 0 && (
                                      <div>
                                        <Label>{t('physicalTrainer:workoutBuilder.equipment')}</Label>
                                        <div className="flex gap-2 mt-1">
                                          {exercise.equipment.map((item, idx) => (
                                            <Badge key={idx} variant="outline">
                                              {item}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                                      <div>
                                        <Label>{t('physicalTrainer:workoutBuilder.targetMuscles')}</Label>
                                        <div className="flex gap-2 mt-1">
                                          {exercise.targetMuscles.map((muscle, idx) => (
                                            <Badge key={idx} variant="secondary">
                                              {muscle}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Restrictions Warning */}
      {medicalRestrictions.length > 0 && restrictedExercises.size > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:workoutBuilder.restrictionWarning', {
              count: restrictedExercises.size,
              playerCount: medicalRestrictions.length
            })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}