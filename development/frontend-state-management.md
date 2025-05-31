# Hockey App - Frontend State Management Strategy

## Overview

This document defines the state management strategy for the Hockey App frontend, providing guidelines and patterns for implementing Redux Toolkit (RTK) and RTK Query. It serves as a reference for developers to ensure consistent state management across the application.

## Table of Contents

1. [Redux Store Architecture](#redux-store-architecture)
2. [Slice Organization](#slice-organization)
3. [RTK Query Implementation](#rtk-query-implementation)
4. [Global vs. Local State](#global-vs-local-state)
5. [Component Connection Patterns](#component-connection-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Testing Strategy](#testing-strategy)
8. [Examples](#examples)

## Redux Store Architecture

### Store Configuration

The Hockey App uses a single Redux store with multiple slices. The store is configured using Redux Toolkit's `configureStore` function:

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { apiSlice } from './api/apiSlice';

// Import reducers
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import calendarReducer from './slices/calendarSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    // Feature slices
    auth: authReducer,
    ui: uiReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
    
    // API slice (from RTK Query)
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Export types and hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Store Provider Setup

The store is provided to the application using the Redux `Provider` component:

```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

## Slice Organization

Slices in the Hockey App are organized by feature domain, following a modular approach that aligns with the microservice architecture of the backend.

### Core Slices

1. **Auth Slice**: Manages authentication state, user info, and permissions
2. **UI Slice**: Global UI state like theme, language, and modals
3. **Calendar Slice**: Active date ranges, view type, filters
4. **Notifications Slice**: User notifications and alerts

### Feature-based Slices

Additional slices are created as needed for specific features. Each slice follows a consistent file structure:

```
/src
  /store
    /slices
      /authSlice.ts
      /uiSlice.ts
      /calendarSlice.ts
      /notificationsSlice.ts
      /teamSlice.ts
      /trainingSlice.ts
      ...
```

### Slice Template

Each slice follows this standard template:

```typescript
// src/store/slices/featureSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the state type
export interface FeatureState {
  // State properties
  isLoading: boolean;
  error: string | null;
  data: Array<any>;
  selectedId: string | null;
}

// Define the initial state
const initialState: FeatureState = {
  isLoading: false,
  error: null,
  data: [],
  selectedId: null,
};

// Create the slice
const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    // Synchronous actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setData: (state, action: PayloadAction<Array<any>>) => {
      state.data = action.payload;
    },
    setSelectedId: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    clearFeature: (state) => {
      // Reset to initial state
      return initialState;
    },
  },
  // For handling async actions from createAsyncThunk
  extraReducers: (builder) => {
    // Add async action handlers if needed
  },
});

// Export actions
export const { 
  setLoading, 
  setError, 
  setData, 
  setSelectedId,
  clearFeature 
} = featureSlice.actions;

// Export reducer
export default featureSlice.reducer;

// Selectors
export const selectFeatureData = (state: RootState) => state.feature.data;
export const selectFeatureLoading = (state: RootState) => state.feature.isLoading;
export const selectFeatureError = (state: RootState) => state.feature.error;
export const selectSelectedId = (state: RootState) => state.feature.selectedId;
```

### Naming Conventions

- **Slice Names**: Use camelCase for slice names (`authSlice`, `teamSlice`)
- **Action Names**: Use descriptive, present-tense verbs with nouns (`setLoading`, `addTeamMember`, `updateUserProfile`)
- **Selector Names**: Prefix with `select` followed by the data being selected (`selectUserProfile`, `selectActiveTeams`)

## RTK Query Implementation

RTK Query is used for all API calls to ensure consistent data fetching, caching, and state management. It replaces traditional thunks for most API interactions.

### API Slice Structure

The API slice is organized into a base configuration and feature-specific endpoints:

```
/src
  /store
    /api
      /apiSlice.ts         # Base API slice configuration
      /authApi.ts          # Authentication endpoints
      /teamApi.ts          # Team-related endpoints
      /calendarApi.ts      # Calendar-related endpoints
      ...
```

### Base API Slice

```typescript
// src/store/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

// Define the base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = (getState() as RootState).auth.token;
      
      // Add authorization header if token exists
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Get preferred language from UI state
      const language = (getState() as RootState).ui.language;
      if (language) {
        headers.set('Accept-Language', language);
      }
      
      return headers;
    },
    credentials: 'include', // For cookies if needed
  }),
  tagTypes: [
    'User', 
    'Team', 
    'Player', 
    'Event', 
    'Training', 
    'Injury',
    'Notification',
    'TestResult',
    'Chat'
  ],
  endpoints: () => ({}), // Endpoints will be injected from other files
});

