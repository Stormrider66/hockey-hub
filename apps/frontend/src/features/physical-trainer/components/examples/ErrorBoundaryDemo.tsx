/**
 * Error Boundary Demo Component
 * 
 * This component demonstrates how to test error boundaries in development.
 * To use:
 * 1. Import this component where you want to test error handling
 * 2. Wrap it with any of the error boundaries
 * 3. Click the buttons to trigger different types of errors
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, Database, Network } from 'lucide-react';

interface ErrorType {
  type: 'runtime' | 'async' | 'network' | 'validation';
  message: string;
}

export const ErrorBoundaryDemo: React.FC = () => {
  const [errorType, setErrorType] = useState<ErrorType | null>(null);

  // Simulate different types of errors
  if (errorType) {
    switch (errorType.type) {
      case 'runtime':
        throw new Error(errorType.message);
      
      case 'async':
        // Simulate async error
        setTimeout(() => {
          throw new Error(errorType.message);
        }, 100);
        break;
      
      case 'network':
        // Simulate network error
        throw new TypeError('Failed to fetch');
      
      case 'validation':
        // Simulate validation error
        const obj: any = null;
        return obj.nonExistentMethod(); // This will throw
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Error Boundary Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click any button below to trigger an error and see how the error boundary handles it.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="destructive"
            onClick={() => setErrorType({ type: 'runtime', message: 'Runtime error occurred!' })}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Runtime Error
          </Button>

          <Button
            variant="destructive"
            onClick={() => setErrorType({ type: 'async', message: 'Async operation failed!' })}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Async Error
          </Button>

          <Button
            variant="destructive"
            onClick={() => setErrorType({ type: 'network', message: 'Network request failed!' })}
            className="flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            Network Error
          </Button>

          <Button
            variant="destructive"
            onClick={() => setErrorType({ type: 'validation', message: 'Validation error!' })}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Null Reference Error
          </Button>
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-mono">
            Status: {errorType ? `Throwing ${errorType.type} error...` : 'No errors'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Example usage:
/*
import { WorkoutErrorBoundary } from '../WorkoutErrorBoundary';
import { ErrorBoundaryDemo } from './ErrorBoundaryDemo';

function MyComponent() {
  return (
    <WorkoutErrorBoundary componentName="Demo Component">
      <ErrorBoundaryDemo />
    </WorkoutErrorBoundary>
  );
}
*/