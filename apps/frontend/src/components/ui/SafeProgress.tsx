import React from 'react';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { capProgress } from '@/utils/chartOptimization';

export interface SafeProgressProps {
  value: number;
  max?: number;
  className?: string;
  showOverflow?: boolean;
  overflowColor?: string;
  'aria-label'?: string;
}

/**
 * SafeProgress component that caps values at 100% and optionally shows overflow
 */
export const SafeProgress: React.FC<SafeProgressProps> = ({
  value,
  max = 100,
  className,
  showOverflow = false,
  overflowColor = 'text-amber-600',
  'aria-label': ariaLabel
}) => {
  const percentage = (value / max) * 100;
  const cappedPercentage = capProgress(percentage);
  const isOverflow = percentage > 100;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Progress 
          value={cappedPercentage} 
          className={cn(className, isOverflow && 'bg-amber-100')}
          aria-label={ariaLabel || `Progress: ${Math.round(percentage)}%`}
        />
        {isOverflow && showOverflow && (
          <div className="absolute -top-1 -right-1">
            <div className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100",
              overflowColor
            )}>
              {Math.round(percentage)}%
            </div>
          </div>
        )}
      </div>
      {isOverflow && !showOverflow && (
        <p className={cn("text-xs", overflowColor)}>
          {Math.round(percentage)}% ({value}/{max})
        </p>
      )}
    </div>
  );
};

export default SafeProgress;