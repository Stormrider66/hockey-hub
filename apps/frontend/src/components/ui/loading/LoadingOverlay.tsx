import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, LoadingSpinnerProps } from './LoadingSpinner';

export interface LoadingOverlayProps {
  visible?: boolean;
  fullScreen?: boolean;
  blur?: boolean;
  message?: string;
  onCancel?: () => void;
  spinnerProps?: Omit<LoadingSpinnerProps, 'text'>;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  fullScreen = false,
  blur = false,
  message,
  spinnerProps = {},
  onCancel,
  className,
  children,
}) => {
  if (!visible) return null;

  const overlayClasses = cn(
    'flex items-center justify-center bg-background/80 dark:bg-background/90',
    fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10',
    blur && 'backdrop-blur-sm',
    'animate-fade-in',
    className
  );

  return (
    <div className={overlayClasses} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" announce={false} {...spinnerProps} />
        {message && (
          <p className="text-sm font-medium text-muted-foreground">
            {message}
          </p>
        )}
        {onCancel && (
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        {children}
      </div>
    </div>
  );
};

// Container with loading overlay
export const LoadingContainer: React.FC<{
  loading?: boolean;
  blur?: boolean;
  message?: string;
  spinnerProps?: Omit<LoadingSpinnerProps, 'text'>;
  className?: string;
  children: React.ReactNode;
}> = ({ loading = false, blur, message, spinnerProps, className, children }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      <LoadingOverlay
        visible={loading}
        blur={blur}
        message={message}
        spinnerProps={spinnerProps}
      />
    </div>
  );
};

LoadingOverlay.displayName = 'LoadingOverlay';
LoadingContainer.displayName = 'LoadingContainer';