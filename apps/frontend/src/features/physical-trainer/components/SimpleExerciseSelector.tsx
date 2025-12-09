'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from '@/components/icons';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  category?: string;
  targetMuscles?: string[];
  equipment?: string[];
  difficulty?: string;
}

interface SimpleExerciseSelectorProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  selectedExercises?: string[];
  className?: string;
}

export default function SimpleExerciseSelector({
  exercises,
  onSelect,
  selectedExercises = [],
  className
}: SimpleExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return exercises;
    
    const term = searchTerm.toLowerCase();
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(term) ||
      exercise.category?.toLowerCase().includes(term) ||
      exercise.targetMuscles?.some(muscle => muscle.toLowerCase().includes(term)) ||
      exercise.equipment?.some(eq => eq.toLowerCase().includes(term))
    );
  }, [exercises, searchTerm]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <ScrollArea className="h-[200px] border rounded-md p-2">
        <div className="space-y-1">
          {filteredExercises.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No exercises found
            </p>
          ) : (
            filteredExercises.map(exercise => {
              const isSelected = selectedExercises.includes(exercise.id);
              
              return (
                <div
                  key={exercise.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors",
                    isSelected && "bg-gray-100"
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {exercise.category && (
                        <Badge variant="outline" className="text-xs">
                          {exercise.category}
                        </Badge>
                      )}
                      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {exercise.targetMuscles.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "secondary" : "outline"}
                    onClick={() => onSelect(exercise)}
                    disabled={isSelected}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}