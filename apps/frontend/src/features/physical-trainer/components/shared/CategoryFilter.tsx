import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  ChevronDown, 
  RotateCcw,
  Settings,
  BookmarkPlus,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  TemplateCategory,
  CategoryType,
  TemplateSearchOptions
} from '../../types/template.types';
import { WorkoutType } from '../../types/validation.types';
import { CategorySelector } from './CategorySelector';
import { CategoryBadgeGroup } from './CategoryBadge';

interface CategoryFilterProps {
  categories: TemplateCategory[];
  searchOptions: TemplateSearchOptions;
  onSearchOptionsChange: (options: TemplateSearchOptions) => void;
  totalResults?: number;
  showQuickFilters?: boolean;
  showSaveFilter?: boolean;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: SavedFilter) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  className?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  searchOptions: TemplateSearchOptions;
  createdAt: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  searchOptions,
  onSearchOptionsChange,
  totalResults,
  showQuickFilters = true,
  showSaveFilter = true,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  // Get selected categories
  const selectedCategories = useMemo(() => {
    if (!searchOptions.categoryIds) return [];
    return categories.filter(cat => searchOptions.categoryIds!.includes(cat.id));
  }, [categories, searchOptions.categoryIds]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchOptions.query) count++;
    if (searchOptions.type) count++;
    if (searchOptions.categoryIds?.length) count++;
    if (searchOptions.tags?.length) count++;
    if (searchOptions.difficulty?.length) count++;
    if (searchOptions.durationRange?.min || searchOptions.durationRange?.max) count++;
    if (searchOptions.equipment?.length) count++;
    if (searchOptions.createdBy) count++;
    if (searchOptions.isPublic !== undefined) count++;
    return count;
  }, [searchOptions]);

  const handleReset = () => {
    onSearchOptionsChange({
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const updateSearchOptions = (updates: Partial<TemplateSearchOptions>) => {
    onSearchOptionsChange({ ...searchOptions, ...updates });
  };

  const handleSaveCurrentFilter = () => {
    if (!saveFilterName.trim() || !onSaveFilter) return;

    const filter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName.trim(),
      searchOptions: { ...searchOptions },
      createdAt: new Date().toISOString()
    };

    onSaveFilter(filter);
    setSaveFilterName('');
  };

  const quickFilters = [
    {
      label: 'Strength',
      onClick: () => updateSearchOptions({ type: WorkoutType.STRENGTH, categoryIds: [] })
    },
    {
      label: 'Conditioning',
      onClick: () => updateSearchOptions({ type: WorkoutType.CONDITIONING, categoryIds: [] })
    },
    {
      label: 'Hybrid',
      onClick: () => updateSearchOptions({ type: WorkoutType.HYBRID, categoryIds: [] })
    },
    {
      label: 'Agility',
      onClick: () => updateSearchOptions({ type: WorkoutType.AGILITY, categoryIds: [] })
    },
    {
      label: 'Beginner',
      onClick: () => updateSearchOptions({ difficulty: ['beginner'], categoryIds: [] })
    },
    {
      label: 'Advanced',
      onClick: () => updateSearchOptions({ difficulty: ['advanced', 'elite'], categoryIds: [] })
    },
    {
      label: 'Quick (<30min)',
      onClick: () => updateSearchOptions({ durationRange: { max: 30 }, categoryIds: [] })
    },
    {
      label: 'Extended (60min+)',
      onClick: () => updateSearchOptions({ durationRange: { min: 60 }, categoryIds: [] })
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search templates..."
          value={searchOptions.query || ''}
          onChange={(e) => updateSearchOptions({ query: e.target.value })}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={filter.onClick}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
            {totalResults !== undefined && (
              <Badge variant="secondary">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Categories</Label>
          <CategoryBadgeGroup
            categories={selectedCategories}
            removable
            onCategoryRemove={(category) => {
              const newCategoryIds = (searchOptions.categoryIds || [])
                .filter(id => id !== category.id);
              updateSearchOptions({ categoryIds: newCategoryIds });
            }}
          />
        </div>
      )}

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filter Templates</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  Reset All
                </Button>
              </div>

              <Separator />

              <ScrollArea className="h-96">
                <div className="space-y-4 pr-4">
                  {/* Categories */}
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <CategorySelector
                      categories={categories}
                      selectedCategoryIds={searchOptions.categoryIds}
                      onCategoryChange={(categoryIds) => updateSearchOptions({ categoryIds })}
                      placeholder="Select categories..."
                      maxHeight="200px"
                    />
                  </div>

                  {/* Workout Type */}
                  <div className="space-y-2">
                    <Label>Workout Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={searchOptions.type || ''}
                      onChange={(e) => updateSearchOptions({ 
                        type: e.target.value ? e.target.value as WorkoutType : undefined 
                      })}
                    >
                      <option value="">All Types</option>
                      <option value={WorkoutType.STRENGTH}>Strength</option>
                      <option value={WorkoutType.CONDITIONING}>Conditioning</option>
                      <option value={WorkoutType.HYBRID}>Hybrid</option>
                      <option value={WorkoutType.AGILITY}>Agility</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <div className="space-y-2">
                      {['beginner', 'intermediate', 'advanced', 'elite'].map(level => (
                        <div key={level} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`difficulty-${level}`}
                            checked={searchOptions.difficulty?.includes(level as any) || false}
                            onChange={(e) => {
                              const current = searchOptions.difficulty || [];
                              const updated = e.target.checked
                                ? [...current, level as any]
                                : current.filter(d => d !== level);
                              updateSearchOptions({ difficulty: updated.length ? updated : undefined });
                            }}
                          />
                          <Label htmlFor={`difficulty-${level}`} className="text-sm capitalize">
                            {level}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration Range */}
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={searchOptions.durationRange?.min || ''}
                          onChange={(e) => updateSearchOptions({
                            durationRange: {
                              ...searchOptions.durationRange,
                              min: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={searchOptions.durationRange?.max || ''}
                          onChange={(e) => updateSearchOptions({
                            durationRange: {
                              ...searchOptions.durationRange,
                              max: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="space-y-2">
                    <Label>Equipment</Label>
                    <Input
                      placeholder="Equipment names (comma-separated)"
                      value={searchOptions.equipment?.join(', ') || ''}
                      onChange={(e) => {
                        const equipment = e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                        updateSearchOptions({ equipment: equipment.length ? equipment : undefined });
                      }}
                    />
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="visibility-all"
                          name="visibility"
                          checked={searchOptions.isPublic === undefined}
                          onChange={() => updateSearchOptions({ isPublic: undefined })}
                        />
                        <Label htmlFor="visibility-all" className="text-sm">All Templates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="visibility-public"
                          name="visibility"
                          checked={searchOptions.isPublic === true}
                          onChange={() => updateSearchOptions({ isPublic: true })}
                        />
                        <Label htmlFor="visibility-public" className="text-sm">Public Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="visibility-private"
                          name="visibility"
                          checked={searchOptions.isPublic === false}
                          onChange={() => updateSearchOptions({ isPublic: false })}
                        />
                        <Label htmlFor="visibility-private" className="text-sm">Private Only</Label>
                      </div>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={searchOptions.sortBy || 'name'}
                        onChange={(e) => updateSearchOptions({ sortBy: e.target.value as any })}
                      >
                        <option value="name">Name</option>
                        <option value="usageCount">Usage Count</option>
                        <option value="rating">Rating</option>
                        <option value="lastUsed">Last Used</option>
                        <option value="created">Created Date</option>
                      </select>
                      <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={searchOptions.sortOrder || 'asc'}
                        onChange={(e) => updateSearchOptions({ sortOrder: e.target.value as any })}
                      >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                      </select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved Filters */}
        {showSaveFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Save Current Filter */}
              {activeFilterCount > 0 && (
                <>
                  <div className="p-2 space-y-2">
                    <Input
                      placeholder="Filter name..."
                      value={saveFilterName}
                      onChange={(e) => setSaveFilterName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveCurrentFilter();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentFilter}
                      disabled={!saveFilterName.trim()}
                      className="w-full"
                    >
                      Save Current Filter
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Saved Filters List */}
              {savedFilters.length > 0 ? (
                savedFilters.map(filter => (
                  <DropdownMenuItem
                    key={filter.id}
                    onClick={() => onLoadFilter?.(filter)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{filter.name}</div>
                      {filter.description && (
                        <div className="text-xs text-muted-foreground">
                          {filter.description}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No saved filters
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};