// Export hooks for use in components
export const {
  middleware: apiMiddleware,
  reducer: apiReducer,
  reducerPath: apiReducerPath,
} = apiSlice;
```

### Feature-Specific API Slice

```typescript
// src/store/api/teamApi.ts
import { apiSlice } from './apiSlice';
import { Team, TeamMember } from '../../types';

// Create a teams API with RTK Query
export const teamApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get teams
    getTeams: builder.query<Team[], void>({
      query: () => '/teams',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Team' as const, id })),
              { type: 'Team', id: 'LIST' },
            ]
          : [{ type: 'Team', id: 'LIST' }],
    }),
    
    // Get team by ID
    getTeam: builder.query<Team, string>({
      query: (id) => `/teams/${id}`,
      providesTags: (result, error, id) => [{ type: 'Team', id }],
    }),
    
    // Create team
    createTeam: builder.mutation<Team, Partial<Team>>({
      query: (team) => ({
        url: '/teams',
        method: 'POST',
        body: team,
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    
    // Update team
    updateTeam: builder.mutation<Team, { id: string; team: Partial<Team> }>({
      query: ({ id, team }) => ({
        url: `/teams/${id}`,
        method: 'PUT',
        body: team,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
    }),
    
    // Delete team
    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    
    // Get team members
    getTeamMembers: builder.query<TeamMember[], string>({
      query: (teamId) => `/teams/${teamId}/members`,
      providesTags: (result, error, teamId) => [
        { type: 'Team', id: `${teamId}-members` },
      ],
    }),
    
    // Add team member
    addTeamMember: builder.mutation<
      TeamMember,
      { teamId: string; userId: string; role: string }
    >({
      query: ({ teamId, userId, role }) => ({
        url: `/teams/${teamId}/members`,
        method: 'POST',
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: 'Team', id: `${teamId}-members` },
      ],
    }),
    
    // Remove team member
    removeTeamMember: builder.mutation<
      void,
      { teamId: string; userId: string }
    >({
      query: ({ teamId, userId }) => ({
        url: `/teams/${teamId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: 'Team', id: `${teamId}-members` },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetTeamsQuery,
  useGetTeamQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = teamApi;
```

### Error Handling with RTK Query

Standardized error handling is implemented across RTK Query endpoints:

```typescript
// src/utils/errorUtils.ts
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Type guard for RTK Query errors
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

export function isSerializedError(error: unknown): error is SerializedError {
  return (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    'name' in error
  );
}

// Extract error message from various error types
export function getErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    // Handle FetchBaseQueryError
    if ('error' in error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
    
    return `Error ${error.status}: ${JSON.stringify(error.data)}`;
  } else if (isSerializedError(error)) {
    // Handle SerializedError
    return error.message || 'An error occurred';
  }
  
  // Handle other errors
  return typeof error === 'string' ? error : 'An unknown error occurred';
}
```

## Global vs. Local State

The Hockey App follows a clear distinction between global and local state to ensure optimized performance and maintainability.

### Global State (Redux)

Store these types of state in Redux:

1. **Authentication data**: User info, tokens, permissions
2. **Entity data**: Teams, players, events, schedules, etc.
3. **UI state shared across components**: Theme, language, navigation
4. **Application-wide flags**: Loading states for major operations
5. **Persistent data**: User preferences, filters, settings

### Local State (React)

Keep these types of state local to components:

1. **Form state**: Input values, validation errors (use React Hook Form)
2. **UI interactions**: Hover states, expanded/collapsed elements
3. **Component-specific flags**: Loading state for a specific component
4. **Temporary data**: Wizard/stepper state before submission
5. **Visual state**: Animations, transitions

### Decision Framework

Use this decision tree to determine where to store state:

```
Is the state needed by multiple unrelated components?
├── Yes → Use Redux
└── No → Is the state needed after navigation?
    ├── Yes → Use Redux
    └── No → Is the state derived from an API?
        ├── Yes → Use RTK Query
        └── No → Use local state
```

## Component Connection Patterns

### Connecting Components to Redux

Use the typed hooks from the store instead of the generic Redux hooks:

```typescript
// src/components/TeamList.tsx
import React from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { selectTeams } from '../store/slices/teamSlice';
import { useGetTeamsQuery } from '../store/api/teamApi';

export const TeamList: React.FC = () => {
  // Use the typed selector hook
  const selectedTeamId = useAppSelector(state => state.team.selectedTeamId);
  
  // Use the typed dispatch hook
  const dispatch = useAppDispatch();
  
  // Use RTK Query hook
  const { data: teams, isLoading, error } = useGetTeamsQuery();
  
  if (isLoading) return <div>Loading teams...</div>;
  if (error) return <div>Error loading teams</div>;
  
  return (
    <div>
      <h2>Teams</h2>
      <ul>
        {teams?.map(team => (
          <li 
            key={team.id}
            className={team.id === selectedTeamId ? 'selected' : ''}
            onClick={() => dispatch(setSelectedTeamId(team.id))}
          >
            {team.name}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Connected Component Organization

```
/src
  /components
    /common                   # Reusable UI components
    /features
      /teams
        TeamList.tsx          # Container component connected to Redux
        TeamDetails.tsx       # Container component connected to Redux
        TeamForm.tsx          # Form component with local state
        components/           # Presentational components for team feature
          TeamCard.tsx        # Presentational component
          TeamHeader.tsx      # Presentational component
      /calendar
        Calendar.tsx          # Container component connected to Redux
        EventDetails.tsx      # Container component connected to Redux
        components/           # Presentational components for calendar feature
```

### Container and Presentational Pattern

For complex components, separate the connected container from the presentational component:

```typescript
// src/features/teams/TeamDetailsContainer.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetTeamQuery } from '../../store/api/teamApi';
import TeamDetails from './components/TeamDetails';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';

const TeamDetailsContainer: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: team, isLoading, error } = useGetTeamQuery(teamId!);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!team) return <div>Team not found</div>;
  
  return <TeamDetails team={team} />;
};

export default TeamDetailsContainer;
```

```typescript
// src/features/teams/components/TeamDetails.tsx
import React from 'react';
import { Team } from '../../../types';

interface TeamDetailsProps {
  team: Team;
}

const TeamDetails: React.FC<TeamDetailsProps> = ({ team }) => {
  return (
    <div className="team-details">
      <h2>{team.name}</h2>
      <div className="team-info">
        <p><strong>Category:</strong> {team.category}</p>
        <p><strong>Season:</strong> {team.season}</p>
        {/* Other team details */}
      </div>
    </div>
  );
};

export default TeamDetails;
```

## Performance Optimization

### Memoization Strategies

1. **Memoized Selectors**: Use `createSelector` from Redux Toolkit for complex derived data:

```typescript
// src/store/slices/teamSlice.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selector
export const selectTeams = (state: RootState) => state.team.teams;

// Memoized selector for filtering teams by category
export const selectTeamsByCategory = createSelector(
  [selectTeams, (state, category: string) => category],
  (teams, category) => teams.filter(team => team.category === category)
);

// Memoized selector for active teams
export const selectActiveTeams = createSelector(
  [selectTeams],
  (teams) => teams.filter(team => team.status === 'active')
);

// Memoized selector for team members count
export const selectTeamMembersCounts = createSelector(
  [selectTeams],
  (teams) => teams.map(team => ({
    id: team.id,
    name: team.name,
    memberCount: team.members?.length || 0
  }))
);
```

2. **Component Memoization**: Use React's `memo`, `useMemo`, and `useCallback` for optimized renders:

```typescript
// src/features/teams/components/TeamCard.tsx
import React, { memo, useCallback } from 'react';
import { Team } from '../../../types';

interface TeamCardProps {
  team: Team;
  onSelect: (teamId: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = memo(({ team, onSelect }) => {
  // Memoize the click handler
  const handleClick = useCallback(() => {
    onSelect(team.id);
  }, [team.id, onSelect]);
  
  return (
    <div className="team-card" onClick={handleClick}>
      <h3>{team.name}</h3>
      <div className="team-card-details">
        <span>{team.category}</span>
        <span>{team.members?.length || 0} members</span>
      </div>
    </div>
  );
});

export default TeamCard;
```

### Optimized RTK Query Usage

1. **Skip queries conditionally**:

```typescript
// Only fetch team members when team is selected
const { data: teamMembers } = useGetTeamMembersQuery(selectedTeamId, {
  skip: !selectedTeamId,
});
```

2. **Control refetching behavior**:

```typescript
const { data: teams } = useGetTeamsQuery(undefined, {
  refetchOnMountOrArgChange: true, // Refetch when component mounts or arguments change
  refetchOnFocus: false, // Don't refetch when window regains focus
  refetchOnReconnect: true, // Refetch when reconnected after being offline
});
```

3. **Manual cache updates for optimistic UI**:

```typescript
const [addTeamMember] = useAddTeamMemberMutation();

const handleAddMember = async () => {
  try {
    // Optimistically update the cache
    addTeamMember(
      { teamId, userId, role },
      {
        // Optimistic update
        optimisticUpdate: (cache) => {
          // Get current cache entry
          const existingMembers = cache.getQueryData(['teamMembers', teamId]);
          
          // Update cache with optimistic data
          if (existingMembers) {
            cache.updateQueryData(['teamMembers', teamId], (draft) => {
              draft.push({
                id: 'temp-id', // Temporary ID
                userId,
                role,
                name: 'New Member', // Temporary data
                // other required fields
              });
            });
          }
        },
      }
    );
  } catch (error) {
    // Handle error
  }
};
```

## Testing Strategy

### Testing Redux Slices

```typescript
// src/store/slices/__tests__/teamSlice.test.ts
import teamReducer, {
  initialState,
  setSelectedTeamId,
  setTeams,
} from '../teamSlice';

describe('Team Slice', () => {
  it('should return the initial state on first run', () => {
    // Arrange
    const nextState = initialState;
    
    // Act
    const result = teamReducer(undefined, { type: '' });
    
    // Assert
    expect(result).toEqual(nextState);
  });
  
  it('should set selectedTeamId correctly', () => {
    // Arrange
    const teamId = '123';
    
    // Act
    const nextState = teamReducer(initialState, setSelectedTeamId(teamId));
    
    // Assert
    expect(nextState.selectedTeamId).toEqual(teamId);
  });
  
  it('should set teams correctly', () => {
    // Arrange
    const teams = [
      { id: '1', name: 'Team 1' },
      { id: '2', name: 'Team 2' },
    ];
    
    // Act
    const nextState = teamReducer(initialState, setTeams(teams));
    
    // Assert
    expect(nextState.teams).toEqual(teams);
  });
});
```

### Testing RTK Query Hooks

```typescript
// src/store/api/__tests__/teamApi.test.ts
import { setupApiStore } from '../../test-utils';
import { teamApi } from '../teamApi';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock server
const server = setupServer(
  rest.get('/api/v1/teams', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Team 1', category: 'Junior' },
        { id: '2', name: 'Team 2', category: 'Senior' },
      ])
    );
  }),
  rest.get('/api/v1/teams/1', (req, res, ctx) => {
    return res(
      ctx.json({ id: '1', name: 'Team 1', category: 'Junior' })
    );
  })
);

// Setup test store
const storeRef = setupApiStore(teamApi);

describe('Team API', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('fetches teams successfully', async () => {
    // Act
    const { data, isLoading, isError } = await storeRef.store
      .dispatch(teamApi.endpoints.getTeams.initiate());
      
    // Assert
    expect(isLoading).toBe(false);
    expect(isError).toBe(false);
    expect(data).toEqual([
      { id: '1', name: 'Team 1', category: 'Junior' },
      { id: '2', name: 'Team 2', category: 'Senior' },
    ]);
  });
  
  it('fetches single team by id successfully', async () => {
    // Act
    const { data, isLoading, isError } = await storeRef.store
      .dispatch(teamApi.endpoints.getTeam.initiate('1'));
      
    // Assert
    expect(isLoading).toBe(false);
    expect(isError).toBe(false);
    expect(data).toEqual({ id: '1', name: 'Team 1', category: 'Junior' });
  });
});
```

### Testing Connected Components

```typescript
// src/components/TeamList/__tests__/TeamList.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '../../../store/test-utils';
import TeamList from '../TeamList';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock server
const server = setupServer(
  rest.get('/api/v1/teams', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Team Alpha', category: 'Junior' },
        { id: '2', name: 'Team Beta', category: 'Senior' },
      ])
    );
  })
);

