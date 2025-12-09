"use client";

import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { PersistGateWrapper } from "@/src/store/persistGate";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { MockAuthProvider } from "@/src/components/auth/MockAuthProvider";
import { Toaster } from "react-hot-toast";
import { I18nextProvider } from "react-i18next";
import i18n from "@/src/lib/i18n-client";
import { useEffect, useState } from "react";
import { PerformanceProvider } from "@/src/providers/PerformanceProvider";
import { PerformanceErrorBoundary } from "@/src/components/error/PerformanceErrorBoundary";
import { LoadingSpinner } from "@/src/components/ui/loading";
import { ServiceWorkerProvider } from "@/src/components/providers/ServiceWorkerProvider";

// Import persist state utilities (they auto-register to window in dev)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/src/utils/clearPersistedState');
}

export function ProvidersFixed({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if already initialized
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      // Wait for initialization
      i18n.on('initialized', () => {
        setIsReady(true);
      });
    }
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <PerformanceErrorBoundary componentName="RootProviders">
      <PerformanceProvider
        config={{
          enableWebVitals: true,
          enableErrorTracking: true,
          enableApiTracking: true,
          environment: process.env.NODE_ENV
        }}
      >
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <PersistGateWrapper>
              <MockAuthProvider>
                <AuthProvider>
                  <ServiceWorkerProvider>
                    {children}
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                      }}
                    />
                  </ServiceWorkerProvider>
                </AuthProvider>
              </MockAuthProvider>
            </PersistGateWrapper>
          </Provider>
        </I18nextProvider>
      </PerformanceProvider>
    </PerformanceErrorBoundary>
  );
}