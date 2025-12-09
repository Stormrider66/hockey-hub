# Workout Error Boundaries

This directory contains error boundary components to gracefully handle errors in the Physical Trainer workout components.

## Components

### WorkoutErrorBoundary
Generic error boundary for any workout-related component.

```tsx
import { WorkoutErrorBoundary } from './WorkoutErrorBoundary';

<WorkoutErrorBoundary 
  componentName="My Component"
  onReset={() => console.log('Reset clicked')}
>
  <MyComponent />
</WorkoutErrorBoundary>
```

### WorkoutBuilderErrorBoundary
Specialized error boundary for workout builder components with builder-specific messaging.

```tsx
<WorkoutBuilderErrorBoundary componentName="Conditioning Builder">
  <ConditioningWorkoutBuilderSimple />
</WorkoutBuilderErrorBoundary>
```

### WorkoutViewerErrorBoundary
Specialized error boundary for workout viewer components with viewer-specific messaging.

```tsx
<WorkoutViewerErrorBoundary componentName="Interval Display">
  <IntervalDisplay />
</WorkoutViewerErrorBoundary>
```

## Features

- **Graceful Error Handling**: Catches JavaScript errors and displays user-friendly messages
- **Error Recovery**: "Try Again" button to reset component state
- **Development Details**: Shows error stack trace in development mode
- **Logging**: Automatically logs errors to console with component context
- **Custom Reset Logic**: Optional `onReset` callback for custom recovery actions
- **TypeScript Support**: Fully typed with React 18 error boundary patterns

## Usage Examples

### Basic Usage
```tsx
<WorkoutErrorBoundary>
  <MyWorkoutComponent />
</WorkoutErrorBoundary>
```

### With Custom Reset Handler
```tsx
<WorkoutErrorBoundary
  componentName="Session Builder"
  onReset={() => {
    // Clear local state
    setShowBuilder(false);
    // Navigate back
    router.back();
  }}
>
  <SessionBuilder />
</WorkoutErrorBoundary>
```

### Testing Error Boundaries
Use the included `ErrorBoundaryDemo` component to test error handling:

```tsx
import { ErrorBoundaryDemo } from './examples/ErrorBoundaryDemo';

<WorkoutErrorBoundary>
  <ErrorBoundaryDemo />
</WorkoutErrorBoundary>
```

## Error Types Handled

1. **Runtime Errors**: JavaScript execution errors
2. **Async Errors**: Errors in promises and async operations (when thrown in render)
3. **Component Errors**: Errors during React component lifecycle
4. **Null Reference Errors**: Accessing properties of null/undefined

## Best Practices

1. **Wrap at Feature Level**: Place error boundaries around feature components, not individual UI elements
2. **Provide Context**: Always include `componentName` prop for better error messages
3. **Custom Recovery**: Implement `onReset` handlers that restore valid application state
4. **Test Coverage**: Include error boundary tests for critical components
5. **User Communication**: Error messages should be helpful without exposing technical details

## Development vs Production

- **Development**: Shows full error details and stack trace
- **Production**: Shows only user-friendly error message

## Integration Points

Currently integrated with:
- ✅ ConditioningWorkoutBuilderSimple
- ✅ HybridWorkoutBuilderSimple
- ✅ AgilityWorkoutBuilderSimple
- ✅ SessionBuilder
- ✅ HybridDisplay
- ✅ AgilityDisplay
- ✅ IntervalDisplay (both instances)