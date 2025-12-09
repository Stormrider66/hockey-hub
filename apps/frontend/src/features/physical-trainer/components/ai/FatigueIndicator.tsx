/**
 * Fatigue Indicator Component
 * 
 * Visual indicator for player fatigue levels with color coding and tooltips.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  Battery, 
  BatteryLow, 
  AlertTriangle,
  CheckCircle
} from '@/components/icons';

interface FatigueIndicatorProps {
  fatigue: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'progress' | 'icon' | 'minimal';
  showValue?: boolean;
  className?: string;
}

export const FatigueIndicator: React.FC<FatigueIndicatorProps> = ({
  fatigue,
  size = 'md',
  variant = 'badge',
  showValue = false,
  className
}) => {
  // Determine fatigue level and colors
  const getFatigueLevel = (value: number): {
    level: 'low' | 'moderate' | 'high' | 'critical';
    color: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<any>;
  } => {
    if (value <= 30) {
      return {
        level: 'low',
        color: 'bg-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: CheckCircle
      };
    } else if (value <= 60) {
      return {
        level: 'moderate',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: Battery
      };
    } else if (value <= 80) {
      return {
        level: 'high',
        color: 'bg-orange-500',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        icon: BatteryLow
      };
    } else {
      return {
        level: 'critical',
        color: 'bg-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: AlertTriangle
      };
    }
  };

  const fatigueInfo = getFatigueLevel(fatigue);
  const Icon = fatigueInfo.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 'h-3 w-3',
      textSize: 'text-xs',
      badgeSize: 'px-2 py-1',
      progressHeight: 'h-1'
    },
    md: {
      iconSize: 'h-4 w-4',
      textSize: 'text-sm',
      badgeSize: 'px-3 py-1',
      progressHeight: 'h-2'
    },
    lg: {
      iconSize: 'h-5 w-5',
      textSize: 'text-base',
      badgeSize: 'px-4 py-2',
      progressHeight: 'h-3'
    }
  };

  const config = sizeConfig[size];

  // Render variants
  const renderContent = () => {
    switch (variant) {
      case 'badge':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn(
                    fatigueInfo.bgColor, 
                    fatigueInfo.textColor,
                    config.badgeSize,
                    config.textSize,
                    'flex items-center gap-1',
                    className
                  )}
                >
                  <Icon className={config.iconSize} />
                  {showValue && `${Math.round(fatigue)}%`}
                  {!showValue && fatigueInfo.level}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Fatigue Level: {Math.round(fatigue)}%</p>
                  <p className="text-sm opacity-80">Status: {fatigueInfo.level}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'progress':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('space-y-1', className)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Icon className={cn(config.iconSize, fatigueInfo.textColor)} />
                      <span className={cn(config.textSize, 'font-medium')}>
                        Fatigue
                      </span>
                    </div>
                    {showValue && (
                      <span className={cn(config.textSize, fatigueInfo.textColor)}>
                        {Math.round(fatigue)}%
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={fatigue} 
                    className={cn(config.progressHeight)}
                    indicatorClassName={fatigueInfo.color}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Fatigue Level: {Math.round(fatigue)}%</p>
                  <p className="text-sm opacity-80">Status: {fatigueInfo.level}</p>
                  <p className="text-xs mt-1">
                    {fatigue <= 30 && 'Player is well rested'}
                    {fatigue > 30 && fatigue <= 60 && 'Moderate fatigue, monitor closely'}
                    {fatigue > 60 && fatigue <= 80 && 'High fatigue, consider rest'}
                    {fatigue > 80 && 'Critical fatigue, rest recommended'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'icon':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1', className)}>
                  <Icon className={cn(config.iconSize, fatigueInfo.textColor)} />
                  {showValue && (
                    <span className={cn(config.textSize, fatigueInfo.textColor, 'font-medium')}>
                      {Math.round(fatigue)}%
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Fatigue Level: {Math.round(fatigue)}%</p>
                  <p className="text-sm opacity-80">Status: {fatigueInfo.level}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      case 'minimal':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center', className)}>
                  <div 
                    className={cn(
                      'rounded-full',
                      fatigueInfo.color,
                      size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
                    )}
                  />
                  {showValue && (
                    <span className={cn(config.textSize, 'ml-1 font-medium')}>
                      {Math.round(fatigue)}%
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Fatigue Level: {Math.round(fatigue)}%</p>
                  <p className="text-sm opacity-80">Status: {fatigueInfo.level}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default FatigueIndicator;