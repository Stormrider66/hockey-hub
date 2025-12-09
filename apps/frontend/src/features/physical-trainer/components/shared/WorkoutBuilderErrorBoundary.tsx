import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  AlertTriangle, 
  WifiOff, 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ArrowLeft,
  MessageSquare,
  Database,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  workoutType?: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  sessionId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType;
  retryCount: number;
  isRetrying: boolean;
  autoSaveData: any;
  hasAutoSave: boolean;
}

type ErrorType = 'network' | 'auth' | 'validation' | 'system' | 'unknown';

interface ErrorClassification {
  type: ErrorType;
  isRecoverable: boolean;
  message: string;
  icon: ReactNode;
  color: string;
}

class WorkoutBuilderErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private autoSaveKey: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      autoSaveData: null,
      hasAutoSave: false
    };

    this.autoSaveKey = `workout_builder_autosave_${props.workoutType || 'unknown'}_${props.sessionId || 'new'}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.classifyError(error);
    
    // Check for auto-saved data
    const autoSaveData = this.getAutoSaveData();
    
    this.setState({
      errorInfo,
      errorType,
      autoSaveData,
      hasAutoSave: !!autoSaveData
    });

    // Log error to backend
    this.logError(error, errorInfo, errorType);
  }

  override componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return 'auth';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('memory') || message.includes('stack')) {
      return 'system';
    }
    
    return 'unknown';
  }

  private getErrorClassification(type: ErrorType): ErrorClassification {
    const classifications: Record<ErrorType, ErrorClassification> = {
      network: {
        type: 'network',
        isRecoverable: true,
        message: 'Network connection issue detected',
        icon: <WifiOff className="h-6 w-6" />,
        color: 'text-orange-600'
      },
      auth: {
        type: 'auth',
        isRecoverable: true,
        message: 'Authentication issue detected',
        icon: <Shield className="h-6 w-6" />,
        color: 'text-red-600'
      },
      validation: {
        type: 'validation',
        isRecoverable: true,
        message: 'Data validation error',
        icon: <AlertCircle className="h-6 w-6" />,
        color: 'text-yellow-600'
      },
      system: {
        type: 'system',
        isRecoverable: false,
        message: 'System error occurred',
        icon: <AlertTriangle className="h-6 w-6" />,
        color: 'text-red-700'
      },
      unknown: {
        type: 'unknown',
        isRecoverable: true,
        message: 'An unexpected error occurred',
        icon: <AlertTriangle className="h-6 w-6" />,
        color: 'text-gray-600'
      }
    };

    return classifications[type];
  }

  private async logError(error: Error, errorInfo: ErrorInfo, type: ErrorType) {
    try {
      // Send error to backend logging service
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            type
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          context: {
            workoutType: this.props.workoutType,
            sessionId: this.props.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private getAutoSaveData(): any {
    try {
      const data = localStorage.getItem(this.autoSaveKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private clearAutoSave() {
    try {
      localStorage.removeItem(this.autoSaveKey);
    } catch {
      // Ignore localStorage errors
    }
  }

  private async retryWithBackoff() {
    const { retryCount } = this.state;
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      toast({
        title: "Maximum retries reached",
        description: "Please refresh the page or contact support",
        variant: "destructive"
      });
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false
      });
    }, delay);

    this.retryTimeouts.push(timeout);

    toast({
      title: "Retrying...",
      description: `Attempt ${retryCount + 1} of ${maxRetries}`,
    });
  }

  private handleReset = () => {
    this.clearAutoSave();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      autoSaveData: null,
      hasAutoSave: false
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleRestoreAutoSave = () => {
    const { autoSaveData } = this.state;
    
    if (autoSaveData) {
      // Emit custom event with auto-save data
      window.dispatchEvent(new CustomEvent('restoreAutoSave', { 
        detail: { 
          data: autoSaveData,
          workoutType: this.props.workoutType,
          sessionId: this.props.sessionId
        } 
      }));

      this.handleReset();
      
      toast({
        title: "Auto-save restored",
        description: "Your work has been recovered",
      });
    }
  };

  private handleReportIssue = () => {
    const { error, errorType } = this.state;
    const errorReport = {
      type: errorType,
      message: error?.message,
      timestamp: new Date().toISOString(),
      workoutType: this.props.workoutType,
      sessionId: this.props.sessionId
    };

    // Open support modal or redirect to support page
    window.dispatchEvent(new CustomEvent('openSupport', { 
      detail: { errorReport } 
    }));
  };

  override render() {
    const { hasError, error, errorType, isRetrying, hasAutoSave } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    const classification = this.getErrorClassification(errorType);

    return (
      <ErrorBoundaryContent 
        error={error}
        errorType={errorType}
        classification={classification}
        isRetrying={isRetrying}
        hasAutoSave={hasAutoSave}
        onRetry={() => this.retryWithBackoff()}
        onReset={this.handleReset}
        onRestoreAutoSave={this.handleRestoreAutoSave}
        onReportIssue={this.handleReportIssue}
      />
    );
  }
}

// Separate component for the error UI to use hooks
function ErrorBoundaryContent({
  error,
  errorType,
  classification,
  isRetrying,
  hasAutoSave,
  onRetry,
  onReset,
  onRestoreAutoSave,
  onReportIssue
}: {
  error: Error | null;
  errorType: ErrorType;
  classification: ErrorClassification;
  isRetrying: boolean;
  hasAutoSave: boolean;
  onRetry: () => void;
  onReset: () => void;
  onRestoreAutoSave: () => void;
  onReportIssue: () => void;
}) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={classification.color}>
              {classification.icon}
            </div>
            <div>
              <CardTitle>{t('physicalTrainer:errorBoundary.title')}</CardTitle>
              <CardDescription>
                {t(`physicalTrainer:errorBoundary.errors.${errorType}.description`)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              <code className="text-sm bg-gray-100 p-2 rounded block overflow-x-auto">
                {error?.message || 'Unknown error'}
              </code>
            </AlertDescription>
          </Alert>

          {hasAutoSave && (
            <Alert className="border-blue-200 bg-blue-50">
              <Save className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">
                {t('physicalTrainer:errorBoundary.autoSave.available')}
              </AlertTitle>
              <AlertDescription className="text-blue-700">
                {t('physicalTrainer:errorBoundary.autoSave.description')}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">What you can try:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {t(`physicalTrainer:errorBoundary.errors.${errorType}.suggestions`, { returnObjects: true })?.map((suggestion: string, index: number) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          {classification.isRecoverable && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('physicalTrainer:errorBoundary.actions.retrying')}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('physicalTrainer:errorBoundary.actions.tryAgain')}
                </>
              )}
            </Button>
          )}

          {hasAutoSave && (
            <Button
              onClick={onRestoreAutoSave}
              variant="outline"
            >
              <Clock className="mr-2 h-4 w-4" />
              {t('physicalTrainer:errorBoundary.actions.restoreAutoSave')}
            </Button>
          )}

          <Button
            onClick={onReset}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('physicalTrainer:errorBoundary.actions.startOver')}
          </Button>

          <Button
            onClick={onReportIssue}
            variant="outline"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('physicalTrainer:errorBoundary.actions.reportIssue')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook wrapper for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const throwError = (error: Error) => setError(error);

  return { resetError, throwError };
}

// HOC for wrapping components with error boundary
export function withWorkoutErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  workoutType?: 'strength' | 'conditioning' | 'hybrid' | 'agility'
) {
  return (props: P) => (
    <WorkoutBuilderErrorBoundary workoutType={workoutType}>
      <Component {...props} />
    </WorkoutBuilderErrorBoundary>
  );
}

export default WorkoutBuilderErrorBoundary;