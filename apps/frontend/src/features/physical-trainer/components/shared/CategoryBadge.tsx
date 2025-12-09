import React from 'react';
import { X, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TemplateCategory } from '../../types/template.types';

interface CategoryBadgeProps {
  category: TemplateCategory;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  showIcon?: boolean;
  showTooltip?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  variant = 'secondary',
  showIcon = true,
  showTooltip = true,
  removable = false,
  onClick,
  onRemove,
  className
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const badgeContent = (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        'inline-flex items-center gap-1.5',
        className
      )}
      onClick={handleClick}
      style={{
        backgroundColor: variant === 'default' && category.color ? category.color : undefined,
        borderColor: variant === 'outline' && category.color ? category.color : undefined,
        color: variant === 'outline' && category.color ? category.color : undefined
      }}
    >
      {showIcon && (
        <span className={cn("shrink-0", iconSizes[size])}>
          {category.icon || <Folder className={iconSizes[size]} />}
        </span>
      )}
      
      <span className="truncate">{category.name}</span>
      
      {removable && (
        <button
          onClick={handleRemove}
          className={cn(
            "shrink-0 ml-1 hover:opacity-70",
            iconSizes[size]
          )}
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </Badge>
  );

  if (showTooltip && category.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{category.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
};

// Category Badge Group Component
interface CategoryBadgeGroupProps {
  categories: TemplateCategory[];
  size?: CategoryBadgeProps['size'];
  variant?: CategoryBadgeProps['variant'];
  showIcon?: boolean;
  showTooltip?: boolean;
  removable?: boolean;
  maxVisible?: number;
  onCategoryClick?: (category: TemplateCategory) => void;
  onCategoryRemove?: (category: TemplateCategory) => void;
  className?: string;
}

export const CategoryBadgeGroup: React.FC<CategoryBadgeGroupProps> = ({
  categories,
  size = 'md',
  variant = 'secondary',
  showIcon = true,
  showTooltip = true,
  removable = false,
  maxVisible = 5,
  onCategoryClick,
  onCategoryRemove,
  className
}) => {
  const visibleCategories = categories.slice(0, maxVisible);
  const hiddenCount = categories.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visibleCategories.map(category => (
        <CategoryBadge
          key={category.id}
          category={category}
          size={size}
          variant={variant}
          showIcon={showIcon}
          showTooltip={showTooltip}
          removable={removable}
          onClick={() => onCategoryClick?.(category)}
          onRemove={() => onCategoryRemove?.(category)}
        />
      ))}
      
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  size === 'sm' ? 'text-xs px-2 py-0.5' : 
                  size === 'lg' ? 'text-base px-3 py-1' : 
                  'text-sm px-2.5 py-0.5'
                )}
              >
                +{hiddenCount} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {categories.slice(maxVisible).map(category => (
                  <div key={category.id} className="text-sm">
                    {category.icon && <span className="mr-1">{category.icon}</span>}
                    {category.name}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

// Minimal Category Indicator
interface CategoryIndicatorProps {
  categories: TemplateCategory[];
  size?: 'sm' | 'md' | 'lg';
  maxColors?: number;
  className?: string;
}

export const CategoryIndicator: React.FC<CategoryIndicatorProps> = ({
  categories,
  size = 'md',
  maxColors = 3,
  className
}) => {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
  };

  const visibleCategories = categories.slice(0, maxColors);

  if (categories.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center", className)}>
            {visibleCategories.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "rounded-full",
                  sizeClasses[size],
                  index > 0 && "-ml-1"
                )}
                style={{
                  backgroundColor: category.color || '#e2e8f0',
                  zIndex: visibleCategories.length - index
                }}
              />
            ))}
            {categories.length > maxColors && (
              <span className="ml-1 text-xs text-muted-foreground">
                +{categories.length - maxColors}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {categories.map(category => (
              <div key={category.id} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: category.color || '#e2e8f0' }}
                />
                {category.icon && <span>{category.icon}</span>}
                <span>{category.name}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};