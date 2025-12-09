import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutErrorBoundary, WorkoutBuilderErrorBoundary, WorkoutViewerErrorBoundary } from '../WorkoutErrorBoundary';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that can trigger an error
const ErrorButton: React.FC = () => {
  const [hasError, setHasError] = React.useState(false);
  
  if (hasError) {
    throw new Error('Button triggered error');
  }
  
  return (
    <button onClick={() => setHasError(true)}>
      Trigger Error
    </button>
  );
};

describe('WorkoutErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <WorkoutErrorBoundary>
        <div>Test content</div>
      </WorkoutErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays error UI', () => {
    render(
      <WorkoutErrorBoundary componentName="Test Component">
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred while loading Test Component/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays custom fallback message when provided', () => {
    render(
      <WorkoutErrorBoundary fallbackMessage="Custom error message">
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));
    
    // Rerender with non-throwing component
    rerender(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WorkoutErrorBoundary>
    );
    
    // After reset, the fallback should disappear
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls custom onReset handler when provided', () => {
    const onReset = jest.fn();
    
    render(
      <WorkoutErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>
    );
    
    fireEvent.click(screen.getByText('Try Again'));
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('catches errors that occur after initial render', () => {
    render(
      <WorkoutErrorBoundary componentName="Dynamic Error Test">
        <ErrorButton />
      </WorkoutErrorBoundary>
    );
    
    expect(screen.getByText('Trigger Error')).toBeInTheDocument();
    
    // Trigger the error
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred while loading Dynamic Error Test/)).toBeInTheDocument();
  });
});

describe('WorkoutBuilderErrorBoundary', () => {
  it('displays builder-specific error message', () => {
    render(
      <WorkoutBuilderErrorBoundary componentName="Test Builder">
        <ThrowError shouldThrow={true} />
      </WorkoutBuilderErrorBoundary>
    );
    
    expect(screen.getByText(/The workout builder encountered an error/)).toBeInTheDocument();
  });
});

describe('WorkoutViewerErrorBoundary', () => {
  it('displays viewer-specific error message', () => {
    render(
      <WorkoutViewerErrorBoundary componentName="Test Viewer">
        <ThrowError shouldThrow={true} />
      </WorkoutViewerErrorBoundary>
    );
    
    expect(screen.getByText(/Unable to display the workout details/)).toBeInTheDocument();
  });
});