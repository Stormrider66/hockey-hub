# Loading State Patterns and Best Practices

## Overview

Loading states are crucial for user experience in Hockey Hub. They provide visual feedback during asynchronous operations, prevent user confusion, and maintain perceived performance. This guide outlines our loading state philosophy and provides practical patterns for implementation.

## Philosophy

Our loading state approach follows these principles:

1. **Immediate Feedback**: Show loading states for any operation taking >100ms
2. **Progressive Enhancement**: Use skeleton screens for better perceived performance
3. **Contextual Awareness**: Choose loading patterns based on the operation context
4. **Graceful Degradation**: Always handle errors and provide recovery options
5. **Accessibility First**: Ensure screen readers announce loading states

## Loading State Decision Tree

```
┌─────────────────────────┐
│ What type of loading?   │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │ Full page load? │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ LoadingOverlay or Page Skeleton
        └───────┘
            │ No
            ▼
    ┌────────────────┐
    │ Inline data?   │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ LoadingSpinner or LoadingDots
        └───────┘
            │ No
            ▼
    ┌────────────────┐
    │ List/Grid?     │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ Skeleton screens (multiple items)
        └───────┘
            │ No
            ▼
    ┌────────────────┐
    │ Form submit?   │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ Button loading state + disabled form
        └───────┘
            │ No
            ▼
    ┌────────────────┐
    │ Navigation?    │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ Progress bar (top of page)
        └───────┘
            │ No
            ▼
    ┌────────────────┐
    │ File upload?   │
    └───────┬────────┘
            │
        ┌───┴───┐
        │  Yes  │────→ Progress bar with percentage
        └───────┘
```

## Component Usage Guide

### LoadingSpinner
**When to use**: Quick operations, buttons, inline replacements
```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Basic usage
<LoadingSpinner size="sm" />

// In a button
<Button disabled={isLoading}>
  {isLoading ? <LoadingSpinner size="xs" /> : 'Save'}
</Button>

// Inline with text
<div className="flex items-center gap-2">
  <LoadingSpinner size="sm" />
  <span>Loading data...</span>
</div>
```

### LoadingSkeleton
**When to use**: Content placeholders, preventing layout shift
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Text skeleton
<Skeleton className="h-4 w-[250px]" />

// Avatar skeleton
<Skeleton className="h-12 w-12 rounded-full" />

// Card skeleton
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>

// Custom skeleton component
function PlayerCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
    </div>
  );
}
```

### LoadingOverlay
**When to use**: Modal operations, page transitions, blocking actions
```tsx
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

// Full page overlay
<LoadingOverlay 
  isOpen={isLoading} 
  text="Processing payment..." 
/>

// Relative container overlay
<div className="relative">
  <LoadingOverlay 
    isOpen={isLoading} 
    text="Updating..." 
    className="absolute inset-0"
  />
  <YourContent />
</div>
```

### LoadingDots
**When to use**: Inline text, chat typing indicators, subtle loading
```tsx
import { LoadingDots } from '@/components/ui/LoadingDots';

// Chat typing indicator
<div className="text-sm text-gray-500">
  User is typing<LoadingDots />
</div>

// Inline status
<span>
  Processing<LoadingDots />
</span>
```

### ProgressBar
**When to use**: File uploads, multi-step operations, determinate progress
```tsx
import { Progress } from '@/components/ui/progress';

// File upload
<div className="space-y-2">
  <Progress value={uploadProgress} className="w-full" />
  <p className="text-sm text-gray-500">
    Uploading... {uploadProgress}%
  </p>
</div>

// Multi-step operation
<Progress 
  value={(currentStep / totalSteps) * 100} 
  className="w-full"
/>
```

### LoadingState Wrapper
**When to use**: Data fetching with loading, error, and empty states
```tsx
import { LoadingState } from '@/components/ui/LoadingState';

