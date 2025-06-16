import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer from './trainingSessionViewerSlice';
import { apiSlice } from '@/store/api/apiSlice';
import TrainingSessionViewer from './TrainingSessionViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Create the store with RTK-Query middleware
const store = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

interface SessionRouterProps {
  onBack?: () => void;
  userRole?: 'coach' | 'physical-trainer' | 'player' | 'parent';
}

export default function SessionRouter({ onBack, userRole = 'coach' }: SessionRouterProps) {
  const [view, setView] = useState<'session' | 'dashboard'>('session');

  return (
    <Provider store={store}>
      <div className="h-screen flex flex-col">
        {/* Header with navigation */}
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  // In a real app, this would use the router
                  console.log('Navigate back to dashboard');
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-sm text-muted-foreground">
              Logged in as: {userRole}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Training Session Viewer
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <TrainingSessionViewer />
        </div>
      </div>
    </Provider>
  );
}

// Example of how this would be used in a real app with routing
export function ExampleAppWithRouting() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'session'>('dashboard');
  const [userRole] = useState<'coach' | 'physical-trainer' | 'player' | 'parent'>('physical-trainer');

  if (currentView === 'session') {
    return (
      <SessionRouter
        userRole={userRole}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  // This would be your dashboard component
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Physical Training Dashboard</h1>
      <p className="mb-4">This is where your dashboard would be</p>
      <Button onClick={() => setCurrentView('session')}>
        Launch Training Session Viewer
      </Button>
    </div>
  );
} 