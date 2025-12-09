import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle, RefreshCw, FileX } from 'lucide-react';
import { Button } from '../button';

export interface LoadingStateProps<T> {
  // Original API
  loading?: boolean;
  error?: Error | string | null;
  data?: T | null;
  empty?: boolean;
  // Compatibility API used by tests
  isLoading?: boolean;
  isEmpty?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  loadingMessage?: string;
  minHeight?: string;
  className?: string;
  children: ((data: T) => React.ReactNode) | React.ReactNode;
}

export function LoadingState<T>({
  loading = false,
  error = null,
  data = null,
  empty = false,
  // compat props
  isLoading,
  isEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyMessage = 'There is no data to display at the moment.',
  emptyAction,
  errorTitle = 'Something went wrong',
  errorMessage,
  onRetry,
  loadingMessage = 'Loading...',
  minHeight = '200px',
  className,
  children,
}: LoadingStateProps<T>) {
  // Determine mode (compat vs original)
  const compatMode = typeof isLoading !== 'undefined' || typeof isEmpty !== 'undefined' || loadingComponent || errorComponent || emptyComponent;

  // Loading state
  if (compatMode ? isLoading : loading) {
    if (compatMode && loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3',
          className
        )}
        style={{ minHeight }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner size="lg" announce={false} />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  // Error state
  if (compatMode ? !!error : !!error) {
    if (compatMode && errorComponent) {
      return <>{errorComponent}</>;
    }
    const errorMsg = typeof error === 'string' ? error : error?.message;
    
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          className
        )}
        style={{ minHeight }}
      >
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">{errorTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {errorMessage || errorMsg}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (compatMode ? !!isEmpty : (empty || !data)) {
    if (compatMode && emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          className
        )}
        style={{ minHeight }}
      >
        <div className="rounded-full bg-muted p-4">
          {emptyIcon || <FileX className="h-8 w-8 text-muted-foreground" />}
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">{emptyTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1">{emptyMessage}</p>
        </div>
        {emptyAction && (
          <Button onClick={emptyAction.onClick} variant="outline" size="sm">
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  // Success state - render children with data
  if (typeof children === 'function') {
    return <>{(children as (d: T) => React.ReactNode)(data as T)}</>;
  }
  return <>{children}</>;
}

// Simpler loading state for inline use
export const InlineLoadingState: React.FC<{
  loading?: boolean;
  error?: Error | string | null;
  children: React.ReactNode;
}> = ({ loading, error, children }) => {
  if (loading) {
    return <LoadingSpinner size="sm" />;
  }

  if (error) {
    return (
      <span className="text-sm text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }

  return <>{children}</>;
};

LoadingState.displayName = 'LoadingState';
InlineLoadingState.displayName = 'InlineLoadingState';