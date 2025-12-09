'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Color variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'muted' | 'destructive' | 'success';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show text below spinner
   */
  text?: string;
  /**
   * Center the spinner in its container
   * @default true
   */
  center?: boolean;
  /**
   * Announce spinner to screen readers (role="status"). Set false when wrapped by a parent that already announces status.
   * @default true
   */
  announce?: boolean;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  success: 'text-green-600',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  text,
  center = true,
  announce = true,
}) => {
  const spinner = (
    <div
      className={cn('inline-flex flex-col items-center gap-2', className)}
      {...(announce ? { role: 'status', 'aria-label': 'Loading...' } : { 'aria-hidden': 'true' })}
      data-testid="loader-icon"
    >
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )} 
      />
      <span className="sr-only">Loading...</span>
      {text && (
        <p className={cn(
          'text-sm',
          variant === 'muted' ? 'text-muted-foreground' : variantClasses[variant]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (!center) {
    return spinner;
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[100px]">
      {spinner}
    </div>
  );
};