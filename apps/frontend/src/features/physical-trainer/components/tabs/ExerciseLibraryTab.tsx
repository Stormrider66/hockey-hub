'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Library, Play, X, Dumbbell } from 'lucide-react';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import { mockExerciseLibraryStats } from '../../constants/mockData';

interface ExerciseLibraryTabProps {
  // Add any props needed
}

export default function ExerciseLibraryTab(props: ExerciseLibraryTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState<string | undefined>(undefined);
  
  // Fetch exercises from API
  const { data: exercises, isLoading: exercisesLoading } = useGetExercisesQuery({
    category: selectedExerciseCategory,
    search: exerciseSearch
  });

  // Calculate stats from API data
  const displayStats = {
    total: exercises?.length || 0,
    byCategory: exercises?.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    recentlyAdded: exercises?.filter(ex => {
      const created = new Date(ex.orderIndex); // Using orderIndex as timestamp for now
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length || 0,
    withVideos: Math.floor((exercises?.length || 0) * 0.8) // Mock 80% have videos
  };

  const displayExercises = exercises || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('physicalTrainer:exercises.title')}</CardTitle>
              <CardDescription>{t('physicalTrainer:exercises.subtitle')}</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('physicalTrainer:exercises.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(displayStats.byCategory).map(([category, count]) => (
              <Card 
                key={category} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedExerciseCategory === category && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedExerciseCategory(
                  selectedExerciseCategory === category ? undefined : category
                )}
              >
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground capitalize">{category} {t('physicalTrainer:exercises.exercisesCount')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Library className="h-3 w-3 mr-1" />
                {displayStats.total} {t('physicalTrainer:exercises.totalExercises')}
              </Badge>
              <Badge variant="outline">
                <Play className="h-3 w-3 mr-1" />
                {displayStats.withVideos} {t('physicalTrainer:exercises.withVideos')}
              </Badge>
              {selectedExerciseCategory && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedExerciseCategory(undefined)}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('common:actions.clearFilter')}
                </Button>
              )}
            </div>
            <Input 
              placeholder={t('physicalTrainer:exercises.search')} 
              className="max-w-sm"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
            />
          </div>

          {/* Exercise list */}
          {exercisesLoading ? (
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">{t('physicalTrainer:exercises.loading')}</p>
              </div>
            </div>
          ) : displayExercises.length === 0 ? (
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {exerciseSearch || selectedExerciseCategory ? 
                    t('physicalTrainer:exercises.noMatchingExercises') : 
                    t('physicalTrainer:exercises.noExercisesYet')}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-3">
                {displayExercises.map((exercise) => (
                  <Card key={exercise.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{exercise.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {exercise.category}
                              </Badge>
                              {exercise.sets && <span>{exercise.sets} {t('physicalTrainer:workouts.parameters.sets')}</span>}
                              {exercise.reps && <span>× {exercise.reps} {t('physicalTrainer:workouts.parameters.reps')}</span>}
                              {exercise.duration && <span>{exercise.duration}s</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            {t('common:actions.edit')}
                          </Button>
                        </div>
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}