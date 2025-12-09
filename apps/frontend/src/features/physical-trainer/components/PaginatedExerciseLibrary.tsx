import React from 'react';
import { useGetExercisesPaginatedQuery } from '@/store/api/trainingApiPaginated';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Dumbbell, 
  Target, 
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginatedExerciseLibraryProps {
  onExerciseSelect?: (exercise: any) => void;
  selectedExerciseIds?: string[];
  multiSelect?: boolean;
  showFilters?: boolean;
  className?: string;
}

export function PaginatedExerciseLibrary({
  onExerciseSelect,
  selectedExerciseIds = [],
  multiSelect = false,
  showFilters = true,
  className,
}: PaginatedExerciseLibraryProps) {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [equipment, setEquipment] = React.useState<string[]>([]);
  const [difficulty, setDifficulty] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = React.useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    isFetching,
    error,
    nextPage,
    previousPage,
    gotoPage,
    setPageSize,
  } = usePaginatedQuery(useGetExercisesPaginatedQuery, {
    page: 1,
    pageSize: 20,
    search: debouncedSearch,
    category: category || undefined,
    equipment: equipment.length > 0 ? equipment : undefined,
    difficulty: difficulty || undefined,
  });

  const categories = [
    'Strength',
    'Conditioning',
    'Mobility',
    'Power',
    'Core',
    'Balance',
    'Plyometric',
    'Recovery',
  ];

  const equipmentOptions = [
    'Barbell',
    'Dumbbell',
    'Kettlebell',
    'Cable Machine',
    'Resistance Band',
    'Medicine Ball',
    'TRX',
    'Bodyweight',
    'Rowing Machine',
    'Bike',
    'Treadmill',
  ];

  const toggleEquipment = (item: string) => {
    setEquipment(prev =>
      prev.includes(item)
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  const handleExerciseClick = (exercise: any) => {
    if (multiSelect) {
      onExerciseSelect?.(exercise);
    } else {
      setExpandedExerciseId(
        expandedExerciseId === exercise.id ? null : exercise.id
      );
    }
  };

  const ExerciseCard = ({ exercise }: { exercise: any }) => {
    const isExpanded = expandedExerciseId === exercise.id;
    const isSelected = selectedExerciseIds.includes(exercise.id);

    return (
      <Card
        className={cn(
          "transition-all cursor-pointer",
          isSelected && "ring-2 ring-primary",
          isExpanded && "shadow-lg"
        )}
        onClick={() => handleExerciseClick(exercise)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {multiSelect && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onExerciseSelect?.(exercise);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <h4 className="font-semibold">{exercise.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {exercise.category}
                </Badge>
                {exercise.difficulty && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      exercise.difficulty === 'beginner' && "text-green-600",
                      exercise.difficulty === 'intermediate' && "text-yellow-600",
                      exercise.difficulty === 'advanced' && "text-red-600"
                    )}
                  >
                    {exercise.difficulty}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {exercise.description || 'No description available'}
              </p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                {exercise.equipment?.map((eq: string) => (
                  <Badge key={eq} variant="secondary">
                    {eq}
                  </Badge>
                ))}
                {exercise.muscleGroups?.map((mg: string) => (
                  <Badge key={mg} variant="outline">
                    <Target className="h-3 w-3 mr-1" />
                    {mg}
                  </Badge>
                ))}
                {exercise.duration && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {exercise.duration}s
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedExerciseId(isExpanded ? null : exercise.id);
              }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {exercise.instructions && (
                <div>
                  <h5 className="font-medium text-sm mb-1">Instructions:</h5>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    {exercise.instructions.map((instruction: string, idx: number) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {exercise.tips && (
                <div>
                  <h5 className="font-medium text-sm mb-1">Tips:</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {exercise.tips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!multiSelect && (
                <Button
                  className="w-full"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExerciseSelect?.(exercise);
                  }}
                >
                  Select Exercise
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ExerciseSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Exercise Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Basic Filters */}
          {showFilters && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All difficulties</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
              
              {/* Equipment Filter */}
              {showAdvancedFilters && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Equipment:</p>
                  <div className="flex flex-wrap gap-2">
                    {equipmentOptions.map((item) => (
                      <Badge
                        key={item}
                        variant={equipment.includes(item) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleEquipment(item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Exercise List */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            <ExerciseSkeleton />
            <ExerciseSkeleton />
            <ExerciseSkeleton />
          </>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">Failed to load exercises</p>
            </CardContent>
          </Card>
        ) : data?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500">No exercises found</p>
            </CardContent>
          </Card>
        ) : (
          data?.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <DataTablePagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={total}
          totalPages={totalPages}
          onPageChange={gotoPage}
          onPageSizeChange={setPageSize}
          itemName="exercise"
          itemNamePlural="exercises"
          className={cn(isFetching && "opacity-60")}
        />
      )}
    </div>
  );
}