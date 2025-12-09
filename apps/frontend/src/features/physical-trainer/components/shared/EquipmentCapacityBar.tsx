import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Clock, 
  Info,
  AlertTriangle
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { WorkoutEquipmentType } from '../../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

export interface EquipmentCapacityBarProps {
  equipmentType: WorkoutEquipmentType;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  className?: string;
  showDetails?: boolean;
  variant?: 'compact' | 'detailed';
  facilityName?: string;
  onCapacityClick?: () => void;
}

interface CapacityLevel {
  level: 'optimal' | 'warning' | 'critical' | 'exceeded';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactElement;
  message: string;
}

const getCapacityLevel = (usedCapacity: number, availableCapacity: number): CapacityLevel => {
  const utilizationRatio = usedCapacity / availableCapacity;
  
  if (usedCapacity > availableCapacity) {
    return {
      level: 'exceeded',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      message: 'Equipment capacity exceeded - rotation groups required'
    };
  } else if (utilizationRatio >= 0.9) {
    return {
      level: 'critical',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      message: 'Critical capacity - very limited availability'
    };
  } else if (utilizationRatio >= 0.7) {
    return {
      level: 'warning',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      message: 'High capacity usage - consider staggered sessions'
    };
  } else {
    return {
      level: 'optimal',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      message: 'Good availability - equipment ready'
    };
  }
};

const getProgressValue = (usedCapacity: number, availableCapacity: number): number => {
  // Cap at 100% even if exceeded
  return Math.min((usedCapacity / availableCapacity) * 100, 100);
};

const getProgressColor = (level: CapacityLevel['level']): string => {
  switch (level) {
    case 'optimal':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
    case 'exceeded':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

export const EquipmentCapacityBar: React.FC<EquipmentCapacityBarProps> = ({
  equipmentType,
  totalCapacity,
  usedCapacity,
  availableCapacity,
  className,
  showDetails = true,
  variant = 'detailed',
  facilityName,
  onCapacityClick
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const config = EQUIPMENT_CONFIGS[equipmentType];
  const capacityLevel = getCapacityLevel(usedCapacity, availableCapacity);
  const progressValue = getProgressValue(usedCapacity, availableCapacity);
  const remainingCapacity = Math.max(availableCapacity - usedCapacity, 0);
  const overCapacity = Math.max(usedCapacity - availableCapacity, 0);
  
  if (!config) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unknown equipment type: {equipmentType}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border",
          capacityLevel.bgColor,
          capacityLevel.borderColor,
          className,
          onCapacityClick && "cursor-pointer hover:opacity-80"
        )}
        onClick={onCapacityClick}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <div className="text-sm font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">
                {facilityName || 'Training Facility'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">
              {usedCapacity}/{availableCapacity}
            </div>
            <div className="text-xs text-muted-foreground">
              {remainingCapacity > 0 ? `${remainingCapacity} available` : 'At capacity'} 
            </div>
          </div>
          {capacityLevel.icon}
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "p-4",
        className,
        onCapacityClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onCapacityClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <div className="text-sm font-medium">{config.label} Capacity</div>
            <div className="text-xs text-muted-foreground">
              {facilityName || 'Training Facility'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs", capacityLevel.color)}
          >
            {usedCapacity}/{availableCapacity}
          </Badge>
          {capacityLevel.icon}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={progressValue} 
            className="h-3"
          />
          {/* Custom progress bar styling */}
          <div 
            className={cn(
              "absolute top-0 left-0 h-3 rounded-full transition-all",
              getProgressColor(capacityLevel.level)
            )}
            style={{ width: `${progressValue}%` }}
          />
          
          {/* Overflow indicator if exceeded */}
          {overCapacity > 0 && (
            <div className="absolute top-0 right-0 h-3 w-1 bg-red-600 rounded-r-full" />
          )}
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progressValue)}% utilized</span>
          <span>
            {overCapacity > 0 
              ? `+${overCapacity} over capacity` 
              : `${remainingCapacity} remaining`
            }
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className={cn(
        "mt-3 p-2 rounded-lg border flex items-start gap-2",
        capacityLevel.bgColor,
        capacityLevel.borderColor
      )}>
        {capacityLevel.icon}
        <div className="flex-1">
          <div className={cn("text-xs font-medium", capacityLevel.color)}>
            {capacityLevel.message}
          </div>
          
          {/* Detailed breakdown */}
          {showDetails && (
            <div className="mt-1 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Equipment:</span>
                <span>{totalCapacity} units</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available for Use:</span>
                <span>{availableCapacity} units</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Currently Selected:</span>
                <span>{usedCapacity} players</span>
              </div>
              
              {overCapacity > 0 && (
                <div className="flex items-center justify-between text-xs text-red-600 font-medium">
                  <span>Over Capacity:</span>
                  <span>+{overCapacity} players</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rotation Groups Suggestion */}
      {overCapacity > 0 && (
        <Alert className="mt-3 border-orange-200 bg-orange-50/50">
          <Users className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <div className="space-y-1">
              <div className="font-medium">
                Rotation Groups Recommended
              </div>
              <div className="text-xs">
                {Math.ceil(usedCapacity / availableCapacity)} groups of {availableCapacity} players each • 
                ~{Math.ceil(usedCapacity / availableCapacity) * 20} minutes total time
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Equipment Maintenance Warning */}
      {availableCapacity < totalCapacity && (
        <Alert className="mt-3" variant="warning">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="text-xs">
              {totalCapacity - availableCapacity} equipment unit(s) unavailable due to maintenance or reservation
            </div>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};