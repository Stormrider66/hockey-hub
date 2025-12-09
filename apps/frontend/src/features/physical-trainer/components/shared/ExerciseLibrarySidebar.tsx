import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  Plus,
  Star,
  Clock,
  Dumbbell,
  Heart,
  Target,
  Brain,
  Activity,
  Users,
  ChevronDown,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from '@/components/icons';
import {
  ExerciseLibrarySidebarProps,
  ExerciseLibraryItem,
  ExercisePhase,
  ExerciseLibraryFilters
} from '../../types/workout-builder.types';

/**
 * Exercise library sidebar component
 * Provides search, filtering, and selection of exercises
 */
export const ExerciseLibrarySidebar: React.FC<ExerciseLibrarySidebarProps> = ({
  exercises,
  filters,
  onFiltersChange,
  onExerciseSelect,
  onExerciseDragStart,
  selectedPhase,
  workoutType,
  isLoading = false,
  onAddCustomExercise,
  onClose
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['strength']);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return Dumbbell;
      case 'conditioning':
        return Heart;
      case 'agility':
        return Target;
      case 'mobility':
        return Activity;
      case 'recovery':
        return Brain;
      case 'skill':
        return Users;
      default:
        return Dumbbell;
    }
  };

  // Get phase color
  const getPhaseColor = (phase: ExercisePhase) => {
    switch (phase) {
      case 'warmup':
        return 'yellow';
      case 'main':
        return 'blue';
      case 'cooldown':
        return 'green';
      case 'recovery':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !exercise.name.toLowerCase().includes(searchLower) &&
          !exercise.description?.toLowerCase().includes(searchLower) &&
          !exercise.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      // Category filter
      if (filters.category?.length && !filters.category.includes(exercise.category)) {
        return false;
      }

      // Phase filter
      if (filters.phase?.length && !filters.phase.includes(exercise.phase)) {
        return false;
      }

      // Equipment filter
      if (filters.equipment?.length) {
        const hasEquipment = filters.equipment.some(eq => 
          exercise.equipment.includes(eq)
        );
        if (!hasEquipment) return false;
      }

      // Difficulty filter
      if (filters.difficulty?.length && !filters.difficulty.includes(exercise.difficulty)) {
        return false;
      }

      // Favorites filter
      if (filters.favorites && !exercise.isFavorite) {
        return false;
      }

      // Recently used filter
      if (filters.recentlyUsed && !exercise.lastUsed) {
        return false;
      }

      return true;
    });
  }, [exercises, filters]);

  // Group exercises by category
  const exercisesByCategory = useMemo(() => {
    return filteredExercises.reduce((acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    }, {} as Record<string, ExerciseLibraryItem[]>);
  }, [filteredExercises]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  // Handle filter change
  const handleFilterChange = (key: keyof ExerciseLibraryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Render exercise item
  const renderExerciseItem = (exercise: ExerciseLibraryItem) => {
    const phaseColor = getPhaseColor(exercise.phase);
    
    return (
      <div
        key={exercise.id}
        className={cn(
          "p-3 bg-white rounded-lg border border-gray-200",
          "hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer",
          "group relative"
        )}
        onClick={() => onExerciseSelect(exercise)}
        draggable={!!onExerciseDragStart}
        onDragStart={() => onExerciseDragStart?.(exercise)}
      >
        {/* Drag handle */}
        {onExerciseDragStart && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}

        <div className={cn(onExerciseDragStart && "pl-6")}>
          {/* Exercise name and favorite */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-sm text-gray-900 flex-1">
              {exercise.name}
            </h4>
            {exercise.isFavorite && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            )}
          </div>

          {/* Phase and difficulty badges */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="secondary"
              className={cn(
                "text-xs capitalize",
                `bg-${phaseColor}-100 text-${phaseColor}-700 border-${phaseColor}-200`
              )}
            >
              {exercise.phase}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {exercise.difficulty}
            </Badge>
          </div>

          {/* Equipment */}
          {exercise.equipment.length > 0 && (
            <div className="text-xs text-gray-600 mb-1">
              {t('physicalTrainer:workoutBuilder.equipment')}: {exercise.equipment.join(', ')}
            </div>
          )}

          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {exercise.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
            {exercise.defaultSets && exercise.defaultReps && (
              <span>{exercise.defaultSets}x{exercise.defaultReps}</span>
            )}
            {exercise.usageCount && exercise.usageCount > 0 && (
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {exercise.usageCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render collapsed state
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
          title={t('physicalTrainer:workoutBuilder.expandLibrary')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div 
          className="text-sm font-medium text-gray-600"
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
        >
          {t('physicalTrainer:workoutBuilder.exerciseLibrary')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            {t('physicalTrainer:workoutBuilder.exerciseLibrary')}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            title={t('physicalTrainer:workoutBuilder.collapseLibrary')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('physicalTrainer:workoutBuilder.searchExercises')}
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:no-underline">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('physicalTrainer:workoutBuilder.filters')}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              filtersOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-0">
              <div className="space-y-3">
                {/* Phase filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {t('physicalTrainer:workoutBuilder.phase')}
                  </label>
                  <Select
                    value={filters.phase?.[0] || 'all'}
                    onValueChange={(value) => 
                      handleFilterChange('phase', value === 'all' ? [] : [value])
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('physicalTrainer:workoutBuilder.allPhases')}
                      </SelectItem>
                      <SelectItem value="warmup">
                        {t('physicalTrainer:workoutBuilder.warmup')}
                      </SelectItem>
                      {workoutType !== 'conditioning' && (
                        <SelectItem value="main">
                          {t('physicalTrainer:workoutBuilder.main')}
                        </SelectItem>
                      )}
                      <SelectItem value="cooldown">
                        {t('physicalTrainer:workoutBuilder.cooldown')}
                      </SelectItem>
                      {workoutType !== 'conditioning' && (
                        <SelectItem value="recovery">
                          {t('physicalTrainer:workoutBuilder.recovery')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty filter */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {t('physicalTrainer:workoutBuilder.difficulty')}
                  </label>
                  <Select
                    value={filters.difficulty?.[0] || 'all'}
                    onValueChange={(value) => 
                      handleFilterChange('difficulty', value === 'all' ? [] : [value])
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('physicalTrainer:workoutBuilder.allLevels')}
                      </SelectItem>
                      <SelectItem value="beginner">
                        {t('physicalTrainer:workoutBuilder.beginner')}
                      </SelectItem>
                      <SelectItem value="intermediate">
                        {t('physicalTrainer:workoutBuilder.intermediate')}
                      </SelectItem>
                      <SelectItem value="advanced">
                        {t('physicalTrainer:workoutBuilder.advanced')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick filters */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filters.favorites ? "default" : "outline"}
                    onClick={() => handleFilterChange('favorites', !filters.favorites)}
                    className="flex-1"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {t('physicalTrainer:workoutBuilder.favorites')}
                  </Button>
                  <Button
                    size="sm"
                    variant={filters.recentlyUsed ? "default" : "outline"}
                    onClick={() => handleFilterChange('recentlyUsed', !filters.recentlyUsed)}
                    className="flex-1"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {t('physicalTrainer:workoutBuilder.recent')}
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Exercise list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : Object.keys(exercisesByCategory).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {t('physicalTrainer:workoutBuilder.noExercisesFound')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => {
                const Icon = getCategoryIcon(category);
                const isExpanded = expandedCategories.includes(category);
                
                return (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium capitalize">
                          {t(`physicalTrainer:workoutBuilder.categories.${category}`)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryExercises.length}
                        </Badge>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "w-4 h-4 text-gray-400 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {categoryExercises.map(renderExerciseItem)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer actions */}
      {onAddCustomExercise && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <Button
            onClick={onAddCustomExercise}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('physicalTrainer:workoutBuilder.addCustomExercise')}
          </Button>
        </div>
      )}
    </div>
  );
};