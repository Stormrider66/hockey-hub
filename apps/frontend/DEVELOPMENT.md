# Frontend Development Guide

## Overview

This guide covers development practices, patterns, and conventions for the Hockey Hub frontend application built with Next.js, TypeScript, and shadcn/ui.

## Architecture

### Directory Structure

```
apps/frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components (shadcn/ui)
│   │   ├── dashboards/  # Role-specific dashboards
│   │   └── shared/      # Shared components
│   ├── features/        # Feature-based modules
│   │   ├── player/      # Player-specific features
│   │   ├── coach/       # Coach-specific features
│   │   └── ...         # Other role features
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   ├── store/          # Redux store and slices
│   │   ├── api/        # RTK Query API slices
│   │   └── features/   # Redux slices
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── app/                # Next.js app directory (if using app router)
└── pages/              # Next.js pages (if using pages router)
```

## Component Development

### Creating New Components

1. **UI Components** (in `src/components/ui/`)
```tsx
// src/components/ui/custom-button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center",
          // Add variant and size classes
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CustomButton.displayName = "CustomButton"

export { CustomButton }
```

2. **Feature Components** (in `src/features/[role]/`)
```tsx
// src/features/player/components/TrainingCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TrainingCardProps {
  title: string;
  progress: number;
  dueDate: string;
}

export function TrainingCard({ title, progress, dueDate }: TrainingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground mt-2">
          Due: {dueDate}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Component Best Practices

1. **Use TypeScript Interfaces**
   - Define props interfaces for all components
   - Export interfaces for reusability

2. **Implement Accessibility**
   - Use semantic HTML elements
   - Add ARIA labels where needed
   - Ensure keyboard navigation

3. **Follow Naming Conventions**
   - Components: PascalCase
   - Files: kebab-case or PascalCase
   - Props interfaces: ComponentNameProps

## State Management

### Redux Toolkit Setup

1. **Creating a Slice**
```typescript
// src/store/features/trainingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TrainingState {
  sessions: TrainingSession[];
  loading: boolean;
}

const initialState: TrainingState = {
  sessions: [],
  loading: false,
};

const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<TrainingSession[]>) => {
      state.sessions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setSessions, setLoading } = trainingSlice.actions;
export default trainingSlice.reducer;
```

2. **Using RTK Query**
```typescript
// src/store/api/trainingApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const trainingApi = createApi({
  reducerPath: 'trainingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/training',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Training'],
  endpoints: (builder) => ({
    getTrainingSessions: builder.query<TrainingSession[], void>({
      query: () => 'sessions',
      providesTags: ['Training'],
    }),
    createTrainingSession: builder.mutation<TrainingSession, CreateSessionDto>({
      query: (session) => ({
        url: 'sessions',
        method: 'POST',
        body: session,
      }),
      invalidatesTags: ['Training'],
    }),
  }),
});

export const {
  useGetTrainingSessionsQuery,
  useCreateTrainingSessionMutation,
} = trainingApi;
```

## Styling Guidelines

### Using Tailwind CSS

1. **Utility Classes**
```tsx
// Prefer utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Use cn() helper for conditional classes
<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-blue-500 text-white",
  !isActive && "bg-gray-100"
)}>
```

2. **Design Tokens**
```typescript
// src/lib/design-utils.ts
export const spacing = {
  card: 'space-y-4',
  section: 'space-y-6',
  page: 'space-y-8',
};

export const shadows = {
  card: 'shadow-md hover:shadow-lg transition-shadow',
  dropdown: 'shadow-xl',
};
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Dashboard
</h1>
```

## Data Fetching

### Using RTK Query Hooks

```tsx
function TrainingList() {
  const { data: sessions, isLoading, error } = useGetTrainingSessionsQuery();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-4">
      {sessions?.map((session) => (
        <TrainingCard key={session.id} {...session} />
      ))}
    </div>
  );
}
```

### Optimistic Updates

```tsx
function CreateTraining() {
  const [createSession] = useCreateTrainingSessionMutation();

  const handleSubmit = async (data: CreateSessionDto) => {
    try {
      await createSession(data).unwrap();
      toast.success('Training session created!');
    } catch (error) {
      toast.error('Failed to create session');
    }
  };
}
```

## Testing

### Component Testing

```tsx
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

```tsx
// src/features/player/PlayerDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import PlayerDashboard from './PlayerDashboard';

describe('PlayerDashboard', () => {
  it('loads and displays player data', async () => {
    render(
      <Provider store={store}>
        <PlayerDashboard />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Today\'s Schedule')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### Code Splitting

```tsx
// Dynamic imports for route-based splitting
const PlayerDashboard = dynamic(
  () => import('@/features/player/PlayerDashboard'),
  { loading: () => <LoadingSpinner /> }
);
```

### Memoization

```tsx
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = React.memo(ExpensiveComponent);
```

## Common Patterns

### Custom Hooks

```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    // Login logic
  }, []);

  const logout = useCallback(() => {
    // Logout logic
  }, []);

  return { user, isAuthenticated, login, logout };
}
```

### Error Boundaries

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Development Workflow

### Adding a New Feature

1. Create feature directory: `src/features/[feature-name]/`
2. Add components in `components/` subdirectory
3. Add hooks in `hooks/` subdirectory
4. Create RTK Query API slice if needed
5. Add tests alongside components
6. Update Storybook stories

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-dashboard-widget

# Make changes and commit
git add .
git commit -m "feat: add new dashboard widget for training progress"

# Push to remote
git push -u origin feature/new-dashboard-widget

# Create pull request on GitHub
```

## Debugging

### Redux DevTools

```typescript
// View Redux state in browser DevTools
// Install Redux DevTools Extension
// State updates will be visible in the Redux tab
```

### React Developer Tools

```typescript
// Inspect component props and state
// Profile component performance
// Debug re-renders
```

## Deployment Considerations

### Environment Variables

```typescript
// Use NEXT_PUBLIC_ prefix for client-side vars
NEXT_PUBLIC_API_URL=https://api.hockeyhub.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.hockeyhub.com

// Server-only variables (no prefix)
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Build Optimization

```json
// next.config.js
module.exports = {
  images: {
    domains: ['hockey-hub-media.s3.amazonaws.com'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)