function PlayerList() {
  const { data, isLoading, error, refetch } = useGetPlayersQuery();

  return (
    <LoadingState
      isLoading={isLoading}
      error={error}
      data={data}
      onRetry={refetch}
      loadingComponent={<PlayerListSkeleton />}
      emptyMessage="No players found"
      emptyAction={
        <Button onClick={() => navigate('/players/new')}>
          Add First Player
        </Button>
      }
    >
      {data?.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </LoadingState>
  );
}
```

## Code Examples

### RTK Query with Loading States
```tsx
function WorkoutList() {
  const { 
    data: workouts, 
    isLoading, 
    isFetching,
    error,
    refetch 
  } = useGetWorkoutsQuery();

  // Show skeleton on initial load
  if (isLoading) {
    return <WorkoutListSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState 
        message="Failed to load workouts"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Show refetch indicator */}
      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoadingSpinner size="xs" />
          Updating...
        </div>
      )}
      
      {workouts?.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

### Form Submission Pattern
```tsx
function CreatePlayerForm() {
  const [createPlayer, { isLoading }] = useCreatePlayerMutation();
  
  const handleSubmit = async (values) => {
    try {
      await createPlayer(values).unwrap();
      toast.success('Player created successfully');
      navigate('/players');
    } catch (error) {
      toast.error('Failed to create player');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isLoading}>
        {/* Form fields */}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="xs" className="mr-2" />
              Creating...
            </>
          ) : (
            'Create Player'
          )}
        </Button>
      </fieldset>
    </form>
  );
}
```

### Lazy Loading with Skeletons
```tsx
function TeamDashboard() {
  const [activeTab, setActiveTab] = useState('roster');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="roster">Roster</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
      </TabsList>

      <TabsContent value="roster">
        <Suspense fallback={<RosterSkeleton />}>
          <LazyRoster />
        </Suspense>
      </TabsContent>

      <TabsContent value="schedule">
        <Suspense fallback={<ScheduleSkeleton />}>
          <LazySchedule />
        </Suspense>
      </TabsContent>

      <TabsContent value="stats">
        <Suspense fallback={<StatsSkeleton />}>
          <LazyStats />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
```

### Error Recovery Flow
```tsx
function DataFetcher({ queryFn, renderData }) {
  const [retryCount, setRetryCount] = useState(0);
  const { data, isLoading, error, refetch } = queryFn();

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  if (isLoading && retryCount === 0) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">
          {error.message || 'Something went wrong'}
        </p>
        <Button 
          onClick={handleRetry}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="xs" className="mr-2" />
              Retrying...
            </>
          ) : (
            `Retry${retryCount > 0 ? ` (${retryCount})` : ''}`
          )}
        </Button>
      </div>
    );
  }

  return renderData(data);
}
```

### Optimistic Updates
```tsx
function TodoList() {
  const { data: todos } = useGetTodosQuery();
  const [updateTodo] = useUpdateTodoMutation();

  const handleToggle = async (todo) => {
    // Optimistic update
    const optimisticTodo = { ...todo, completed: !todo.completed };
    
    try {
      await updateTodo(optimisticTodo).unwrap();
    } catch (error) {
      // Revert on error
      toast.error('Failed to update todo');
    }
  };

  return (
    <div className="space-y-2">
      {todos?.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo}
          onToggle={() => handleToggle(todo)}
        />
      ))}
    </div>
  );
}
```

## Performance Guidelines

### When to Show Loading States

| Duration | Loading State | User Perception |
|----------|--------------|-----------------|
| 0-100ms | None | Instant |
| 100-300ms | Subtle indicator (dots) | Fast |
| 300-1000ms | Spinner | Normal |
| 1-3s | Skeleton + message | Slow |
| 3s+ | Progress + detailed status | Very slow |

### Skeleton vs Spinner Decision

**Use Skeletons when:**
- Loading lists or grids
- Initial page load
- Preventing layout shift
- Known content structure

**Use Spinners when:**
- Unknown content size
- Quick operations
- Button actions
- Inline updates

### Preventing Layout Shift
```tsx
// ❌ Bad: Causes layout shift
{isLoading ? <Spinner /> : <Content />}

// ✅ Good: Maintains layout
{isLoading ? <ContentSkeleton /> : <Content />}

// ✅ Good: Fixed container
<div className="min-h-[200px]">
  {isLoading ? <Spinner /> : <Content />}
</div>
```

### Progressive Loading Strategies
```tsx
function Dashboard() {
  // Load critical data first
  const { data: user, isLoading: userLoading } = useGetUserQuery();
  
  // Load non-critical data after
  const { data: stats } = useGetStatsQuery(user?.id, {
    skip: !user
  });
  
  const { data: notifications } = useGetNotificationsQuery(user?.id, {
    skip: !user
  });

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <UserHeader user={user} />
      
      <Suspense fallback={<StatsSkeleton />}>
        <StatsWidget stats={stats} />
      </Suspense>
      
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsWidget notifications={notifications} />
      </Suspense>
    </div>
  );
}
```

## Implementation Checklist

### Component Migration
- [ ] Audit all loading states in the application
- [ ] Replace hardcoded spinners with appropriate components
- [ ] Add skeletons for all list/grid views
- [ ] Implement LoadingState wrapper for data fetching
- [ ] Add error states with retry functionality
- [ ] Test on slow 3G connection

### Code Review Checklist
- [ ] Loading state shows within 100ms
- [ ] Skeleton screens prevent layout shift
- [ ] Error states have retry options
- [ ] Loading states are accessible (aria-labels)
- [ ] Form submissions disable inputs
- [ ] Optimistic updates where appropriate

### Testing Checklist
- [ ] Test with network throttling
- [ ] Test error scenarios
- [ ] Test rapid interactions
- [ ] Test screen reader announcements
- [ ] Test mobile loading states
- [ ] Test offline functionality

## Migration Guide

### Step 1: Identify Current Patterns
```tsx
// Find all instances of loading patterns
// Search for: isLoading, isPending, isFetching
// Search for: "Loading...", <Spinner, circular progress
```

### Step 2: Choose Appropriate Replacement
```tsx
// ❌ Old pattern
{isLoading && <div>Loading...</div>}

// ✅ New pattern - for inline
{isLoading && <LoadingSpinner size="sm" />}

// ✅ New pattern - for content
{isLoading ? <ContentSkeleton /> : <Content />}
```

### Step 3: Add Error Handling
```tsx
// ❌ Old pattern
{isLoading ? <Spinner /> : <Content />}

// ✅ New pattern
<LoadingState
  isLoading={isLoading}
  error={error}
  data={data}
  onRetry={refetch}
>
  <Content data={data} />
</LoadingState>
```

### Step 4: Test Loading States
```tsx
// Add artificial delay for testing
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In development
if (process.env.NODE_ENV === 'development') {
  await delay(2000); // Test loading state
}
```

### Common Pitfalls to Avoid

1. **Forgetting Error States**
   ```tsx
   // ❌ Bad
   {isLoading ? <Spinner /> : <Content />}
   
   // ✅ Good
   {isLoading ? <Spinner /> : error ? <Error /> : <Content />}
   ```

2. **Multiple Loading States**
   ```tsx
   // ❌ Bad: Confusing
   {isLoadingUsers && <Spinner />}
   {isLoadingTeams && <Spinner />}
   
   // ✅ Good: Combined
   {(isLoadingUsers || isLoadingTeams) && <Spinner />}
   ```

3. **Missing Accessibility**
   ```tsx
   // ❌ Bad
   <Spinner />
   
   // ✅ Good
   <Spinner aria-label="Loading players" />
   ```

4. **Instant Loading States**
   ```tsx
   // ❌ Bad: Flashing
   {isLoading && <Spinner />}
   
   // ✅ Good: Delayed
   const showLoading = useDelayedLoading(isLoading, 100);
   {showLoading && <Spinner />}
   ```

## Testing Loading States

### Manual Testing
```tsx
// Chrome DevTools
// 1. Open Network tab
// 2. Set throttling to "Slow 3G"
// 3. Test all loading scenarios

// React DevTools
// 1. Find component
// 2. Edit props: isLoading = true
// 3. Verify loading state appearance
```

### Automated Testing
```tsx
// Jest/React Testing Library
test('shows loading state', () => {
  const { getByRole } = render(<PlayerList />);
  
  // Verify loading state
  expect(getByRole('status')).toHaveAttribute(
    'aria-label', 
    'Loading players'
  );
});

test('shows error state with retry', async () => {
  // Mock error response
  server.use(
    rest.get('/api/players', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  const { getByText, getByRole } = render(<PlayerList />);
  
  // Wait for error
  await waitFor(() => {
    expect(getByText(/failed to load/i)).toBeInTheDocument();
  });
  
  // Verify retry button
  expect(getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
```

### E2E Testing
```tsx
// Cypress
describe('Loading States', () => {
  it('shows skeleton during initial load', () => {
    cy.intercept('GET', '/api/players', {
      delay: 1000,
      fixture: 'players.json'
    });

    cy.visit('/players');
    
    // Verify skeleton
    cy.get('[data-testid="player-skeleton"]').should('be.visible');
    
    // Verify content after load
    cy.get('[data-testid="player-card"]').should('have.length', 10);
  });
});
```

## Accessibility Considerations

### Screen Reader Announcements
```tsx
// Use live regions for dynamic updates
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading players...' : `${players.length} players loaded`}
</div>

// Loading button
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Keyboard Navigation
```tsx
// Maintain focus during loading
function MaintainFocus() {
  const ref = useRef();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && ref.current) {
      ref.current.focus();
    }
  }, [isLoading]);

  return (
    <button ref={ref} onClick={handleClick}>
      {isLoading ? <LoadingSpinner /> : 'Click me'}
    </button>
  );
}
```

### Color Contrast
Ensure loading indicators meet WCAG contrast requirements:
- Spinner: 3:1 contrast ratio minimum
- Skeleton: Subtle animation, not relying on color alone
- Progress bars: Clear visual distinction

## Conclusion

Effective loading states are essential for a great user experience. By following these patterns and best practices, Hockey Hub provides consistent, performant, and accessible loading experiences across the entire application.

Remember:
- Choose the right loading component for the context
- Always handle errors gracefully
- Test on slow connections
- Keep accessibility in mind
- Prevent layout shift with skeletons

For questions or suggestions, please contact the Hockey Hub development team.