import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  Users,
  Dumbbell,
  Star,
  TrendingUp,
  CheckCircle
} from '@/components/icons';
import { WorkoutType } from '../../types';
import { WorkoutTemplateSelection } from '../../types/workout-builder.types';

export interface WorkoutTemplateCardProps {
  template: WorkoutTemplateSelection;
  onSelect: () => void;
  isSelected?: boolean;
  workoutType: WorkoutType;
}

export const WorkoutTemplateCard: React.FC<WorkoutTemplateCardProps> = ({
  template,
  onSelect,
  isSelected = false,
  workoutType
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Get workout type color
  const getWorkoutTypeColor = () => {
    switch (workoutType) {
      case 'strength':
        return 'blue';
      case 'conditioning':
        return 'red';
      case 'hybrid':
        return 'purple';
      case 'agility':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const color = getWorkoutTypeColor();

  // Get intensity icon and color
  const getIntensityDisplay = () => {
    switch (template.defaultIntensity) {
      case 'low':
        return { color: 'text-green-600', label: t('physicalTrainer:intensity.low') };
      case 'medium':
        return { color: 'text-yellow-600', label: t('physicalTrainer:intensity.medium') };
      case 'high':
        return { color: 'text-orange-600', label: t('physicalTrainer:intensity.high') };
      case 'max':
        return { color: 'text-red-600', label: t('physicalTrainer:intensity.max') };
      default:
        return { color: 'text-gray-600', label: '' };
    }
  };

  const intensity = getIntensityDisplay();

  return (
    <Card
      className={cn(
        "relative transition-all cursor-pointer hover:shadow-md",
        isSelected && `ring-2 ring-${color}-500 bg-${color}-50/50`
      )}
      onClick={onSelect}
    >
      {isSelected && (
        <div className={`absolute top-2 right-2 text-${color}-600`}>
          <CheckCircle className="w-5 h-5" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Title and description */}
        <div>
          <h4 className="font-semibold text-sm line-clamp-1">{template.name}</h4>
          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{template.defaultDuration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className={cn("w-3 h-3", intensity.color)} />
            <span className={intensity.color}>{intensity.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-muted-foreground" />
            <span>{template.exercises.length} exercises</span>
          </div>
          {template.usageCount && template.usageCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span>{template.usageCount} uses</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs py-0 px-1.5"
              >
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs py-0 px-1.5"
              >
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Rating */}
        {template.rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(template.rating!)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({template.rating.toFixed(1)})
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-xs">
          <span className="text-muted-foreground">
            {template.author && `By ${template.author}`}
          </span>
          {template.lastModified && (
            <span className="text-muted-foreground">
              {new Date(template.lastModified).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};