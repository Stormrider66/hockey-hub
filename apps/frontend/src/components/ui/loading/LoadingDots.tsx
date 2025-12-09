import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingDotsProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'muted' | 'white';
  className?: string;
}

const sizeClasses = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
};

const colorClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted-foreground',
  white: 'bg-white',
};

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-1', className)} data-testid="dots">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${index * 150}ms`,
          }}
          data-testid={`loading-dot-${index}`}
        />
      ))}
    </div>
  );
};

// Inline text loading indicator
export const LoadingText: React.FC<{
  text?: string;
  dotSize?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ text = 'Loading', dotSize = 'sm', className }) => {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {text}
      <LoadingDots size={dotSize} />
    </span>
  );
};

LoadingDots.displayName = 'LoadingDots';
LoadingText.displayName = 'LoadingText';