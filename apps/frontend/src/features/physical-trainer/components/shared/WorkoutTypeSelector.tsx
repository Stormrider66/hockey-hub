import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectLabel,
  SelectGroup
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { 
  Dumbbell, 
  Activity, 
  Zap, 
  Wind,
  Heart,
  Clock,
  TrendingUp,
  Users,
  Shield,
  Target,
  Trophy
} from '@/components/icons';
import { SessionType } from '../../types/session-builder.types';
import { cn } from '@/lib/utils';

interface WorkoutTypeOption {
  value: SessionType | 'bulk';
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  requiresFeatureFlag?: boolean;
}

interface WorkoutTypeSelectorProps {
  onSelect: (type: SessionType | 'bulk') => void;
  currentType?: SessionType | 'bulk';
  disabled?: boolean;
  className?: string;
}

const WORKOUT_TYPES: WorkoutTypeOption[] = [
  {
    value: 'strength',
    label: 'Strength Training',
    icon: <Dumbbell className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Traditional weight training with sets and reps'
  },
  {
    value: 'conditioning',
    label: 'Conditioning',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Interval-based cardio workouts'
  },
  {
    value: 'hybrid',
    label: 'Hybrid Training',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Mix of strength exercises and cardio intervals'
  },
  {
    value: 'agility',
    label: 'Agility & Speed',
    icon: <Wind className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Drills for quickness and coordination'
  },
  {
    value: 'flexibility',
    label: 'Flexibility & Mobility',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Hold-based stretching and breathing programs'
  },
  {
    value: 'wrestling',
    label: 'Wrestling Training',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Round-based wrestling with partner assignments'
  },
  {
    value: 'power',
    label: 'Power Training',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Explosive movements and Olympic lifts'
  },
  {
    value: 'stability_core',
    label: 'Stability & Core',
    icon: <Target className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Core strength and balance training'
  },
  {
    value: 'plyometrics',
    label: 'Plyometrics',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    description: 'Jump training and explosive movements'
  },
  {
    value: 'recovery',
    label: 'Recovery',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    description: 'Active recovery and regeneration'
  },
  {
    value: 'sprint',
    label: 'Sprint Training',
    icon: <Wind className="h-4 w-4" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    description: 'Speed development and sprint mechanics'
  },
  {
    value: 'sport_specific',
    label: 'Sport-Specific',
    icon: <Trophy className="h-4 w-4" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    description: 'Hockey-specific skills and drills'
  },
  {
    value: 'bulk',
    label: 'Create Multiple Sessions',
    icon: <Users className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Bulk create sessions across multiple teams and dates',
    requiresFeatureFlag: true
  }
];

const STORAGE_KEY = 'pt-recent-workout-types';
const MAX_RECENT_ITEMS = 3;

export const WorkoutTypeSelector: React.FC<WorkoutTypeSelectorProps> = ({
  onSelect,
  currentType,
  disabled = false,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [recentTypes, setRecentTypes] = useState<(SessionType | 'bulk')[]>([]);
  
  // Check if bulk sessions feature flag is enabled
  const isBulkSessionsEnabled = process.env.NEXT_PUBLIC_ENABLE_BULK_SESSIONS === 'true';
  
  // Filter workout types based on feature flags
  const availableWorkoutTypes = WORKOUT_TYPES.filter(type => {
    if (type.requiresFeatureFlag && type.value === 'bulk') {
      return isBulkSessionsEnabled;
    }
    return true;
  });

  // Load recent types from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentTypes(parsed.slice(0, MAX_RECENT_ITEMS));
      } catch (e) {
        console.error('Failed to parse recent workout types', e);
      }
    }
  }, []);

  // Update recent types when selection changes
  const handleSelect = (value: SessionType | 'bulk') => {
    // Update recent types
    const newRecent = [value, ...recentTypes.filter(t => t !== value)].slice(0, MAX_RECENT_ITEMS);
    setRecentTypes(newRecent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
    
    onSelect(value);
  };

  const getTypeOption = (type: SessionType | 'bulk') => {
    return availableWorkoutTypes.find(t => t.value === type);
  };

  const currentOption = currentType ? getTypeOption(currentType) : null;

  return (
    <Select
      value={currentType}
      onValueChange={handleSelect}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[260px]", className)}>
        <div className="flex items-center gap-2">
          {currentOption ? (
            <>
              <div className={cn("p-1 rounded", currentOption.bgColor, currentOption.color)}>
                {currentOption.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{currentOption.label}</span>
                <span className="text-xs text-muted-foreground">
                  {currentOption.description}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{t('physicalTrainer:workoutType.select')}</span>
            </div>
          )}
        </div>
      </SelectTrigger>
      
      <SelectContent className="w-[320px]">
        {/* Recently Used Section */}
        {recentTypes.length > 0 && (
          <>
            <SelectGroup>
              <SelectLabel className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                {t('physicalTrainer:workoutType.recentlyUsed')}
              </SelectLabel>
              {recentTypes.map((type) => {
                const option = getTypeOption(type);
                if (!option) return null;
                
                return (
                  <SelectItem key={`recent-${type}`} value={type}>
                    <div className="flex items-center gap-3 py-1">
                      <div className={cn("p-1.5 rounded", option.bgColor, option.color)}>
                        {option.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
            <SelectSeparator />
          </>
        )}
        
        {/* All Workout Types */}
        <SelectGroup>
          <SelectLabel className="text-xs">
            {t('physicalTrainer:workoutType.allTypes')}
          </SelectLabel>
          {availableWorkoutTypes.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-3 py-1">
                <div className={cn("p-1.5 rounded", option.bgColor, option.color)}>
                  {option.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default WorkoutTypeSelector;