describe('TeamList Component', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('renders teams when data is loaded', async () => {
    // Arrange
    const store = setupStore();
    
    // Act
    render(
      <Provider store={store}>
        <TeamList />
      </Provider>
    );
    
    // Assert - Wait for teams to load
    expect(await screen.findByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });
  
  it('handles team selection', async () => {
    // Arrange
    const store = setupStore();
    
    // Act
    render(
      <Provider store={store}>
        <TeamList />
      </Provider>
    );
    
    // Wait for data to load
    const teamElement = await screen.findByText('Team Alpha');
    
    // Click on team
    fireEvent.click(teamElement);
    
    // Assert
    expect(store.getState().team.selectedTeamId).toBe('1');
  });
});
```

## Examples

### Complete Authentication Slice Example

```typescript
// src/store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { AuthService } from '../../services/authService';
import { User, LoginCredentials, RegisterData } from '../../types';

// State type
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await AuthService.refreshToken(refreshToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      
      // Store in localStorage for persistence
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        
        // Store in localStorage for persistence
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        
        // Store in localStorage for persistence
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        // Remove from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Refresh Token
    builder
      .addCase(refreshAuthToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        
        // Update localStorage
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        // Remove from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
  },
});

// Export actions
export const { 
  clearError, 
  setCredentials, 
  clearCredentials,
  updateUser
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
```

### Complete RTK Query API Example for Calendar Service

```typescript
// src/store/api/calendarApi.ts
import { apiSlice } from './apiSlice';
import { Event, Resource, Location, EventParticipant } from '../../types';

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get events with filtering
    getEvents: builder.query<
      Event[],
      {
        start?: string;
        end?: string;
        teamId?: string;
        eventTypeId?: string;
        locationId?: string;
      }
    >({
      query: (params) => ({
        url: '/events',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Event' as const, id })),
              { type: 'Event', id: 'LIST' },
            ]
          : [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Get single event
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
    
    // Create event
    createEvent: builder.mutation<Event, Partial<Event>>({
      query: (event) => ({
        url: '/events',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Update event
    updateEvent: builder.mutation<Event, { id: string; event: Partial<Event> }>({
      query: ({ id, event }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: event,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Event', id },
        { type: 'Event', id: 'LIST' },
      ],
    }),
    
    // Delete event
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    
    // Update event status
    updateEventStatus: builder.mutation<
      Event,
      { id: string; status: 'scheduled' | 'canceled' | 'completed' }
    >({
      query: ({ id, status }) => ({
        url: `/events/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Event', id },
        { type: 'Event', id: 'LIST' },
      ],
    }),
    
    // Get event participants
    getEventParticipants: builder.query<EventParticipant[], string>({
      query: (eventId) => `/events/${eventId}/participants`,
      providesTags: (result, error, eventId) => [
        { type: 'Event', id: `${eventId}-participants` },
      ],
    }),
    
    // Add event participant
    addEventParticipant: builder.mutation<
      EventParticipant,
      { eventId: string; userId: string }
    >({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/participants`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Event', id: `${eventId}-participants` },
      ],
    }),
    
    // Remove event participant
    removeEventParticipant: builder.mutation<
      void,
      { eventId: string; userId: string }
    >({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId }) => [
        { type: 'Event', id: `${eventId}-participants` },
      ],
    }),
    
    // Get resources
    getResources: builder.query<Resource[], { locationId?: string }>({
      query: (params) => ({
        url: '/resources',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Resource' as const, id })),
              { type: 'Resource', id: 'LIST' },
            ]
          : [{ type: 'Resource', id: 'LIST' }],
    }),
    
    // Get resource availability
    getResourceAvailability: builder.query<
      { available: boolean; conflictingEvents?: Event[] },
      { resourceId: string; start: string; end: string }
    >({
      query: ({ resourceId, start, end }) => ({
        url: `/resources/${resourceId}/availability`,
        params: { start, end },
      }),
    }),
    
    // Get locations
    getLocations: builder.query<Location[], void>({
      query: () => '/locations',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Location' as const, id })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),
  }),
});

// Export hooks
export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useUpdateEventStatusMutation,
  useGetEventParticipantsQuery,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useGetResourcesQuery,
  useGetResourceAvailabilityQuery,
  useGetLocationsQuery,
} = calendarApi;
```

### Calendar Slice Example (Local UI State)

```typescript
// src/store/slices/calendarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Interface for view types
type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarState {
  // The current date being viewed
  viewDate: string;
  // The current view type
  viewType: CalendarViewType;
  // Filters
  filters: {
    teamId: string | null;
    eventTypeIds: string[];
    locationId: string | null;
    showCanceled: boolean;
  };
  // Selected event ID
  selectedEventId: string | null;
  // UI state
  isEventModalOpen: boolean;
  isResourceModalOpen: boolean;
}

const initialState: CalendarState = {
  viewDate: new Date().toISOString(),
  viewType: 'month',
  filters: {
    teamId: null,
    eventTypeIds: [],
    locationId: null,
    showCanceled: false,
  },
  selectedEventId: null,
  isEventModalOpen: false,
  isResourceModalOpen: false,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // Change the current date being viewed
    setViewDate: (state, action: PayloadAction<string>) => {
      state.viewDate = action.payload;
    },
    
    // Change the view type
    setViewType: (state, action: PayloadAction<CalendarViewType>) => {
      state.viewType = action.payload;
    },
    
    // Change team filter
    setTeamFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.teamId = action.payload;
    },
    
    // Change event type filters
    setEventTypeFilters: (state, action: PayloadAction<string[]>) => {
      state.filters.eventTypeIds = action.payload;
    },
    
    // Add event type filter
    addEventTypeFilter: (state, action: PayloadAction<string>) => {
      if (!state.filters.eventTypeIds.includes(action.payload)) {
        state.filters.eventTypeIds.push(action.payload);
      }
    },
    
    // Remove event type filter
    removeEventTypeFilter: (state, action: PayloadAction<string>) => {
      state.filters.eventTypeIds = state.filters.eventTypeIds.filter(
        id => id !== action.payload
      );
    },
    
    // Change location filter
    setLocationFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.locationId = action.payload;
    },
    
    // Toggle showing canceled events
    toggleShowCanceled: (state) => {
      state.filters.showCanceled = !state.filters.showCanceled;
    },
    
    // Select an event
    selectEvent: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload;
    },
    
    // Open event modal
    openEventModal: (state) => {
      state.isEventModalOpen = true;
    },
    
    // Close event modal
    closeEventModal: (state) => {
      state.isEventModalOpen = false;
    },
    
    // Open resource modal
    openResourceModal: (state) => {
      state.isResourceModalOpen = true;
    },
    
    // Close resource modal
    closeResourceModal: (state) => {
      state.isResourceModalOpen = false;
    },
    
    // Reset all filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Reset everything
    resetCalendar: () => initialState,
  },
});

// Export actions
export const {
  setViewDate,
  setViewType,
  setTeamFilter,
  setEventTypeFilters,
  addEventTypeFilter,
  removeEventTypeFilter,
  setLocationFilter,
  toggleShowCanceled,
  selectEvent,
  openEventModal,
  closeEventModal,
  openResourceModal,
  closeResourceModal,
  resetFilters,
  resetCalendar,
} = calendarSlice.actions;

// Export reducer
export default calendarSlice.reducer;

// Selectors
export const selectViewDate = (state: RootState) => state.calendar.viewDate;
export const selectViewType = (state: RootState) => state.calendar.viewType;
export const selectCalendarFilters = (state: RootState) => state.calendar.filters;
export const selectTeamFilter = (state: RootState) => state.calendar.filters.teamId;
export const selectEventTypeFilters = (state: RootState) => state.calendar.filters.eventTypeIds;
export const selectLocationFilter = (state: RootState) => state.calendar.filters.locationId;
export const selectShowCanceled = (state: RootState) => state.calendar.filters.showCanceled;
export const selectSelectedEventId = (state: RootState) => state.calendar.selectedEventId;
export const selectIsEventModalOpen = (state: RootState) => state.calendar.isEventModalOpen;
export const selectIsResourceModalOpen = (state: RootState) => state.calendar.isResourceModalOpen;
```

### Handling Form State with React Hook Form

```typescript
// src/components/events/EventForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetLocationsQuery } from '@/store/api/calendarApi';
import { Event } from '@/types';
import { useTranslation } from 'react-i18next';

// Define the validation schema with zod
const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  eventTypeId: z.string().uuid('Invalid event type'),
  locationId: z.string().uuid('Invalid location').optional(),
});

