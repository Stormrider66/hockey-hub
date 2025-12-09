import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Search, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  TemplateCategory,
  CategoryType,
  CategoryHierarchy,
  DEFAULT_CATEGORY_COLORS,
  DEFAULT_CATEGORY_ICONS
} from '../../types/template.types';

interface CategorySelectorProps {
  categories: TemplateCategory[];
  selectedCategoryIds?: string[];
  onCategoryChange?: (categoryIds: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showCounts?: boolean;
  categoryCounts?: Map<string, number>;
  maxHeight?: string;
  groupByType?: boolean;
  showIcons?: boolean;
  variant?: 'default' | 'inline' | 'compact';
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryIds = [],
  onCategoryChange,
  multiSelect = true,
  placeholder = 'Select categories...',
  disabled = false,
  showCounts = false,
  categoryCounts,
  maxHeight = '300px',
  groupByType = true,
  showIcons = true,
  variant = 'default',
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Build category hierarchy
  const categoryHierarchy = useMemo(() => {
    const buildHierarchy = (
      cats: TemplateCategory[],
      parentId: string | null = null
    ): CategoryHierarchy[] => {
      return cats
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => ({
          category: cat,
          children: buildHierarchy(cats, cat.id),
          depth: 0,
          path: []
        }));
    };

    return buildHierarchy(categories);
  }, [categories]);

  // Group categories by type
  const categoriesByType = useMemo(() => {
    if (!groupByType) return null;

    const grouped = new Map<CategoryType, TemplateCategory[]>();
    
    categories.forEach(cat => {
      let type: CategoryType = CategoryType.CUSTOM;
      
      if (cat.isSystem) {
        const slug = cat.slug.toLowerCase();
        if (slug.includes('strength') || slug.includes('conditioning') || 
            slug.includes('hybrid') || slug.includes('agility')) {
          type = CategoryType.BY_TYPE;
        } else if (slug.includes('body') || slug.includes('cardio') || 
                   slug.includes('mobility') || slug.includes('recovery')) {
          type = CategoryType.BY_FOCUS;
        } else if (slug.includes('beginner') || slug.includes('intermediate') || 
                   slug.includes('advanced') || slug.includes('elite')) {
          type = CategoryType.BY_LEVEL;
        } else if (slug.includes('quick') || slug.includes('standard') || 
                   slug.includes('extended')) {
          type = CategoryType.BY_DURATION;
        } else if (slug.includes('season') || slug.includes('playoffs')) {
          type = CategoryType.BY_SEASON;
        }
      }
      
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(cat);
    });
    
    return grouped;
  }, [categories, groupByType]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchValue) return categories;
    
    const search = searchValue.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(search) ||
      cat.description?.toLowerCase().includes(search)
    );
  }, [categories, searchValue]);

  // Get selected category objects
  const selectedCategories = useMemo(() => {
    return categories.filter(cat => selectedCategoryIds.includes(cat.id));
  }, [categories, selectedCategoryIds]);

  const handleSelect = (categoryId: string) => {
    if (!onCategoryChange) return;

    if (multiSelect) {
      const newSelection = selectedCategoryIds.includes(categoryId)
        ? selectedCategoryIds.filter(id => id !== categoryId)
        : [...selectedCategoryIds, categoryId];
      onCategoryChange(newSelection);
    } else {
      onCategoryChange([categoryId]);
      setOpen(false);
    }
  };

  const handleRemove = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCategoryChange) return;
    
    const newSelection = selectedCategoryIds.filter(id => id !== categoryId);
    onCategoryChange(newSelection);
  };

  const renderCategoryItem = (category: TemplateCategory, depth = 0) => {
    const isSelected = selectedCategoryIds.includes(category.id);
    const count = categoryCounts?.get(category.id);

    return (
      <CommandItem
        key={category.id}
        value={category.id}
        onSelect={() => handleSelect(category.id)}
        className={cn(
          "flex items-center gap-2 cursor-pointer",
          depth > 0 && "ml-4"
        )}
      >
        {multiSelect && (
          <div className={cn(
            "h-4 w-4 border rounded flex items-center justify-center",
            isSelected && "bg-primary border-primary"
          )}>
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        )}
        
        {showIcons && (
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-sm"
            style={{ backgroundColor: category.color || '#e2e8f0' }}
          >
            {category.icon || <Folder className="h-3 w-3" />}
          </div>
        )}
        
        <span className="flex-1">{category.name}</span>
        
        {showCounts && count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </CommandItem>
    );
  };

  const renderGroupedCategories = () => {
    if (!categoriesByType) return null;

    const typeLabels: Record<CategoryType, string> = {
      [CategoryType.BY_TYPE]: 'Workout Type',
      [CategoryType.BY_FOCUS]: 'Focus Area',
      [CategoryType.BY_LEVEL]: 'Difficulty Level',
      [CategoryType.BY_DURATION]: 'Duration',
      [CategoryType.BY_SEASON]: 'Season',
      [CategoryType.CUSTOM]: 'Custom Categories'
    };

    return (
      <>
        {Array.from(categoriesByType.entries()).map(([type, cats]) => {
          const filteredCats = cats.filter(cat => 
            !searchValue || filteredCategories.includes(cat)
          );
          
          if (filteredCats.length === 0) return null;

          return (
            <CommandGroup key={type} heading={typeLabels[type]}>
              {filteredCats.map(cat => renderCategoryItem(cat))}
            </CommandGroup>
          );
        })}
      </>
    );
  };

  const renderHierarchicalCategories = (nodes: CategoryHierarchy[], depth = 0) => {
    return nodes.map(node => {
      const isVisible = !searchValue || filteredCategories.includes(node.category);
      
      if (!isVisible) return null;

      return (
        <React.Fragment key={node.category.id}>
          {renderCategoryItem(node.category, depth)}
          {node.children.length > 0 && renderHierarchicalCategories(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  // Render based on variant
  if (variant === 'inline') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {selectedCategories.map(cat => (
          <Badge
            key={cat.id}
            variant="secondary"
            className="pr-1"
          >
            {showIcons && cat.icon && (
              <span className="mr-1">{cat.icon}</span>
            )}
            {cat.name}
            <button
              onClick={(e) => handleRemove(cat.id, e)}
              className="ml-1 hover:bg-muted rounded p-0.5"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Category
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search categories..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <ScrollArea style={{ maxHeight }}>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    {groupByType ? renderGroupedCategories() : renderHierarchicalCategories(categoryHierarchy)}
                  </ScrollArea>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {selectedCategories.length > 0 ? (
          <>
            <Badge variant="secondary">
              {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'}
            </Badge>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange?.([])}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedCategories.length > 0 ? (
            <div className="flex items-center gap-2 flex-1 text-left overflow-hidden">
              {multiSelect ? (
                <span className="truncate">
                  {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                </span>
              ) : (
                <div className="flex items-center gap-2 truncate">
                  {showIcons && selectedCategories[0].icon && (
                    <span>{selectedCategories[0].icon}</span>
                  )}
                  <span className="truncate">{selectedCategories[0].name}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <ScrollArea style={{ maxHeight }}>
              <CommandEmpty>No categories found.</CommandEmpty>
              {groupByType ? renderGroupedCategories() : renderHierarchicalCategories(categoryHierarchy)}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};