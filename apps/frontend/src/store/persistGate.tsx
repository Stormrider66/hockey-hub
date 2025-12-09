'use client';

import React from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';

interface PersistGateWrapperProps {
  children: React.ReactNode;
}

// Loading component shown while rehydrating
const LoadingView = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading Hockey Hub...</p>
      </div>
    </div>
  );
};

// Error boundary for persist gate
class PersistErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PersistGate error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Saved Data
            </h2>
            <p className="text-gray-600 mb-4">
              There was a problem loading your saved data. You can continue with fresh data.
            </p>
            <button
              onClick={() => {
                // Clear persisted state and reload
                persistor.purge().then(() => {
                  window.location.reload();
                });
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Clear Data and Continue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main PersistGate wrapper component
export const PersistGateWrapper: React.FC<PersistGateWrapperProps> = ({ children }) => {
  return (
    <PersistErrorBoundary>
      <PersistGate
        loading={<LoadingView />}
        persistor={persistor}
        onBeforeLift={() => {
          // Optional: Add any initialization logic before lifting the persist gate
          console.log('Redux Persist: Rehydration starting...');
          
          // Check for problematic persisted state
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
              const persistedState = localStorage.getItem('persist:hockey-hub-root');
              if (persistedState) {
                const parsed = JSON.parse(persistedState);
                const hasApiSlices = Object.keys(parsed).some(key => key.endsWith('Api'));
                
                if (hasApiSlices) {
                  console.warn('Found RTK Query API slices in persisted state. These will be cleaned up.');
                }
              }
            } catch (error) {
              console.error('Error checking persisted state:', error);
            }
          }
        }}
      >
        {children}
      </PersistGate>
    </PersistErrorBoundary>
  );
};

// Utility hooks for persist operations
export const usePersistorPurge = () => {
  const purgePersistedState = async () => {
    try {
      await persistor.purge();
      console.log('Persisted state purged successfully');
    } catch (error) {
      console.error('Failed to purge persisted state:', error);
    }
  };

  return { purgePersistedState };
};

export const usePersistorFlush = () => {
  const flushPersistedState = async () => {
    try {
      await persistor.flush();
      console.log('Persisted state flushed successfully');
    } catch (error) {
      console.error('Failed to flush persisted state:', error);
    }
  };

  return { flushPersistedState };
};