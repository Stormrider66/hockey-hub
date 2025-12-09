import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorTracker } from '@/services/error/ErrorTracker';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  resetCount: number;
}

export class PerformanceErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      resetCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = 'Unknown', onError } = this.props;

    // Track error in performance monitor
    PerformanceMonitor.mark(`error-boundary-${componentName}`, {
      error: error.message,
      component: componentName,
      componentStack: errorInfo.componentStack
    });

    // Track error with error tracker
    ErrorTracker.captureException(error, {
      component: componentName,
      action: 'error-boundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorCount: this.state.errorCount + 1,
        resetCount: this.state.resetCount
      }
    });

    // Update state
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-reset after 10 seconds if error count is low
    if (this.state.errorCount < 3) {
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, 10000);
    }
  }

  override componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      // Reset if resetKeys changed
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    ErrorTracker.addBreadcrumb({
      type: 'custom',
      category: 'error-boundary',
      message: 'Error boundary reset',
      level: 'info',
      data: {
        component: this.props.componentName,
        errorCount: this.state.errorCount,
        resetCount: this.state.resetCount + 1
      }
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: prevState.resetCount + 1
    }));
  };

  override render() {
    const { hasError, error, errorInfo, errorCount, resetCount } = this.state;
    const { children, fallback, isolate, componentName } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className={`${isolate ? '' : 'min-h-screen'} flex items-center justify-center p-4`}>
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {componentName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Component: <code className="font-mono">{componentName}</code>
                    </p>
                  )}
                  <p className="font-medium">{error.message}</p>
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                    {error.stack}
                  </pre>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Error #{errorCount} • Reset #{resetCount}</span>
                {errorCount >= 3 && (
                  <span className="text-destructive">
                    Multiple errors detected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={this.resetErrorBoundary} variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                {!isolate && (
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                )}
              </div>

              {this.state.errorCount < 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  This page will automatically retry in 10 seconds...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to use error boundary imperatively
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    ErrorTracker.captureException(error, {
      component: 'useErrorHandler',
      metadata: errorInfo
    });
  };
}