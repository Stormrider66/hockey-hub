import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Star, 
  Calendar,
  Users,
  Clock,
  Target,
  Activity,
  Zap,
  Move,
  Play,
  Copy,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkoutType } from '@/features/physical-trainer/types';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FavoriteTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  description?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  usageCount: number;
  lastUsed?: string;
  equipment?: string[];
}

interface TemplateFavoritesProps {
  templates: FavoriteTemplate[];
  isLoading?: boolean;
  onApply: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onRemoveFavorite: (templateId: string) => void;
  className?: string;
}

const workoutTypeConfig = {
  [WorkoutType.STRENGTH]: {
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  [WorkoutType.CONDITIONING]: {
    icon: Activity,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  [WorkoutType.HYBRID]: {
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  [WorkoutType.AGILITY]: {
    icon: Move,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
};

const difficultyConfig = {
  beginner: { color: 'text-green-600', bg: 'bg-green-100' },
  intermediate: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  advanced: { color: 'text-red-600', bg: 'bg-red-100' },
};

export const TemplateFavorites: React.FC<TemplateFavoritesProps> = ({
  templates,
  isLoading = false,
  onApply,
  onDuplicate,
  onEdit,
  onRemoveFavorite,
  className,
}) => {
  const { t } = useTranslation(['physicalTrainer']);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            {t('physicalTrainer:templates.favorites.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            {t('physicalTrainer:templates.favorites.title')}
          </CardTitle>
          <CardDescription>
            {t('physicalTrainer:templates.favorites.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('physicalTrainer:templates.favorites.empty')}</p>
            <p className="text-xs mt-1">{t('physicalTrainer:templates.favorites.hint')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          {t('physicalTrainer:templates.favorites.title')}
        </CardTitle>
        <CardDescription>
          {t('physicalTrainer:templates.favorites.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const typeConfig = workoutTypeConfig[template.type];
              const TypeIcon = typeConfig.icon;
              const diffConfig = difficultyConfig[template.difficulty];

              return (
                <div
                  key={template.id}
                  className="group relative p-4 rounded-lg border hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-md", typeConfig.bg)}>
                        <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onApply(template.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          {t('physicalTrainer:templates.actions.apply')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(template.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {t('physicalTrainer:templates.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          {t('physicalTrainer:templates.actions.duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onRemoveFavorite(template.id)}
                          className="text-destructive"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {t('physicalTrainer:templates.actions.unfavorite')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.duration} min
                    </span>
                    <Badge variant="outline" className={cn("text-xs", diffConfig.color)}>
                      {template.difficulty}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {template.usageCount}
                    </span>
                  </div>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Quick Apply Button */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onApply(template.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {t('physicalTrainer:templates.actions.quickApply')}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};