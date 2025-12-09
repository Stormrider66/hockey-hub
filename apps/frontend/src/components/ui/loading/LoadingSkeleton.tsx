import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantClasses = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-md',
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className,
  style,
  ...props
}) => {
  const animationClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-progress' : '';
  
  const defaultHeight = variant === 'text' ? '1em' : undefined;
  
  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animationClass,
        variant === 'text' && 'h-4',
        className
      )}
      data-testid="loading-skeleton"
      style={{
        width: width,
        height: height || defaultHeight,
        ...style,
      }}
      {...props}
    />
  );
};

// Preset skeleton components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

export const AvatarSkeleton: React.FC<{ size?: string | number; className?: string }> = ({ 
  size = 40, 
  className 
}) => {
  return (
    <LoadingSkeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      <LoadingSkeleton variant="rectangular" height={200} />
      <div className="space-y-2 p-3">
        <LoadingSkeleton variant="text" width="60%" />
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" width="90%" />
      </div>
    </div>
  );
};

LoadingSkeleton.displayName = 'LoadingSkeleton';