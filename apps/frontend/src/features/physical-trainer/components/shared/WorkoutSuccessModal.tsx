import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  CheckCircle2,
  Users,
  Clock,
  FileText,
  Share2,
  Plus,
  Eye,
  Bell,
  Repeat,
  ArrowRight,
  Target,
  Activity,
  Zap,
  Move,
  Copy,
} from 'lucide-react';
import { WorkoutType } from '@/features/physical-trainer/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: WorkoutType;
  workoutName: string;
  playerCount: number;
  teamCount: number;
  duration?: number;
  exerciseCount?: number;
  onSchedule?: () => void;
  onCreateTemplate?: () => void;
  onCreateAnother?: () => void;
  onViewWorkout?: () => void;
  onNotifyPlayers?: () => void;
  onCreateDifferentType?: () => void;
}

const workoutTypeConfig = {
  [WorkoutType.STRENGTH]: {
    icon: Target,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    lightBg: 'bg-blue-50',
    label: 'Strength',
  },
  [WorkoutType.CONDITIONING]: {
    icon: Activity,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    lightBg: 'bg-green-50',
    label: 'Conditioning',
  },
  [WorkoutType.HYBRID]: {
    icon: Zap,
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    lightBg: 'bg-purple-50',
    label: 'Hybrid',
  },
  [WorkoutType.AGILITY]: {
    icon: Move,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    lightBg: 'bg-orange-50',
    label: 'Agility',
  },
};

export const WorkoutSuccessModal: React.FC<WorkoutSuccessModalProps> = ({
  isOpen,
  onClose,
  workoutType,
  workoutName,
  playerCount,
  teamCount,
  duration,
  exerciseCount,
  onSchedule,
  onCreateTemplate,
  onCreateAnother,
  onViewWorkout,
  onNotifyPlayers,
  onCreateDifferentType,
}) => {
  const config = workoutTypeConfig[workoutType];
  const Icon = config.icon;

  const quickActions = [
    {
      label: 'Schedule This Workout',
      icon: Calendar,
      onClick: onSchedule,
      description: 'Add to calendar',
      primary: true,
      shortcut: 'Ctrl+K',
    },
    {
      label: `Create Another ${config.label}`,
      icon: Plus,
      onClick: onCreateAnother,
      description: 'Same type',
      shortcut: 'Ctrl+N',
    },
    {
      label: 'Save as Template',
      icon: FileText,
      onClick: onCreateTemplate,
      description: 'Reuse later',
      shortcut: 'Ctrl+T',
    },
    {
      label: 'Notify Players',
      icon: Bell,
      onClick: onNotifyPlayers,
      description: 'Send alerts',
      disabled: playerCount === 0 && teamCount === 0,
    },
    {
      label: 'Duplicate & Edit',
      icon: Copy,
      onClick: () => {
        onCreateAnother?.();
        // The parent component should handle duplicating with existing data
      },
      description: 'Copy with changes',
      shortcut: 'Ctrl+D',
    },
    {
      label: 'Share Workout',
      icon: Share2,
      onClick: () => {
        // Copy shareable link
        navigator.clipboard.writeText(window.location.href);
        onClose();
      },
      description: 'Copy link',
    },
  ];

  const secondaryActions = [
    {
      label: 'View Workout',
      icon: Eye,
      onClick: onViewWorkout,
    },
    {
      label: 'Create Different Type',
      icon: Repeat,
      onClick: onCreateDifferentType,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.5 }}
              >
                <div className={cn('p-3 rounded-full', config.lightBg)}>
                  <CheckCircle2 className={cn('h-8 w-8', config.textColor)} />
                </div>
              </motion.div>
            </AnimatePresence>
            <div>
              <DialogTitle className="text-2xl">Workout Created!</DialogTitle>
              <DialogDescription className="text-base">
                Your {config.label.toLowerCase()} workout has been saved successfully
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workout Summary Card */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', config.textColor)} />
                  <h3 className="font-semibold text-lg">{workoutName}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {playerCount} {playerCount === 1 ? 'player' : 'players'}
                    </span>
                  </div>
                  {teamCount > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {teamCount} {teamCount === 1 ? 'team' : 'teams'}
                      </span>
                    </>
                  )}
                  {duration && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{duration} min</span>
                      </div>
                    </>
                  )}
                  {exerciseCount && (
                    <>
                      <span>•</span>
                      <span>
                        {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge className={cn(config.color, 'text-white')}>
                {config.label}
              </Badge>
            </div>
          </Card>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">
              What would you like to do next?
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.slice(0, 6).map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Button
                    variant={action.primary ? 'default' : 'outline'}
                    className="w-full h-auto py-3 px-3 relative group"
                    onClick={() => {
                      action.onClick?.();
                      if (!action.label.includes('Share')) {
                        onClose();
                      }
                    }}
                    disabled={action.disabled || !action.onClick}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <action.icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs opacity-70">{action.description}</div>
                      </div>
                      {action.shortcut && (
                        <kbd className="absolute top-1 right-1 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity bg-background/80 px-1 rounded border">
                          {action.shortcut}
                        </kbd>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2 pt-2">
            {secondaryActions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  action.onClick?.();
                  onClose();
                }}
                disabled={!action.onClick}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Helpful Tips */}
          <Card className="p-4 bg-muted/30 border-dashed">
            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Pro Tip
              </h5>
              <p className="text-sm text-muted-foreground">
                {workoutType === WorkoutType.STRENGTH && (
                  <>
                    Remember to schedule rest days between strength workouts for the same muscle groups.
                    Consider creating a complementary conditioning workout for active recovery.
                  </>
                )}
                {workoutType === WorkoutType.CONDITIONING && (
                  <>
                    This workout can be used as active recovery between strength sessions.
                    Track player heart rate data to optimize intensity zones.
                  </>
                )}
                {workoutType === WorkoutType.HYBRID && (
                  <>
                    Hybrid workouts are great for game-day preparation.
                    Monitor player fatigue levels when combining strength and cardio.
                  </>
                )}
                {workoutType === WorkoutType.AGILITY && (
                  <>
                    Agility drills work best when players are fresh.
                    Schedule these at the beginning of practice sessions.
                  </>
                )}
              </p>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Done
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};