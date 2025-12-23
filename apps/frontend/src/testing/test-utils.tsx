import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { store as productionStore } from '@/store/store';
import { Toaster } from 'react-hot-toast';
// Use the same provider the app imports (aliased to mock via Jest config)
import { ChatSocketProvider } from '@/contexts/ChatSocketContext';

// Import your reducers
import authReducer from '@/store/slices/authSlice';
import trainingSessionViewerReducer from '@/store/slices/trainingSessionViewerSlice';
import { playerApi } from '@/store/api/playerApi';
import { authApi } from '@/store/api/authApi';
import { trainingApi } from '@/store/api/trainingApi';
import { medicalApi } from '@/store/api/medicalApi';
import { calendarApi } from '@/store/api/calendarApi';
import { statisticsApi } from '@/store/api/statisticsApi';
import { userApi } from '@/store/api/userApi';
import { scheduleApi } from '@/store/api/scheduleApi';
import { chatApi } from '@/store/api/chatApi';
import { privacyApi } from '@/store/api/privacyApi';
import { dashboardApi } from '@/store/api/dashboardApi';
import { scheduleClarificationApi } from '@/store/api/scheduleClarificationApi';
import chatReducer from '@/store/slices/chatSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: any;
  store?: any;
}

/**
 * Creates a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: any) {
  const reducers: Record<string, any> = {
    auth: authReducer,
    chat: chatReducer,
    trainingSessionViewer: trainingSessionViewerReducer,
  };

  const extraMiddlewares: any[] = [];
  const addApiSlice = (api: any) => {
    if (api?.reducerPath && typeof api.reducer === 'function') {
      reducers[api.reducerPath] = api.reducer;
    }
    if (typeof api?.middleware === 'function') {
      extraMiddlewares.push(api.middleware);
    }
  };

  [
    playerApi,
    authApi,
    trainingApi,
    medicalApi,
    calendarApi,
    statisticsApi,
    userApi,
    chatApi,
    scheduleApi,
    privacyApi,
    dashboardApi,
    scheduleClarificationApi,
  ].forEach(addApiSlice);

  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(...extraMiddlewares),
    preloadedState,
  });
}

/**
 * All providers that wrap the app
 */
function AllTheProviders({ children, store }: { children: React.ReactNode; store: any }) {
  return (
    <Provider store={store}>
      <Toaster position="top-right" />
      <ChatSocketProvider>{children}</ChatSocketProvider>
    </Provider>
  );
}

/**
 * Custom render method that includes all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllTheProviders store={store}>{children}</AllTheProviders>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Custom queries and utilities
export const getByTextContent = (text: string, element: HTMLElement = document.body): HTMLElement | null => {
  const hasText = (node: Element): boolean => {
    return node.textContent?.includes(text) || false;
  };

  const nodeFilter = (node: Node): number => {
    const hasMatchingText = hasText(node as Element);
    return hasMatchingText ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
  };

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, { acceptNode: nodeFilter });

  while (walker.nextNode()) {
    if (hasText(walker.currentNode as Element)) {
      return walker.currentNode as HTMLElement;
    }
  }

  return null;
};

// Mock data generators
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'player',
  organizationId: 'org-123',
  teamId: 'team-123',
  ...overrides,
});

export const createMockTrainingSession = (overrides?: Partial<any>) => ({
  id: 'session-123',
  title: 'Test Training Session',
  type: 'strength',
  status: 'scheduled',
  scheduledDate: new Date().toISOString(),
  duration: 60,
  location: 'Gym 1',
  trainerId: 'trainer-123',
  playerIds: ['player-1', 'player-2'],
  exercises: [],
  ...overrides,
});

export const createMockCalendarEvent = (overrides?: Partial<any>) => ({
  id: 'event-123',
  title: 'Test Event',
  type: 'training',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 3600000).toISOString(),
  location: 'Arena 1',
  description: 'Test event description',
  attendees: [],
  ...overrides,
});

// Async utilities
export const waitForElementToBeRemoved = async (callback: () => HTMLElement | null) => {
  const element = callback();
  if (!element) return;
  
  await new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(undefined);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};