import React, { useState, useMemo, useCallback, CSSProperties, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Star, Clock, Dumbbell, Heart, Activity, Zap, RotateCcw } from 'lucide-react';
import { useGetExercisesQuery } from '@/store/api/trainingApi';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { 
  ExerciseFilters, 
  DroppableExercise, 
  DragItem,
  SessionPhaseType,
  StrengthMode
} from '../../types/session-builder.types';
import { filterExercisesByMode } from '../../config/strengthModeConfig';

interface ExerciseLibraryProps {
  filters: ExerciseFilters;
  onFilterChange: (filters: ExerciseFilters) => void;
}

interface ExerciseCardProps {
  exercise: DroppableExercise;
}

const ExerciseCard: React.FC<ExerciseCardProps & { style?: CSSProperties }> = memo(({ exercise, style }) => {
  const dragItem: DragItem = {
    id: exercise.id,
    type: 'exercise',
    exercise
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: exercise.id,
    data: dragItem
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  const combinedStyle = {
    ...style,
    ...dragStyle
  };

  return (
    <Card
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'z-50 shadow-lg' : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm truncate flex-1">{exercise.name}</h4>
          <Badge variant={
            exercise.difficulty === 'beginner' ? 'secondary' :
            exercise.difficulty === 'intermediate' ? 'default' :
            'destructive'
          } className="text-xs flex-shrink-0">
            {exercise.difficulty}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{exercise.defaultSets} sets</span>
          {exercise.defaultReps && <span>× {exercise.defaultReps} reps</span>}
          {exercise.defaultDuration && <span>× {exercise.defaultDuration}s</span>}
        </div>
        
        <div className="flex flex-wrap gap-1">
          {exercise.equipment.slice(0, 2).map((equip, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {equip}
            </Badge>
          ))}
          {exercise.equipment.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{exercise.equipment.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
});

const categoryIcons: Record<SessionPhaseType, React.ReactNode> = {
  warmup: <Heart className="h-4 w-4" />,
  main: <Dumbbell className="h-4 w-4" />,
  accessory: <Activity className="h-4 w-4" />,
  core: <Zap className="h-4 w-4" />,
  cooldown: <RotateCcw className="h-4 w-4" />
};

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = memo(({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch exercises from API
  const { data: exercisesData, isLoading } = useGetExercisesQuery({
    organizationId: 'current' // TODO: Get from context
  });

  // Transform API data to DroppableExercise format
  const exercises: DroppableExercise[] = useMemo(() => {
    if (!exercisesData?.exercises) return [];
    
    return exercisesData.exercises.map(ex => ({
      id: ex.id,
      templateId: ex.id,
      name: ex.name,
      category: ex.category || 'main',
      equipment: ex.equipment || [],
      muscleGroups: ex.muscleGroups || [],
      defaultSets: ex.sets || 3,
      defaultReps: ex.reps,
      defaultDuration: ex.duration,
      restPeriod: ex.restPeriod || 60,
      videoUrl: ex.videoUrl,
      thumbnailUrl: ex.thumbnailUrl,
      difficulty: ex.difficulty || 'intermediate',
      instructions: ex.instructions,
      coachingCues: ex.coachingCues
    }));
  }, [exercisesData]);

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    let filtered = [...exercises];

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(ex => ex.category === filters.category);
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchLower) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchLower)) ||
        ex.equipment.some(eq => eq.toLowerCase().includes(searchLower))
      );
    }

    // Equipment filter
    if (filters.equipment.length > 0) {
      filtered = filtered.filter(ex => 
        filters.equipment.some(equip => ex.equipment.includes(equip))
      );
    }

    // Muscle group filter
    if (filters.muscleGroups.length > 0) {
      filtered = filtered.filter(ex => 
        filters.muscleGroups.some(mg => ex.muscleGroups.includes(mg))
      );
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === filters.difficulty);
    }

    // Strength mode filter - filter exercises by mode-specific categories
    if (filters.strengthMode) {
      filtered = filterExercisesByMode(filtered, filters.strengthMode);
    }

    return filtered;
  }, [exercises, filters]);

  // Mock data for most used exercises (TODO: Replace with actual API data)
  const mostUsedExercises = filteredExercises.slice(0, 5);

  const handleCategoryChange = useCallback((category: SessionPhaseType | 'all') => {
    onFilterChange({ ...filters, category });
  }, [filters, onFilterChange]);

  const handleSearchChange = useCallback((value: string) => {
    onFilterChange({ ...filters, searchTerm: value });
  }, [filters, onFilterChange]);

  const handleDifficultyChange = useCallback((difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all') => {
    onFilterChange({ ...filters, difficulty });
  }, [filters, onFilterChange]);

  const resetFilters = useCallback(() => {
    onFilterChange({
      category: 'all',
      equipment: [],
      muscleGroups: [],
      difficulty: 'all',
      searchTerm: '',
      showMostUsed: false
    });
  }, [onFilterChange]);

  // Render callback for virtualized list
  const renderExerciseItem = useCallback(({ item: exercise, style }: { item: DroppableExercise; style: CSSProperties }) => {
    return (
      <div style={style} className="pb-2">
        <ExerciseCard exercise={exercise} />
      </div>
    );
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <h3 className="font-semibold text-lg">Exercise Library</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          
          <Select value={filters.difficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          {(filters.equipment.length > 0 || filters.muscleGroups.length > 0 || 
            filters.difficulty !== 'all' || filters.searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <Card className="p-3 space-y-2">
            <p className="text-sm font-medium">Additional Filters</p>
            {/* TODO: Add equipment and muscle group filters */}
            <p className="text-xs text-muted-foreground">Equipment and muscle group filters coming soon</p>
          </Card>
        )}
      </div>

      {/* Category tabs */}
      <Tabs 
        value={filters.category} 
        onValueChange={(value) => handleCategoryChange(value as SessionPhaseType | 'all')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start px-2 h-10 overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="text-xs px-2 min-w-fit">All</TabsTrigger>
          <TabsTrigger value="warmup" className="text-xs px-2 min-w-fit">
            {categoryIcons.warmup}
            <span className="ml-1 hidden sm:inline">Warm Up</span>
          </TabsTrigger>
          <TabsTrigger value="main" className="text-xs px-2 min-w-fit">
            {categoryIcons.main}
            <span className="ml-1 hidden sm:inline">Main</span>
          </TabsTrigger>
          <TabsTrigger value="accessory" className="text-xs px-2 min-w-fit">
            {categoryIcons.accessory}
            <span className="ml-1 hidden sm:inline">Accessory</span>
          </TabsTrigger>
          <TabsTrigger value="core" className="text-xs px-2 min-w-fit">
            {categoryIcons.core}
            <span className="ml-1 hidden sm:inline">Core</span>
          </TabsTrigger>
          <TabsTrigger value="cooldown" className="text-xs px-2 min-w-fit">
            {categoryIcons.cooldown}
            <span className="ml-1 hidden sm:inline">Cool Down</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filters.category} className="flex-1 p-0">
          <div className="h-full flex flex-col">
            {/* Header section */}
            <div className="p-4 pb-2">
              {/* Most used section */}
              {filters.showMostUsed && mostUsedExercises.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Most Used
                  </div>
                  <div className="space-y-2">
                    {mostUsedExercises.map(exercise => (
                      <ExerciseCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                </div>
              )}

              {/* All exercises header */}
              {!filters.showMostUsed && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {filteredExercises.length} exercises
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange({ ...filters, showMostUsed: true })}
                    className="text-xs"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Show most used
                  </Button>
                </div>
              )}
            </div>

            {/* Virtualized list */}
            <div className="flex-1 px-4">
              {filteredExercises.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No exercises found</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={resetFilters}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </Card>
              ) : (
                <VirtualizedList
                  items={filteredExercises}
                  height={400}
                  itemHeight={100}
                  renderItem={renderExerciseItem}
                  emptyMessage="No exercises found"
                  overscan={3}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});