'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Dumbbell, 
  Heart, 
  Timer, 
  Activity,
  AlertTriangle,
  GripVertical,
  Clock,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '../../types';

interface ExerciseLibraryProps {
  exercises: Exercise[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  restrictedExercises?: string[];
}

interface DraggableExerciseProps {
  exercise: Exercise;
  isRestricted?: boolean;
}

const EXERCISE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'strength', label: 'Strength', icon: Dumbbell },
  { value: 'conditioning', label: 'Conditioning', icon: Heart },
  { value: 'agility', label: 'Agility', icon: Timer },
  { value: 'mobility', label: 'Mobility', icon: Activity },
  { value: 'recovery', label: 'Recovery', icon: Activity },
  { value: 'skill', label: 'Skill', icon: Activity }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'strength':
      return Dumbbell;
    case 'conditioning':
    case 'cardio':
      return Heart;
    case 'agility':
    case 'speed':
      return Timer;
    default:
      return Activity;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'strength':
      return 'bg-blue-500';
    case 'conditioning':
    case 'cardio':
      return 'bg-red-500';
    case 'agility':
    case 'speed':
      return 'bg-yellow-500';
    case 'mobility':
      return 'bg-green-500';
    case 'recovery':
      return 'bg-purple-500';
    case 'skill':
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
};

function DraggableExercise({ exercise, isRestricted }: DraggableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: exercise.id,
    data: {
      type: 'library-exercise',
      exercise
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const Icon = getCategoryIcon(exercise.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50"
      )}
    >
      <Card 
        className={cn(
          "cursor-move transition-all hover:shadow-md",
          isDragging && "opacity-50",
          isRestricted && "opacity-60"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div 
              {...attributes} 
              {...listeners}
              className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Exercise Icon */}
            <div className={cn(
              "p-2 rounded-full text-white",
              getCategoryColor(exercise.category)
            )}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Exercise Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {exercise.category}
                </Badge>
                {exercise.sets && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Repeat className="h-3 w-3 mr-1" />
                    {exercise.sets} sets
                  </span>
                )}
                {exercise.duration && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {exercise.duration}s
                  </span>
                )}
              </div>
              {exercise.equipment && exercise.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.equipment.slice(0, 2).map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  {exercise.equipment.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{exercise.equipment.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Restriction Warning */}
            {isRestricted && (
              <div className="text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExerciseLibrary({
  exercises,
  loading,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  restrictedExercises = []
}: ExerciseLibraryProps) {
  // Filter exercises based on search
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !searchQuery || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      exercise.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Check if exercise is restricted
  const isExerciseRestricted = (exercise: Exercise) => {
    return restrictedExercises.some(restriction => 
      exercise.name.toLowerCase().includes(restriction.toLowerCase()) ||
      exercise.category.toLowerCase().includes(restriction.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXERCISE_CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  {category.icon && <category.icon className="h-4 w-4" />}
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercise List */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No exercises found matching your criteria' 
                : 'No exercises available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {filteredExercises.map(exercise => (
              <DraggableExercise
                key={exercise.id}
                exercise={exercise}
                isRestricted={isExerciseRestricted(exercise)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
        <p>• Drag exercises to the timeline to add them</p>
        <p>• Exercises with <AlertTriangle className="h-3 w-3 inline text-destructive" /> may be restricted for some players</p>
      </div>
    </div>
  );
}