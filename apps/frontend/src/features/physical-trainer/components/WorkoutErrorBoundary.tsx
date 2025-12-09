import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WorkoutErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
  componentName?: string;
}

interface WorkoutErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Type for error recovery actions
type ErrorRecoveryAction = 'retry' | 'reset' | 'navigate' | 'report';

interface ErrorRecoveryOptions {
  action: ErrorRecoveryAction;
  handler: () => void;
  label: string;
  icon?: React.ReactNode;
}

export class WorkoutErrorBoundary extends Component<
  WorkoutErrorBoundaryProps,
  WorkoutErrorBoundaryState
> {
  constructor(props: WorkoutErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): WorkoutErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('WorkoutErrorBoundary caught an error:', {
      component: this.props.componentName || 'Unknown',
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: 'WorkoutErrorBoundary',
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      const { fallbackMessage, componentName } = this.props;
      const { error } = this.state;

      return (
        <Card className="w-full max-w-2xl mx-auto my-8">
          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {fallbackMessage ||
                  `An error occurred while loading ${
                    componentName || 'this component'
                  }. Please try again.`}
              </AlertDescription>
            </Alert>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                  Error: {error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-600 dark:text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      Show component stack
                    </summary>
                    <pre className="mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for workout builders
export class WorkoutBuilderErrorBoundary extends Component<
  Omit<WorkoutErrorBoundaryProps, 'fallbackMessage'>,
  WorkoutErrorBoundaryState
> {
  override render() {
    return (
      <WorkoutErrorBoundary
        {...this.props}
        fallbackMessage="The workout builder encountered an error. Your work has been saved. Please refresh the page or try again."
      />
    );
  }
}

// Specific error boundary for workout viewers
export class WorkoutViewerErrorBoundary extends Component<
  Omit<WorkoutErrorBoundaryProps, 'fallbackMessage'>,
  WorkoutErrorBoundaryState
> {
  override render() {
    return (
      <WorkoutErrorBoundary
        {...this.props}
        fallbackMessage="Unable to display the workout details. Please refresh the page or contact support if the problem persists."
      />
    );
  }
}

// Hook for using error boundary functionality in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { throwError, resetError };
}