import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: string | Record<string, unknown> | Error;
  retry?: () => void;
}

interface ErrorDisplayProps {
  error: ErrorInfo | Error | string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  showDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  variant = 'destructive',
  showDetails = process.env.NODE_ENV === 'development',
  className
}) => {
  // Normalize error to ErrorInfo format
  const errorInfo: ErrorInfo = typeof error === 'string'
    ? { message: error }
    : error instanceof Error
    ? { message: error.message, details: error.stack }
    : error;

  // Map extended variants to supported Alert variants and add style classes
  const alertVariant: 'default' | 'destructive' | null | undefined =
    variant === 'destructive' ? 'destructive' : 'default';

  const variantClass =
    variant === 'warning'
      ? 'border-yellow-200 bg-yellow-50 text-yellow-900'
      : variant === 'info'
      ? 'border-blue-200 bg-blue-50 text-blue-900'
      : undefined;

  // Select icon based on variant
  const Icon = {
    default: AlertCircle,
    destructive: XCircle,
    warning: AlertTriangle,
    info: Info
  }[variant];

  // Get title based on status code or variant
  const getTitle = () => {
    if (errorInfo.statusCode) {
      switch (errorInfo.statusCode) {
        case 400: return 'Bad Request';
        case 401: return 'Authentication Required';
        case 403: return 'Access Denied';
        case 404: return 'Not Found';
        case 409: return 'Conflict';
        case 422: return 'Validation Error';
        case 429: return 'Too Many Requests';
        case 500: return 'Server Error';
        case 503: return 'Service Unavailable';
        default: return 'Error';
      }
    }
    return variant === 'warning' ? 'Warning' : 'Error';
  };

  return (
    <Alert variant={alertVariant} className={cn(variantClass, className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{errorInfo.message}</p>
        
        {errorInfo.code && (
          <p className="text-sm text-muted-foreground">
            Error Code: <code className="px-1 py-0.5 bg-muted rounded">{errorInfo.code}</code>
          </p>
        )}

        {showDetails && errorInfo.details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
              {typeof errorInfo.details === 'string' 
                ? errorInfo.details 
                : JSON.stringify(errorInfo.details, null, 2)}
            </pre>
          </details>
        )}

        {errorInfo.retry && (
          <Button
            size="sm"
            variant="outline"
            onClick={errorInfo.retry}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Specialized error components
export const ValidationErrorDisplay: React.FC<{
  errors: Array<{ field: string; message: string }>;
  className?: string;
}> = ({ errors, className }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              <span className="font-medium">{error.field}:</span> {error.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export const NetworkErrorDisplay: React.FC<{
  retry?: () => void;
  className?: string;
}> = ({ retry, className }) => (
  <Alert variant="destructive" className={className}>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Network Error</AlertTitle>
    <AlertDescription className="space-y-2">
      <p>Unable to connect to the server. Please check your internet connection.</p>
      {retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Try Again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

export const NotFoundErrorDisplay: React.FC<{
  resource?: string;
  className?: string;
}> = ({ resource = 'Resource', className }) => (
  <Alert variant="default" className={className}>
    <Info className="h-4 w-4" />
    <AlertTitle>Not Found</AlertTitle>
    <AlertDescription>
      {resource} not found. It may have been moved or deleted.
    </AlertDescription>
  </Alert>
);

export const UnauthorizedErrorDisplay: React.FC<{
  onLogin?: () => void;
  className?: string;
}> = ({ onLogin, className }) => (
  <Alert variant="destructive" className={className}>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Authentication Required</AlertTitle>
    <AlertDescription className="space-y-2">
      <p>You need to be logged in to access this resource.</p>
      {onLogin && (
        <Button size="sm" onClick={onLogin}>
          Log In
        </Button>
      )}
    </AlertDescription>
  </Alert>
);