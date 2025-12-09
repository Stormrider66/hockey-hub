import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  variant?: 'default' | 'gradient' | 'striped';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside';
  className?: string;
}

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const colorClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const variantClasses = {
  default: '',
  gradient: 'bg-gradient-to-r from-primary to-primary/50',
  striped: 'bg-stripes',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  indeterminate = false,
  variant = 'default',
  color = 'primary',
  size = 'md',
  showLabel = false,
  labelPosition = 'outside',
  className,
}) => {
  const isIndeterminate = indeterminate || value === undefined;
  const clampedValue = isIndeterminate ? 0 : Math.min(max, Math.max(0, value as number));
  const percentage = Math.min(100, Math.max(0, (clampedValue / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-muted-foreground">Progress</span>
          <span className="text-sm font-medium text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])} data-testid="progress">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variant === 'default' ? colorClasses[color] : variantClasses[variant],
            indeterminate && 'animate-progress'
          )}
          style={{
            width: isIndeterminate ? '100%' : `${percentage}%`,
          }}
          role="progressbar"
          {...(isIndeterminate ? {} : { 'aria-valuenow': clampedValue })}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {showLabel && labelPosition === 'inside' && percentage > 20 && (
            <span className="flex h-full items-center justify-center text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Top-of-page loader (like YouTube/GitHub)
export const TopLoader: React.FC<{
  loading?: boolean;
  progress?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ loading = false, progress, color = 'primary' }) => {
  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <ProgressBar
        value={progress}
        indeterminate={progress === undefined}
        color={color}
        size="xs"
        className="h-full"
      />
    </div>
  );
};

// Circular progress
export const CircularProgress: React.FC<{
  value?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}> = ({
  value = 0,
  size = 40,
  strokeWidth = 4,
  showLabel = false,
  color = 'currentColor',
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';
TopLoader.displayName = 'TopLoader';
CircularProgress.displayName = 'CircularProgress';