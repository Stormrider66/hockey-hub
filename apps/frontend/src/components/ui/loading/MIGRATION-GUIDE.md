# Loading Component Migration Guide

This guide helps you migrate from old loading patterns to the new standardized loading components.

## Quick Reference

### Pattern 1: Simple Spinner
```tsx
// OLD
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

// NEW
import { LoadingSpinner } from '@/components/ui/loading';
<LoadingSpinner size="lg" />
```

### Pattern 2: Spinner with Text
```tsx
// OLD
<div className="flex items-center justify-center h-64">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
    <p className="text-muted-foreground">Loading...</p>
  </div>
</div>

// NEW
import { LoadingSpinner } from '@/components/ui/loading';
<LoadingSpinner size="xl" text="Loading..." />
```

### Pattern 3: Loading State with Error Handling
```tsx
// OLD
if (isLoading) {
  return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>;
}
if (error) {
  return <div>Error: {error.message}</div>;
}
if (!data || data.length === 0) {
  return <div>No data</div>;
}
return <div>{/* content */}</div>;

// NEW
import { LoadingState } from '@/components/ui/loading';
<LoadingState 
  isLoading={isLoading}
  error={error}
  isEmpty={!data || data.length === 0}
  onRetry={refetch}
>
  {/* content */}
</LoadingState>
```

### Pattern 4: Inline Spinner (no centering)
```tsx
// OLD
<RefreshCw className="animate-spin h-4 w-4" />

// NEW
import { LoadingSpinner } from '@/components/ui/loading';
<LoadingSpinner size="sm" center={false} />
```

## Size Conversions

| Old Pattern | New Size |
|-------------|----------|
| h-3 w-3 | size="xs" |
| h-4 w-4 | size="sm" |
| h-6 w-6 | size="md" (default) |
| h-8 w-8 | size="lg" |
| h-12 w-12 | size="xl" |

## Color/Variant Mappings

| Old Pattern | New Variant |
|-------------|-------------|
| border-primary, text-primary | variant="primary" (default) |
| border-secondary, text-secondary | variant="secondary" |
| border-muted-foreground, text-muted-foreground | variant="muted" |
| border-destructive, text-destructive | variant="destructive" |
| border-green-*, text-green-* | variant="success" |

## Advanced Usage

### Custom Loading Component
```tsx
<LoadingState
  isLoading={isLoading}
  loadingComponent={<CustomSkeleton />}
>
  {/* content */}
</LoadingState>
```

### Custom Error Component
```tsx
<LoadingState
  isLoading={isLoading}
  error={error}
  errorComponent={<CustomErrorDisplay error={error} />}
>
  {/* content */}
</LoadingState>
```

### Button with Loading State
```tsx
// OLD
<Button disabled={isLoading}>
  {isLoading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
  Save
</Button>

// NEW
<Button disabled={isLoading}>
  {isLoading && <LoadingSpinner size="sm" center={false} className="mr-2" />}
  Save
</Button>
```

## Migration Steps

1. **Import the new components**:
   ```tsx
   import { LoadingSpinner, LoadingState } from '@/components/ui/loading';
   ```

2. **Replace simple spinners**: Search for `animate-spin` and replace with `<LoadingSpinner />`

3. **Replace loading states**: Look for patterns with `isLoading`, `error`, and empty checks, replace with `<LoadingState />`

4. **Update icons**: Replace `<RefreshCw className="animate-spin" />` with `<LoadingSpinner />`

5. **Test the changes**: Ensure loading states work correctly

## Benefits

- ✅ Consistent loading UI across the app
- ✅ Built-in error handling with retry
- ✅ Accessible loading states
- ✅ TypeScript support
- ✅ Customizable and extensible
- ✅ Better performance (no custom CSS animations)
- ✅ Semantic sizing system