// Type for the form inputs
type EventFormInputs = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<Event>;
  eventTypes: { id: string; name: string }[];
  onSubmit: (data: EventFormInputs) => void;
  isLoading: boolean;
}

const EventForm: React.FC<EventFormProps> = ({
  initialData,
  eventTypes,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation('calendar');
  const { data: locations } = useGetLocationsQuery();
  
  // Initialize the form
  const form = useForm<EventFormInputs>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime ? new Date(initialData.startTime) : new Date(),
      endTime: initialData?.endTime ? new Date(initialData.endTime) : new Date(Date.now() + 60 * 60 * 1000),
      eventTypeId: initialData?.eventTypeId || '',
      locationId: initialData?.locationId || undefined,
    },
  });
  
  // Form submission handler
  const handleSubmit = (data: EventFormInputs) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('event.title')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('event.titlePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('event.description')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('event.descriptionPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('event.startTime')}</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('event.endTime')}</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="eventTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('event.type')}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('event.selectType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('event.location')}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('event.selectLocation')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </Form>
  );
};

export default EventForm;
```

## Conclusion

This state management strategy ensures that the Hockey App frontend remains maintainable, performant, and consistent with the backend architecture. By following these guidelines, developers will be able to implement features efficiently while maintaining separation of concerns and appropriate data flow patterns.

Key benefits of this approach include:

1. **Consistent Patterns**: Standardized approach to Redux state management across the application
2. **Performance Optimization**: Strategic use of RTK Query for data fetching with caching and invalidation
3. **Type Safety**: Strong TypeScript integration for state, actions, and selectors
4. **Clear Boundaries**: Well-defined separation between global and local state
5. **Testability**: Easy-to-test components and state logic
6. **Developer Experience**: Efficient patterns for connecting components to state

This document should be used as a reference for all frontend development in the Hockey App project, and updated as additional patterns or requirements emerge.

For more detailed information, refer to the official Redux Toolkit and RTK Query documentation:
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
