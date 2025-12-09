import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Users, 
  Calendar,
  Copy,
  Edit,
  Star,
  Target,
  Activity,
  Zap,
  Move,
  TrendingUp,
  ChevronRight,
  MapPin,
  Bell,
  Repeat
} from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
// WorkoutType will be string values from the API
import { useTranslation } from 'react-i18next';

interface RecentWorkout {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastUsed?: string;
  playerCount: number;
  teamCount: number;
  duration: number;
  isFavorite?: boolean;
  usageCount: number;
  successRate?: number;
  // Enhanced scheduling information
  location?: {
    facilityName: string;
    area?: string;
  };
  scheduledDate?: string;
  assignedPlayers?: string[];
  assignedTeams?: string[];
  recurring?: {
    frequency: string;
    daysOfWeek?: number[];
  };
  hasReminders?: boolean;
}

interface RecentWorkoutsWidgetProps {
  workouts: RecentWorkout[];
  isLoading?: boolean;
  onDuplicate: (workoutId: string) => void;
  onEdit: (workoutId: string) => void;
  onToggleFavorite: (workoutId: string) => void;
  onViewDetails: (workoutId: string) => void;
  className?: string;
}

const workoutTypeConfig = {
  STRENGTH: {
    icon: Target,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  CONDITIONING: {
    icon: Activity,
    color: 'text-green-600',
    bg: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  HYBRID: {
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  AGILITY: {
    icon: Move,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
};

export const RecentWorkoutsWidget: React.FC<RecentWorkoutsWidgetProps> = ({
  workouts,
  isLoading = false,
  onDuplicate,
  onEdit,
  onToggleFavorite,
  onViewDetails,
  className,
}) => {
  const { t } = useTranslation(['physicalTrainer']);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{t('physicalTrainer:recentWorkouts.title')}</CardTitle>
          <CardDescription>{t('physicalTrainer:recentWorkouts.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{t('physicalTrainer:recentWorkouts.title')}</CardTitle>
          <CardDescription>{t('physicalTrainer:recentWorkouts.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('physicalTrainer:recentWorkouts.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t('physicalTrainer:recentWorkouts.title')}</CardTitle>
            <CardDescription>{t('physicalTrainer:recentWorkouts.description')}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            {workouts.length} {t('physicalTrainer:recentWorkouts.workouts')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {workouts.map((workout, index) => {
              // Handle both uppercase and lowercase workout types
              const normalizedType = workout.type.toUpperCase() as keyof typeof workoutTypeConfig;
              const config = workoutTypeConfig[normalizedType] || workoutTypeConfig.STRENGTH;
              const Icon = config.icon;

              return (
                <div
                  key={workout.id}
                  className={cn(
                    "group relative flex items-start gap-3 p-3 rounded-lg border transition-all",
                    "hover:shadow-sm hover:border-gray-300",
                    config.borderColor,
                    index === 0 && "ring-2 ring-primary/20"
                  )}
                >
                  {/* Icon */}
                  <div className={cn("p-2 rounded-md", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm truncate pr-2 flex items-center gap-2">
                          {workout.name}
                          {workout.isFavorite && (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          )}
                          {workout.recurring && (
                            <Repeat className="h-3 w-3 text-blue-500" />
                          )}
                          {workout.hasReminders && (
                            <Bell className="h-3 w-3 text-green-500" />
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(workout.lastUsed || workout.createdAt), { 
                              addSuffix: true 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {workout.playerCount + workout.teamCount * 20}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {workout.duration} min
                          </span>
                        </div>
                        {/* Enhanced scheduling info row */}
                        {(workout.location || workout.assignedTeams?.length || workout.recurring) && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {workout.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {workout.location.facilityName}
                                {workout.location.area && ` - ${workout.location.area}`}
                              </span>
                            )}
                            {workout.assignedTeams && workout.assignedTeams.length > 0 && (
                              <span className="text-xs">
                                {workout.assignedTeams.length} team{workout.assignedTeams.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {workout.recurring && (
                              <span className="text-xs text-blue-600">
                                {workout.recurring.frequency}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Usage stats */}
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          {workout.usageCount} {t('physicalTrainer:recentWorkouts.uses')}
                        </Badge>
                        {workout.successRate && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            {workout.successRate}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onDuplicate(workout.id)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('physicalTrainer:recentWorkouts.duplicate')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onEdit(workout.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('physicalTrainer:recentWorkouts.edit')}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onToggleFavorite(workout.id)}
                            >
                              <Star 
                                className={cn(
                                  "h-3 w-3",
                                  workout.isFavorite && "fill-yellow-400 text-yellow-400"
                                )} 
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {workout.isFavorite 
                                ? t('physicalTrainer:recentWorkouts.unfavorite')
                                : t('physicalTrainer:recentWorkouts.favorite')
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onViewDetails(workout.id)}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('physicalTrainer:recentWorkouts.viewDetails')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};